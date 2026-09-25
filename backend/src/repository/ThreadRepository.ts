import { PostReference, Risk, Thread, ThreadPost, Verdict, type ThreadStatus } from "../model";

export class ThreadRepository {
  create(params: {
    id?: string;
    publicRef: string;
    title: string;
    idea: string;
    research: string;
    authorAddress: string;
  }): Promise<Thread> {
    return Thread.create(params);
  }

  findByPublicRef(publicRef: string): Promise<Thread | null> {
    return Thread.findOne({
      where: { publicRef },
      include: [
        {
          model: ThreadPost,
          as: "posts",
          include: [{ model: PostReference, as: "references" }],
          separate: true,
          order: [["sequence", "ASC"]],
        },
        { model: Verdict, as: "verdict" },
        { model: Risk, as: "risks", separate: true, order: [["ordinal", "ASC"]] },
      ],
    });
  }

  list(params: { status?: ThreadStatus }): Promise<Thread[]> {
    return Thread.findAll({
      where: params.status ? { status: params.status } : {},
      include: [
        {
          model: ThreadPost,
          as: "posts",
          attributes: ["id", "agentKey"],
          separate: true,
          include: [{ model: PostReference, as: "references", attributes: ["id"] }],
        },
      ],
      order: [["openedAt", "DESC"]],
    });
  }

  updateStatus(
    id: string,
    status: ThreadStatus,
    extra?: { consensusScore?: number; closedAt?: Date },
  ): Promise<[affectedCount: number]> {
    return Thread.update({ status, ...extra }, { where: { id } });
  }

  delete(id: string): Promise<number> {
    return Thread.destroy({ where: { id } });
  }
}

export const threadRepository = new ThreadRepository();
