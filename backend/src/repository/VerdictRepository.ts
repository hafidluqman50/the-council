import { Risk, Thread, Verdict } from "../model";
import type { Verdict as DebateVerdict } from "../service/agent/state";

export class VerdictRepository {
  async create(threadId: string, verdict: DebateVerdict, txHash: string): Promise<Verdict> {
    const created = await Verdict.create({
      threadId,
      statusText: verdict.statusText,
      score: verdict.score,
      conclusion: verdict.conclusion,
      unprovenGap: verdict.unprovenGap,
      txHash,
      durationMs: verdict.durationMs ?? null,
      promptTokens: verdict.usage?.promptTokens ?? null,
      completionTokens: verdict.usage?.completionTokens ?? null,
      totalTokens: verdict.usage?.totalTokens ?? null,
    });

    await Risk.bulkCreate(
      verdict.risks.map((risk, index) => ({
        threadId,
        ordinal: index + 1,
        label: risk.label,
        severity: risk.severity,
        note: risk.note,
      })),
    );

    await Thread.update(
      { consensusScore: verdict.score, closedAt: new Date(), status: "RESOLVED" },
      { where: { id: threadId } },
    );

    return created;
  }
}

export const verdictRepository = new VerdictRepository();
