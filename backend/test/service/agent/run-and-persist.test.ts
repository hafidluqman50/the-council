import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const CANNED_RESPONSE = {
  body: "Mocked argument body with a real claim.",
  references: [{ label: "Mock Source", url: "https://example.com" }],
  confidence: 0.8,
  quoteText: "Mocked quoted sentence.",
  position: "Mocked panel position statement.",
  statusText: "Mocked Status",
  score: 64,
  risks: [{ label: "Mock risk", severity: "medium", note: "Mock note" }],
  conclusion: "Mocked conclusion.",
  unprovenGap: "Mocked unproven gap.",
};

const OTHER_PANEL_MEMBER: Record<string, string> = {
  "Market Analyst α": "m2",
  "Market Analyst β": "m3",
  "Market Analyst γ": "m1",
};

const installBaselineMock = () => {
  mock.module("langchain", () => ({
    createAgent: (params: { systemPrompt: string }) => ({
      invoke: async () => {
        const speaker = Object.keys(OTHER_PANEL_MEMBER).find((name) => params.systemPrompt.includes(`You are ${name}`));
        const quoteOfAgentKey = speaker ? OTHER_PANEL_MEMBER[speaker] : undefined;
        return { structuredResponse: { ...CANNED_RESPONSE, ...(quoteOfAgentKey ? { quoteOfAgentKey } : {}) } };
      },
    }),
    toolStrategy: (schema: unknown) => schema,
  }));
};

installBaselineMock();

const { DebateRunner } = await import("../../../src/service/agent/DebateRunner");
const { threadRepository } = await import("../../../src/repository/ThreadRepository");
const { threadPostRepository } = await import("../../../src/repository/ThreadPostRepository");
const { verdictRepository } = await import("../../../src/repository/VerdictRepository");
const { Thread, ThreadPost } = await import("../../../src/model");

const createThread = threadRepository.create.bind(threadRepository);

// Stubs for both the chain service AND the agent-id lookup — this suite tests persistence
// ordering, not the real on-chain integration (verified separately against the live Anvil
// fork) or real Postgres agent rows, which every other test file in this run also depends on.
class StubThreadRegistryService {
  private sequences = new Map<string, number>();

  async openThread(): Promise<`0x${string}`> {
    return "0xstub";
  }

  async recordPost(params: { threadId: string }) {
    const next = (this.sequences.get(params.threadId) ?? 0) + 1;
    this.sequences.set(params.threadId, next);
    return { sequence: next, transactionHash: "0xstub" as `0x${string}` };
  }

  async recordVerdict(): Promise<`0x${string}`> {
    return "0xstub";
  }
}

class StubAgentIdLookup {
  async agentIdOf(): Promise<bigint> {
    return 1n;
  }
}

const buildRunner = () =>
  new DebateRunner(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new StubThreadRegistryService() as any,
    threadRepository,
    threadPostRepository,
    verdictRepository,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new StubAgentIdLookup() as any,
  );

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

describe("DebateRunner", () => {
  test("persists every post the mocked graph produces, and a verdict, in order", async () => {
    const thread = await createThread({
      publicRef: "test-run-1",
      title: "t",
      idea: "Test idea",
      research: "Test research",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    await buildRunner().run(thread.id, thread.idea, thread.research ?? "");

    const posts = await ThreadPost.findAll({ where: { threadId: thread.id }, order: [["sequence", "ASC"]] });
    expect(posts).toHaveLength(8);
    expect(posts.map((post) => post.agentKey)).toEqual(["orc", "m1", "m2", "m3", "m1", "m2", "m3", "tech"]);

    const reloaded = await Thread.findByPk(thread.id);
    expect(reloaded?.consensusScore).toBe(64);
    expect(reloaded?.closedAt).not.toBeNull();
  });

  describe("a thrown node", () => {
    afterEach(() => {
      installBaselineMock();
    });

    test("leaves prior posts persisted and writes no verdict", async () => {
      mock.module("langchain", () => ({
        createAgent: (params: { systemPrompt: string }) => ({
          invoke: async () => {
            if (params.systemPrompt.includes("You are Tech Validator")) {
              throw new Error("simulated node failure");
            }
            const speaker = Object.keys(OTHER_PANEL_MEMBER).find((name) =>
              params.systemPrompt.includes(`You are ${name}`),
            );
            const quoteOfAgentKey = speaker ? OTHER_PANEL_MEMBER[speaker] : undefined;
            return { structuredResponse: { ...CANNED_RESPONSE, ...(quoteOfAgentKey ? { quoteOfAgentKey } : {}) } };
          },
        }),
        toolStrategy: (schema: unknown) => schema,
      }));

      const thread = await createThread({
        publicRef: "test-run-2",
        title: "t",
        idea: "Test idea",
        research: "Test research",
        authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
      });

      await expect(buildRunner().run(thread.id, thread.idea, thread.research ?? "")).rejects.toThrow(
        "simulated node failure",
      );

      const posts = await ThreadPost.findAll({ where: { threadId: thread.id } });
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.every((post) => post.agentKey !== "tech")).toBe(true);

      // closedAt IS set here (unlike consensusScore) — a failed debate still closes the
      // thread out, per the FAILED-status fix shipped earlier this session.
      const reloaded = await Thread.findByPk(thread.id);
      expect(reloaded?.consensusScore).toBeNull();
      expect(reloaded?.closedAt).not.toBeNull();
    });
  });
});
