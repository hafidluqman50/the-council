import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { PostReference, Thread, ThreadPost } from "../../src/model";
import { threadRepository } from "../../src/repository/ThreadRepository";
import { threadPostRepository } from "../../src/repository/ThreadPostRepository";
import type { DebatePost } from "../../src/service/agent/state";

const createThread = threadRepository.create.bind(threadRepository);
let nextSequence = 1;
const appendPost = (threadId: string, post: DebatePost) =>
  threadPostRepository.append(threadId, nextSequence++, post, "0xmocktxhash");

beforeEach(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await Thread.destroy({ where: {}, truncate: true, cascade: true });
});

describe("ThreadPostRepository", () => {
  test("appendPost assigns sequence 1, 2, 3 across repeated calls, in order", async () => {
    const thread = await createThread({
      publicRef: "test-seq-1",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    const first: DebatePost = { agentKey: "orc", round: 1, body: "First.", references: [] };
    const second: DebatePost = { agentKey: "m1", round: 1, body: "Second.", references: [{ label: "Source" }] };
    const third: DebatePost = { agentKey: "m2", round: 1, body: "Third.", references: [] };

    await appendPost(thread.id, first);
    await appendPost(thread.id, second);
    await appendPost(thread.id, third);

    const posts = await ThreadPost.findAll({ where: { threadId: thread.id }, order: [["sequence", "ASC"]] });

    expect(posts.map((post) => post.sequence)).toEqual([1, 2, 3]);
    expect(posts.map((post) => post.body)).toEqual(["First.", "Second.", "Third."]);
  });

  test("references persist with correct ordinal", async () => {
    const thread = await createThread({
      publicRef: "test-seq-2",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    const post: DebatePost = {
      agentKey: "m1",
      round: 1,
      body: "Body.",
      references: [{ label: "First source", url: "https://a.example" }, { label: "Second source" }],
    };

    const saved = await appendPost(thread.id, post);
    const references = await PostReference.findAll({ where: { postId: saved.id }, order: [["ordinal", "ASC"]] });

    expect(references).toHaveLength(2);
    expect(references[0]?.ordinal).toBe(1);
    expect(references[0]?.label).toBe("First source");
    expect(references[0]?.url).toBe("https://a.example");
    expect(references[1]?.ordinal).toBe(2);
    expect(references[1]?.url).toBeNull();
  });

  test("quoteOfAgentKey and quoteText persist when present", async () => {
    const thread = await createThread({
      publicRef: "test-seq-3",
      title: "t",
      idea: "i",
      research: "",
      authorAddress: "0x7267Ce0f6D4E866653C1d84A52aE875aeB05BCdc",
    });

    const post: DebatePost = {
      agentKey: "m1",
      round: 1,
      body: "Rebuttal.",
      references: [{ label: "Source" }],
      quoteOfAgentKey: "m2",
      quoteText: "The exact quoted sentence.",
    };

    const saved = await appendPost(thread.id, post);

    expect(saved.quoteOfAgentKey).toBe("m2");
    expect(saved.quoteText).toBe("The exact quoted sentence.");
  });
});
