import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { Risk, Thread } from "../../src/model";
import { threadRepository } from "../../src/repository/ThreadRepository";
import { verdictRepository } from "../../src/repository/VerdictRepository";
import type { Verdict as DebateVerdict } from "../../src/service/agent/state";

const createThread = threadRepository.create.bind(threadRepository);
const createVerdict = verdictRepository.create.bind(verdictRepository);

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

describe("VerdictRepository", () => {
  test("createVerdict persists risks and updates the thread's consensus_score and closed_at", async () => {
    const thread = await createThread({
      publicRef: "test-verdict-1",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    expect(thread.closedAt).toBeNull();
    expect(thread.consensusScore).toBeNull();

    const verdict: DebateVerdict = {
      statusText: "REJECTED",
      score: 12,
      risks: [
        { label: "Risk one", severity: "high", note: "Note one" },
        { label: "Risk two", severity: "medium" },
      ],
      conclusion: "Conclusion text.",
      unprovenGap: "Unproven gap text.",
    };

    await createVerdict(thread.id, verdict, "0xmocktxhash");

    const risks = await Risk.findAll({ where: { threadId: thread.id }, order: [["ordinal", "ASC"]] });
    expect(risks).toHaveLength(2);
    expect(risks[0]?.label).toBe("Risk one");
    expect(risks[0]?.severity).toBe("high");
    expect(risks[1]?.note).toBeNull();

    const reloaded = await Thread.findByPk(thread.id);
    expect(reloaded?.consensusScore).toBe(12);
    expect(reloaded?.closedAt).not.toBeNull();
  });
});
