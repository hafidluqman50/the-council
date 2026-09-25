import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { Thread } from "../../src/model";
import { threadRepository } from "../../src/repository/ThreadRepository";

const { create: createThread, findByPublicRef: findThreadByPublicRef, list: listThreads, updateStatus: updateThreadStatus } =
  threadRepository;

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

describe("ThreadRepository", () => {
  test("create + findByPublicRef round-trips idea, research, and authorAddress", async () => {
    await createThread({
      publicRef: "test0001",
      title: "Test thread",
      idea: "A test idea.",
      research: "Some research.",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    const found = await findThreadByPublicRef("test0001");

    expect(found).not.toBeNull();
    expect(found?.idea).toBe("A test idea.");
    expect(found?.research).toBe("Some research.");
    expect(found?.authorAddress).toBe("0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc");
    expect(found?.status).toBe("LIVE");
  });

  test("findByPublicRef returns null for a non-existent ref", async () => {
    const found = await findThreadByPublicRef("does-not-exist");
    expect(found).toBeNull();
  });

  test("listThreads filters by status", async () => {
    const live = await createThread({
      publicRef: "test0002",
      title: "Live thread",
      idea: "idea",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });
    const resolved = await createThread({
      publicRef: "test0003",
      title: "Resolved thread",
      idea: "idea",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });
    await updateThreadStatus(resolved.id, "RESOLVED");

    const liveThreads = await listThreads({ status: "LIVE" });
    const resolvedThreads = await listThreads({ status: "RESOLVED" });

    expect(liveThreads.map((thread) => thread.id)).toContain(live.id);
    expect(liveThreads.map((thread) => thread.id)).not.toContain(resolved.id);
    expect(resolvedThreads.map((thread) => thread.id)).toContain(resolved.id);
  });
});
