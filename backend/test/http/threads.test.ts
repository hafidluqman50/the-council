import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

// This suite exercises thread creation/listing, not payment gating — payment has its own
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
  body: "Mocked body.",
  references: [{ label: "Mock Source" }],
  confidence: 0.8,
  quoteOfAgentKey: "m2",
  quoteText: "Mocked quote.",
  position: "Mocked position.",
  statusText: "Mocked status.",
  score: 50,
  risks: [],
  conclusion: "Mocked conclusion.",
  unprovenGap: "Mocked gap.",
};

mock.module("langchain", () => ({
  createAgent: () => ({ invoke: async () => ({ structuredResponse: CANNED_RESPONSE }) }),
  toolStrategy: (schema: unknown) => schema,
}));

const { createApp } = await import("../../src/app/app");
const { Thread } = await import("../../src/model");
const { threadRepository } = await import("../../src/repository/ThreadRepository");
const createThread = threadRepository.create.bind(threadRepository);
const updateThreadStatus = threadRepository.updateStatus.bind(threadRepository);

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

describe("HTTP /threads", () => {
  test("POST /threads creates a thread and returns immediately, without waiting for the debate", async () => {
    const app = createApp();

    const response = await app.handle(
      new Request("http://localhost/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea: "A test idea.",
          research: "Some research.",
          authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
          payment: DUMMY_PAYMENT,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { publicRef: string; status: string } };
    expect(body.data.publicRef).toHaveLength(8);
    expect(body.data.status).toBe("LIVE");

    // The debate runs fire-and-forget with real on-chain confirmations per step now, against
    // real BSC Testnet (not a local fork) — give it enough time to finish before the next
    // test's beforeEach truncates the thread out from under it.
    await Bun.sleep(90_000);
  }, 120_000);

  test("GET /threads?status=LIVE only returns LIVE threads", async () => {
    const app = createApp();

    const live = await createThread({
      publicRef: "httptest1",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });
    const resolved = await createThread({
      publicRef: "httptest2",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });
    await updateThreadStatus(resolved.id, "RESOLVED");

    const response = await app.handle(new Request("http://localhost/threads?status=LIVE"));
    const body = (await response.json()) as { data: { id: string }[] };

    expect(body.data.map((thread) => thread.id)).toContain(live.id);
    expect(body.data.map((thread) => thread.id)).not.toContain(resolved.id);
  });

  test("GET /threads/:publicRef returns the full thread; a non-existent ref returns a NOT_FOUND error", async () => {
    const app = createApp();

    await createThread({
      publicRef: "httptest3",
      title: "t",
      idea: "The idea body.",
      research: "The research body.",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    const found = await app.handle(new Request("http://localhost/threads/httptest3"));
    const foundBody = (await found.json()) as { data: { idea: string } };
    expect(foundBody.data.idea).toBe("The idea body.");

    const missing = await app.handle(new Request("http://localhost/threads/does-not-exist"));
    const missingBody = (await missing.json()) as { error: { code: string } };
    expect(missingBody.error.code).toBe("NOT_FOUND");
  });
});
