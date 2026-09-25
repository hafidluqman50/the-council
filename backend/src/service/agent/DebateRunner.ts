import { keccak256, toHex, type Hex } from "viem";

import { threadPostRepository, type ThreadPostRepository } from "../../repository/ThreadPostRepository";
import { threadRepository, type ThreadRepository } from "../../repository/ThreadRepository";
import { verdictRepository, type VerdictRepository } from "../../repository/VerdictRepository";
import { threadRegistryService } from "../chain";
import { ThreadIdentifier } from "../chain/ThreadIdentifier";
import type { ThreadRegistryService } from "../chain/ThreadRegistryService";
import { broadcastToThread } from "../realtime/thread-stream";
import { agentIdLookup, type AgentIdLookup } from "./AgentIdLookup";
import { buildCouncilGraph } from "./council-graph";
import type { DebatePost, Verdict } from "./state";

type NodeUpdate = { posts?: DebatePost[]; verdict?: Verdict };

export class DebateRunner {
  constructor(
    private readonly threadRegistryService: ThreadRegistryService,
    private readonly threadRepository: ThreadRepository,
    private readonly threadPostRepository: ThreadPostRepository,
    private readonly verdictRepository: VerdictRepository,
    private readonly agentIdLookup: AgentIdLookup,
  ) {}

  /** The thread must already be opened on-chain (`ThreadRegistryService.openThread`, called by
   * the controller before the Postgres row even exists) — this only handles posts and the verdict. */
  async run(threadId: string, idea: string, research: string): Promise<void> {
    const threadIdHash = ThreadIdentifier.hashOf(threadId);
    const controller = new AbortController();

    try {
      const graph = buildCouncilGraph();
      const stream = await graph.stream(
        { idea, research, posts: [] },
        { streamMode: "updates", signal: controller.signal },
      );

      for await (const chunk of stream) {
        for (const update of Object.values(chunk) as NodeUpdate[]) {
          if (update.posts) {
            for (const post of update.posts) {
              await this.recordAndPersistPost(threadId, threadIdHash, post);
            }
          }

          if (update.verdict) {
            await this.recordAndPersistVerdict(threadId, threadIdHash, update.verdict);
          }
        }
      }
    } catch (error) {
      // Without this, a post-recording failure (e.g. a bad DB lookup) only stopped *this*
      // consumer loop — the graph's later nodes kept running underneath, still making real
      // web_search/DeepSeek calls for a thread that was already marked FAILED. Aborting here
      // is what actually stops that wasted spend, not just the visible error.
      controller.abort();
      const message = error instanceof Error ? error.message : String(error);
      await this.threadRepository.updateStatus(threadId, "FAILED", { closedAt: new Date() });
      broadcastToThread(threadId, { type: "error", message });
      throw error;
    }
  }

  private async recordAndPersistPost(threadId: string, threadIdHash: Hex, post: DebatePost): Promise<void> {
    const agentId = await this.agentIdLookup.agentIdOf(post.agentKey);
    const contentHash = keccak256(toHex(post.body)) as Hex;

    const { sequence, transactionHash } = await this.threadRegistryService.recordPost({
      threadId: threadIdHash,
      agentKey: post.agentKey,
      agentId,
      round: post.round,
      contentHash,
    });

    const saved = await this.threadPostRepository.append(threadId, sequence, post, transactionHash);
    broadcastToThread(threadId, { type: "post", post: saved.get({ plain: true }) });
  }

  private async recordAndPersistVerdict(threadId: string, threadIdHash: Hex, verdict: Verdict): Promise<void> {
    const agentId = await this.agentIdLookup.agentIdOf("orc");
    const verdictHash = keccak256(toHex(JSON.stringify(verdict))) as Hex;

    const transactionHash = await this.threadRegistryService.recordVerdict({
      threadId: threadIdHash,
      agentKey: "orc",
      agentId,
      score: verdict.score,
      verdictHash,
    });

    const saved = await this.verdictRepository.create(threadId, verdict, transactionHash);
    broadcastToThread(threadId, { type: "verdict", verdict: saved.get({ plain: true }) });
  }
}

export const debateRunner = new DebateRunner(
  threadRegistryService,
  threadRepository,
  threadPostRepository,
  verdictRepository,
  agentIdLookup,
);
