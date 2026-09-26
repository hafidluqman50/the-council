"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { useCreateThreadMutation } from "@/hooks/useCreateThread";
import { usePaymentRequirementsQuery } from "@/hooks/usePaymentRequirements";
import { formatAtomicAmount } from "@/lib/format-hash";

function summarizeTitle(idea: string): string {
  const trimmed = idea.trim();
  if (!trimmed) return "Generated from your idea once you start writing.";

  const sentenceEndIndex = trimmed.search(/[.!?\n]/);
  const firstSentence = sentenceEndIndex === -1 ? trimmed : trimmed.slice(0, sentenceEndIndex);

  if (firstSentence.length <= 68) return firstSentence;
  return `${firstSentence.slice(0, 67).trimEnd()}…`;
}

const STAGE_LABEL: Record<string, string> = {
  idle: "Open debate",
  approving: "Approving spend…",
  signing: "Waiting for signature…",
  submitting: "Submitting…",
};

export function NewThreadComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { data: requirements } = usePaymentRequirementsQuery();
  const createThreadMutation = useCreateThreadMutation();
  const [idea, setIdea] = useState("");
  const [research, setResearch] = useState("");

  if (!open) return null;

  const titlePreview = summarizeTitle(idea);
  const canSubmit = idea.trim().length > 0 && isConnected && !createThreadMutation.isPending;
  const priceLabel = requirements?.enabled
    ? `5 agents · ${formatAtomicAmount(requirements.priceAtomic)} USDT`
    : "5 agents";

  function handleSubmit() {
    createThreadMutation.mutate(
      { idea, research },
      {
        onSuccess: (result) => {
          setIdea("");
          setResearch("");
          onClose();
          router.push(`/forum/${result.publicRef}`);
        },
      },
    );
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-[18px]"
      style={{ backgroundColor: "rgba(17,17,17,0.45)" }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[560px] flex-col rounded-2xl bg-canvas"
        style={{ maxHeight: "calc(100vh - 36px)", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}
      >
        <div className="flex flex-none items-start justify-between gap-3.5 p-8 pb-0">
          <div>
            <div className="font-display text-2xl font-semibold text-ink" style={{ letterSpacing: "-0.03em" }}>
              New thread
            </div>
            <div className="mt-1.5 text-[15px]" style={{ color: "#6b7280" }}>
              The council debates your idea against the research you bring.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
            style={{ border: "1px solid #e5e7eb", color: "#6b7280" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Business or project idea</label>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              rows={3}
              disabled={createThreadMutation.isPending}
              placeholder="Describe the Web3 or business idea you want the council to evaluate..."
              className="w-full resize-y rounded-lg p-[10px_14px] text-base leading-[1.5] text-ink outline-none disabled:opacity-60"
              style={{ border: "1px solid #e5e7eb" }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Your own research{" "}
              <span className="font-normal" style={{ color: "#6b7280" }}>
                — data, sources, or assumptions you want validated
              </span>
            </label>
            <textarea
              value={research}
              onChange={(event) => setResearch(event.target.value)}
              rows={4}
              disabled={createThreadMutation.isPending}
              placeholder="e.g. 62% of BSC DEX users are retail with tickets under $500 (DefiLlama, Sep 2026). My assumption: they will pay a 0.5% fee for automated vesting."
              className="w-full resize-y rounded-lg p-[10px_14px] text-base leading-[1.5] text-ink outline-none disabled:opacity-60"
              style={{ border: "1px solid #e5e7eb" }}
            />
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: "#f5f5f5" }}>
            <div className="mb-1.5 font-mono text-[11px]" style={{ color: "#6b7280" }}>
              THREAD TITLE · AUTO-SUMMARIZED
            </div>
            <div className="text-[15px] leading-[1.45]" style={{ color: idea.trim() ? "#111111" : "#898989" }}>
              {titlePreview}
            </div>
          </div>

          {createThreadMutation.isError && (
            <p className="text-sm text-red-600">
              {createThreadMutation.error instanceof Error
                ? createThreadMutation.error.message
                : "Could not submit the thread. Try again."}
            </p>
          )}
          {!isConnected && <p className="text-sm text-muted">Connect your wallet to submit a thread.</p>}
        </div>

        <div
          className="flex flex-none flex-wrap items-center justify-between gap-3 p-8 pt-5"
          style={{ borderTop: "1px solid #f3f4f6" }}
        >
          <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
            {priceLabel}
          </span>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="h-10 px-[22px]">
            {STAGE_LABEL[createThreadMutation.stage] ?? "Open debate"}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
