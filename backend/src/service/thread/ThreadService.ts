import { randomUUID } from "node:crypto";

import { env } from "../../config/env";
import { logger } from "../../logger/logger";
import type { Thread, ThreadStatus } from "../../model";
import { threadRepository, type ThreadRepository } from "../../repository/ThreadRepository";
import { debateRunner, type DebateRunner } from "../agent/DebateRunner";
import { threadRegistryService } from "../chain";
import { ThreadIdentifier } from "../chain/ThreadIdentifier";
import type { ThreadRegistryService } from "../chain/ThreadRegistryService";
import { paymentGateway, type PaymentPayload } from "../payment";
import type { PaymentGateway } from "../payment/PaymentGateway";
import { ThreadServiceError } from "./ThreadServiceError";

export { ThreadServiceError };

type CreateThreadInput = {
  idea: string;
  research: string;
  authorAddress: string;
  payment?: PaymentPayload;
};

export class ThreadService {
  constructor(
    private readonly threadRepository: ThreadRepository,
    private readonly threadRegistryService: ThreadRegistryService,
    private readonly paymentGateway: PaymentGateway,
    private readonly debateRunner: DebateRunner,
  ) {}

  async createThread(input: CreateThreadInput): Promise<Thread> {
    const id = randomUUID();
    const publicRef = id.slice(0, 8);
    const threadIdHash = ThreadIdentifier.hashOf(id);
    const ideaHash = ThreadIdentifier.ideaHashOf(input.idea);

    // Order matters: every on-chain action (payment settlement, then opening the thread)
    // must happen before the first Postgres write. Settling payment after the thread
    // already existed off-chain meant a rejected payment still left a permanent,
    // unpaid-for thread open on-chain — this is the ordering that fixes that.
    let settledTxHash: string | undefined;

    if (env.payment.enabled) {
      if (!input.payment) {
        throw new ThreadServiceError("PAYMENT_REQUIRED", "This thread requires a signed payment authorization");
      }

      const gateResult = await this.paymentGateway.verifyAndSettle(input.payment);
      if (!gateResult.ok) {
        throw new ThreadServiceError(gateResult.code, gateResult.message);
      }
      settledTxHash = gateResult.txHash;
    }

    try {
      await this.threadRegistryService.openThread(threadIdHash, input.authorAddress as `0x${string}`, ideaHash);
    } catch (error) {
      logger.error("openThread failed", { error: String(error) });
      throw new ThreadServiceError("CHAIN_UNAVAILABLE", "Could not open this thread on-chain — nothing was created");
    }

    const thread = await this.threadRepository.create({
      id,
      publicRef,
      title: input.idea.trim().slice(0, 68),
      idea: input.idea,
      research: input.research,
      authorAddress: input.authorAddress,
    });

    if (settledTxHash && input.payment) {
      await this.paymentGateway.recordSettlement(thread.id, input.payment, settledTxHash);
    }

    this.debateRunner.run(thread.id, thread.idea, thread.research ?? "").catch((error) => {
      logger.error("debate run failed", { threadId: thread.id, error: String(error) });
    });

    return thread;
  }

  listThreads(query: { status?: string }): Promise<Thread[]> {
    return this.threadRepository.list({ status: query.status as ThreadStatus | undefined });
  }

  async getThread(publicRef: string): Promise<Thread> {
    const thread = await this.threadRepository.findByPublicRef(publicRef);
    if (!thread) {
      throw new ThreadServiceError("NOT_FOUND", "Thread not found");
    }
    return thread;
  }

}

export const threadService = new ThreadService(threadRepository, threadRegistryService, paymentGateway, debateRunner);
