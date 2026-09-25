import { describe, expect, test } from "bun:test";

import { runCouncilDebate } from "../../../src/service/agent/council-graph";
import type { AgentKey, DebatePost } from "../../../src/service/agent/state";
import { AGENT_DEFINITIONS } from "../../../src/service/agent/prompts/agents";
import { LAUNCHPAD_VESTING_IDEA, LAUNCHPAD_VESTING_RESEARCH } from "../../fixtures/idea-launchpad-vesting";

const printTranscript = (posts: DebatePost[]) => {
  for (const post of posts) {
    const name = AGENT_DEFINITIONS[post.agentKey as AgentKey].name;
    const quote = post.quoteOfAgentKey
      ? `\n  ▸ quoting ${AGENT_DEFINITIONS[post.quoteOfAgentKey].name}: "${post.quoteText}"`
      : "";
    const refs = post.references.length > 0 ? post.references.map((reference) => reference.label).join("; ") : "(none)";

    console.log(`\n[${name}] Round ${post.round}${quote}\n${post.body}\nReferences: ${refs}`);
  }
};

describe("council graph, live", () => {
  test.skipIf(process.env.RUN_LIVE_DEBATE !== "true")(
    "runs the full one-round debate against the launchpad vesting fixture and prints the transcript",
    async () => {
      const finalState = await runCouncilDebate(LAUNCHPAD_VESTING_IDEA, LAUNCHPAD_VESTING_RESEARCH);

      printTranscript(finalState.posts);

      console.log(`\n--- VERDICT ---\n${JSON.stringify(finalState.verdict, null, 2)}`);

      expect(finalState.posts).toHaveLength(8);
      expect(finalState.verdict).toBeDefined();

      const rebuttalPosts = finalState.posts.filter((post) => post.quoteOfAgentKey !== undefined);
      expect(rebuttalPosts.length).toBeGreaterThan(0);
    },
    300_000,
  );
});
