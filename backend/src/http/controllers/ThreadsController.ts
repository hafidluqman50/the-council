import { threadService, ThreadServiceError, type ThreadService } from "../../service/thread/ThreadService";
import type { PaymentPayload } from "../../service/payment";
import { failure, success } from "../response/envelope";

type CreateThreadBody = {
  idea: string;
  research: string;
  authorAddress: string;
  payment?: PaymentPayload;
};

export class ThreadsController {
  constructor(private readonly threadService: ThreadService) {}

  async create(body: CreateThreadBody) {
    try {
      const thread = await this.threadService.createThread(body);
      return success(thread.get({ plain: true }));
    } catch (error) {
      if (error instanceof ThreadServiceError) return failure(error.code, error.message);
      throw error;
    }
  }

  async list(query: { status?: string }) {
    const threads = await this.threadService.listThreads(query);
    return success(threads.map((thread) => thread.get({ plain: true })));
  }

  async get(params: { publicRef: string }) {
    try {
      const thread = await this.threadService.getThread(params.publicRef);
      return success(thread.get({ plain: true }));
    } catch (error) {
      if (error instanceof ThreadServiceError) return failure(error.code, error.message);
      throw error;
    }
  }
}

export const threadsController = new ThreadsController(threadService);
