import { describe, expect, mock, test } from "bun:test";

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

const { buildCouncilGraph } = await import("../../../src/service/agent/council-graph");

describe("council graph, LLM mocked", () => {
  test("every post carries round 1 — the debate no longer has a second round", async () => {
    const graph = buildCouncilGraph();
    const finalState = await graph.invoke({ idea: "Test idea", research: "Test research", posts: [] });

    for (const post of finalState.posts) {
      expect(post.round).toBe(1);
    }
  });

  test("orchestrator framing posts carry no reference; every other post carries at least one", async () => {
    const graph = buildCouncilGraph();
    const finalState = await graph.invoke({ idea: "Test idea", research: "Test research", posts: [] });

    const orchestratorPosts = finalState.posts.filter((post) => post.agentKey === "orc");
    const substantivePosts = finalState.posts.filter((post) => post.agentKey !== "orc");

    expect(orchestratorPosts).toHaveLength(1);
    for (const post of orchestratorPosts) {
      expect(post.references).toEqual([]);
    }
    for (const post of substantivePosts) {
      expect(post.references.length).toBeGreaterThan(0);
    }
  });

  test("produces exactly the expected post count and speaker sequence", async () => {
    const graph = buildCouncilGraph();
    const finalState = await graph.invoke({ idea: "Test idea", research: "Test research", posts: [] });

    const speakerSequence = finalState.posts.map((post) => post.agentKey);
    expect(speakerSequence).toEqual(["orc", "m1", "m2", "m3", "m1", "m2", "m3", "tech"]);
  });

  test("verdict shape: score is an integer 0-100, unprovenGap is non-empty", async () => {
    const graph = buildCouncilGraph();
    const finalState = await graph.invoke({ idea: "Test idea", research: "Test research", posts: [] });

    expect(finalState.verdict).toBeDefined();
    expect(Number.isInteger(finalState.verdict?.score)).toBe(true);
    expect(finalState.verdict?.score).toBeGreaterThanOrEqual(0);
    expect(finalState.verdict?.score).toBeLessThanOrEqual(100);
    expect(finalState.verdict?.unprovenGap.length).toBeGreaterThan(0);
  });

  test("rebuttal posts never quote themselves", async () => {
    const graph = buildCouncilGraph();
    const finalState = await graph.invoke({ idea: "Test idea", research: "Test research", posts: [] });

    const rebuttalPosts = finalState.posts.filter((post) => post.quoteOfAgentKey !== undefined);
    expect(rebuttalPosts).toHaveLength(3);
    for (const post of rebuttalPosts) {
      expect(post.quoteOfAgentKey).not.toBe(post.agentKey);
    }
  });
});
