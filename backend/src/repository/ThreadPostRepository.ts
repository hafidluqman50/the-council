import { PostReference, ThreadPost } from "../model";
import type { DebatePost } from "../service/agent/state";

export class ThreadPostRepository {
  /** `sequence` must come from the on-chain confirmation (`ThreadRegistryService.recordPost`) —
   * the chain is the source of truth for ordering, not a locally-recomputed counter. */
  async append(threadId: string, sequence: number, post: DebatePost, txHash: string): Promise<ThreadPost> {
    const created = await ThreadPost.create({
      threadId,
      agentKey: post.agentKey,
      round: post.round,
      sequence,
      body: post.body,
      confidence: post.confidence,
      quoteOfAgentKey: post.quoteOfAgentKey,
      quoteText: post.quoteText,
      txHash,
      durationMs: post.durationMs ?? null,
      promptTokens: post.usage?.promptTokens ?? null,
      completionTokens: post.usage?.completionTokens ?? null,
      totalTokens: post.usage?.totalTokens ?? null,
    });

    await PostReference.bulkCreate(
      post.references.map((reference, index) => ({
        postId: created.id,
        ordinal: index + 1,
        label: reference.label,
        url: reference.url,
      })),
    );

    return created;
  }
}

export const threadPostRepository = new ThreadPostRepository();
