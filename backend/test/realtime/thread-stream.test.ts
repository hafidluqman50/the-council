import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

// This suite exercises the WebSocket stream, not payment gating — payment has its own
// coverage elsewhere. `env.payment.enabled` is frozen from the shared .env at first import
// across the whole test run, so it can't be reliably toggled per-file; mock the gateway
// itself instead so this suite works regardless of that value.
mock.module("../../src/service/payment", () => ({
  paymentGateway: {
    verifyAndSettle: async () => ({ ok: true, txHash: "0xmocktxhash" }),
    recordSettlement: async () => undefined,
  },
}));

const DUMMY_PAYMENT = {
  token: "0x0000000000000000000000000000000000000001",
  payload: {
    authorization: {
      from: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
      to: "0x0000000000000000000000000000000000000002",
      value: "1000000000000000000",
      validAfter: 0,
      validBefore: 9999999999,
      nonce: "0x0000000000000000000000000000000000000000000000000000000000000",
    },
    signature: "0xmocksignature",
  },
};

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
      // Simulate real per-turn latency so a test client has a reliable window to connect
      // mid-debate, rather than the mocked debate completing before it can.
      await Bun.sleep(80);
      const speaker = Object.keys(OTHER_PANEL_MEMBER).find((name) => params.systemPrompt.includes(`You are ${name}`));
      const quoteOfAgentKey = speaker ? OTHER_PANEL_MEMBER[speaker] : undefined;
      return { structuredResponse: { ...CANNED_RESPONSE, ...(quoteOfAgentKey ? { quoteOfAgentKey } : {}) } };
    },
  }),
  toolStrategy: (schema: unknown) => schema,
}));

const { createApp } = await import("../../src/app/app");
const { registerRealtimeServer } = await import("../../src/service/realtime/thread-stream");
const { Thread } = await import("../../src/model");

const TEST_PORT = 8099;

beforeAll(() => {
  const app = createApp().listen(TEST_PORT);
  if (app.server) registerRealtimeServer(app.server);
});

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

type StreamMessage =
  | { type: "replay"; thread: { posts: unknown[]; status: string } }
  | { type: "post"; post: { agentKey: string } }
  | { type: "verdict"; verdict: unknown };

const collectUntilVerdict = (
  ws: WebSocket,
  onMessage?: (data: StreamMessage, messagesSoFar: StreamMessage[]) => void,
): Promise<StreamMessage[]> =>
  new Promise((resolve) => {
    const messages: StreamMessage[] = [];
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as StreamMessage;
      messages.push(data);
      onMessage?.(data, messages);
      if (data.type === "verdict") {
        ws.close();
        resolve(messages);
      }
    };
  });

describe("thread WebSocket stream", () => {
  test("a client connecting mid-debate replays exactly what is persisted so far, then continues live", async () => {
    const createResponse = await fetch(`http://localhost:${TEST_PORT}/threads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idea: "Test idea",
        research: "Test research",
        authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
        payment: DUMMY_PAYMENT,
      }),
    });
    const { data: thread } = (await createResponse.json()) as { data: { publicRef: string } };

    let connectLate: () => void = () => {};
    const lateClientShouldConnect = new Promise<void>((resolve) => {
      connectLate = resolve;
    });

    let postCount = 0;
    const earlyWs = new WebSocket(`ws://localhost:${TEST_PORT}/threads/${thread.publicRef}/stream`);
    const earlyMessages = collectUntilVerdict(earlyWs, (message) => {
      if (message.type === "post") {
        postCount += 1;
        // Connect the late client once some but not all posts exist — tied to actual
        // events rather than a wall-clock guess, so this can't race against system speed.
        if (postCount === 2) connectLate();
      }
    });

    await lateClientShouldConnect;

    const lateWs = new WebSocket(`ws://localhost:${TEST_PORT}/threads/${thread.publicRef}/stream`);
    const lateMessages = collectUntilVerdict(lateWs);

    const [early, late] = await Promise.all([earlyMessages, lateMessages]);

    const earlyReplay = early[0];
    const lateReplay = late[0];
    if (earlyReplay?.type !== "replay" || lateReplay?.type !== "replay") {
      throw new Error("expected the first message on each connection to be a replay");
    }

    expect(earlyReplay.thread.posts).toHaveLength(0);
    expect(lateReplay.thread.posts.length).toBeGreaterThan(0);
    expect(lateReplay.thread.posts.length).toBeLessThan(8);

    const earlyPostCount = early.filter((message) => message.type === "post").length;
    const latePostCount = late.filter((message) => message.type === "post").length;

    expect(earlyPostCount).toBe(8);
    expect(lateReplay.thread.posts.length + latePostCount).toBe(8);
  }, 120_000);
});
