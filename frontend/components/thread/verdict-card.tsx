import { BSC_TESTNET_EXPLORER_TX_URL, formatAtomicAmount, formatDuration, truncateHash } from "@/lib/format-hash";
import type { PaymentRequirements, Risk, Verdict } from "@/http/threads";

const SEVERITY_META: Record<Risk["severity"], { color: string; width: number }> = {
  high: { color: "#dc2626", width: 90 },
  medium: { color: "#F3BA2F", width: 55 },
  low: { color: "#6b7280", width: 25 },
};

function verdictTier(score: number): { bg: string; color: string } {
  if (score >= 70) return { bg: "#d1fae5", color: "#065f46" };
  if (score >= 40) return { bg: "#F3BA2F", color: "#111111" };
  return { bg: "#f5f5f5", color: "#6b7280" };
}

export function VerdictCard({
  verdict,
  risks,
  payment,
  totalTokens,
}: {
  verdict: Verdict;
  risks: Risk[];
  payment: PaymentRequirements;
  totalTokens: number;
}) {
  const tier = verdictTier(verdict.score);
  const dialDegrees = verdict.score * 3.6;
  const shownRisks = risks.slice(0, 3);

  return (
    <section
      className="mt-2 grid gap-8 rounded-xl p-8"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", backgroundColor: "#f5f5f5" }}
    >
      <div className="flex items-center gap-[22px]">
        <div
          className="relative h-[120px] w-[120px] flex-none rounded-full"
          style={{ background: `conic-gradient(#F3BA2F ${dialDegrees}deg, #e5e7eb ${dialDegrees}deg)` }}
        >
          <div
            className="absolute flex flex-col items-center justify-center rounded-full"
            style={{ inset: 11, backgroundColor: "#f5f5f5" }}
          >
            <span className="font-display text-[34px] font-semibold leading-none text-ink" style={{ letterSpacing: "-0.03em" }}>
              {verdict.score}
            </span>
            <span className="mt-1 font-mono text-[11px]" style={{ color: "#6b7280" }}>
              of 100
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-2 text-[13px] font-medium" style={{ color: "#6b7280" }}>
            Consensus score
          </div>
          <div
            className="inline-flex rounded-full px-3 py-[5px] text-sm font-semibold"
            style={{ backgroundColor: tier.bg, color: tier.color }}
          >
            {verdict.statusText}
          </div>
          <p className="m-0 mt-3 max-w-[320px] text-[15px] leading-[1.55]" style={{ color: "#374151" }}>
            {verdict.conclusion}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3.5">
        {shownRisks.length > 0 ? (
          shownRisks.map((risk, index) => {
            const meta = SEVERITY_META[risk.severity];
            return (
              <div key={index}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {risk.label}
                  </span>
                  <span className="font-mono text-sm uppercase text-ink">{risk.severity}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
                  <div className="h-full rounded-full" style={{ width: `${meta.width}%`, backgroundColor: meta.color }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm" style={{ color: "#6b7280" }}>
            No named risks.
          </p>
        )}
      </div>

      <div className="flex flex-col justify-center gap-3.5">
        <div className="flex flex-col gap-2 font-mono text-xs" style={{ color: "#6b7280" }}>
          <div className="flex justify-between gap-3">
            <span>standard</span>
            <span style={{ color: "#111111" }}>ERC-8004</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>payment rail</span>
            <span style={{ color: "#111111" }}>
              b402 · {formatAtomicAmount(payment.priceAtomic)} {payment.enabled ? "USDT" : "(disabled)"}
            </span>
          </div>
          {totalTokens > 0 && (
            <div className="flex justify-between gap-3">
              <span>total tokens</span>
              <span style={{ color: "#111111" }}>{totalTokens.toLocaleString()}</span>
            </div>
          )}
          {verdict.durationMs !== null && (
            <div className="flex justify-between gap-3">
              <span>verdict turn</span>
              <span style={{ color: "#111111" }}>{formatDuration(verdict.durationMs)}</span>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-center text-[13px] leading-[1.5]"
          style={{ backgroundColor: "#d1fae5", color: "#065f46" }}
        >
          <span aria-hidden>✓</span>
          <span>
            {verdict.txHash ? (
              <a
                href={`${BSC_TESTNET_EXPLORER_TX_URL}${verdict.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#065f46" }}
              >
                Verdict recorded on-chain · {truncateHash(verdict.txHash)} ↗
              </a>
            ) : (
              "Verdict recorded on-chain"
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
