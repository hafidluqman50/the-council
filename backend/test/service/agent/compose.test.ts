import { describe, expect, test } from "bun:test";

import { composeUserContent } from "../../../src/service/agent/agents/shared";
import type { DebatePost } from "../../../src/service/agent/state";

const IDEA = "A launchpad for small BSC teams, 0.5% fee paid in BNB, investor vesting enforced on-chain.";
const RESEARCH = "128 new BEP-20 tokens launched per month through Q3 2026.";

describe("composeUserContent", () => {
  test("includes the idea and research verbatim", () => {
    const content = composeUserContent({ idea: IDEA, research: RESEARCH, postsSoFar: [] });

    expect(content).toContain(IDEA);
    expect(content).toContain(RESEARCH);
    expect(content).toContain("THREAD SO FAR");
  });

  test("is deterministic for the same input", () => {
    const first = composeUserContent({ idea: IDEA, research: RESEARCH, postsSoFar: [] });
    const second = composeUserContent({ idea: IDEA, research: RESEARCH, postsSoFar: [] });

    expect(first).toBe(second);
  });

  test("appending a post grows the content without mutating what came before it", () => {
    const before = composeUserContent({
      idea: IDEA,
      research: RESEARCH,
      postsSoFar: [{ agentKey: "orc", round: 1, body: "Opening statement.", references: [] }],
    });

    const after = composeUserContent({
      idea: IDEA,
      research: RESEARCH,
      postsSoFar: [
        { agentKey: "orc", round: 1, body: "Opening statement.", references: [] },
        { agentKey: "m1", round: 1, body: "Demand is real.", references: [{ label: "Source" }] },
      ],
    });

    expect(after.startsWith(before)).toBe(true);
  });

  test("never includes a timestamp or random id", () => {
    const postsSoFar: DebatePost[] = [{ agentKey: "orc", round: 1, body: "Opening statement.", references: [] }];
    const content = composeUserContent({ idea: IDEA, research: RESEARCH, postsSoFar });

    expect(content).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(content).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
  });

  test("an empty research string is serialized as a stable, explicit placeholder, not omitted", () => {
    const withResearch = composeUserContent({ idea: IDEA, research: RESEARCH, postsSoFar: [] });
    const withoutResearch = composeUserContent({ idea: IDEA, research: "", postsSoFar: [] });

    expect(withoutResearch).toContain("none provided");
    expect(withoutResearch.length).toBeGreaterThan(0);
    expect(withResearch).not.toBe(withoutResearch);
  });
});
