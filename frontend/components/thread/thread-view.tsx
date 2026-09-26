"use client";

import { useEffect, useState } from "react";

import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import { AgentAvatar } from "@/components/agent/agent-avatar";
import { useThreadQuery } from "@/hooks/useThread";
import { usePaymentRequirementsQuery } from "@/hooks/usePaymentRequirements";
import { relativeTimeFrom } from "@/lib/relative-time";
import type { AgentKey, PaymentRequirements, ThreadDetail } from "@/http/threads";
import { PostCard } from "./post-card";
import { VerdictCard } from "./verdict-card";

const ARTICLE_BADGE: Record<ThreadDetail["status"], { label: string; bg: string; fg: string }> = {
  live: { label: "NEEDS VALIDATION", bg: "#F3BA2F", fg: "#111111" },
  resolved: { label: "RESOLVED", bg: "#d1fae5", fg: "#065f46" },
  revise: { label: "NEEDS REVISION", bg: "#f5f5f5", fg: "#6b7280" },
  failed: { label: "FAILED", bg: "#fee2e2", fg: "#b91c1c" },
};

function ActiveTurnIndicator({ agentKey, startedAt }: { agentKey: AgentKey; startedAt: number }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.max(0, Math.round((Date.now() - startedAt) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const agent = getAgentRosterEntry(agentKey);

  return (
    <div className="flex items-center gap-[11px] rounded-xl px-6 py-4" style={{ border: "1px dashed #e5e7eb" }}>
      <AgentAvatar agentKey={agentKey} size={28} />
      <span className="text-sm" style={{ color: "#6b7280" }}>
        {agent.name} is thinking · {elapsedSeconds}s
      </span>
      <span className="flex gap-1">
        <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out infinite" }} />
        <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out .18s infinite" }} />
        <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out .36s infinite" }} />
      </span>
    </div>
  );
}

export function ThreadView({
  initialThread,
  payment: initialPayment,
}: {
  initialThread: ThreadDetail;
  payment: PaymentRequirements;
}) {
  const { data: thread } = useThreadQuery(initialThread.publicRef, initialThread);
  const { data: payment } = usePaymentRequirementsQuery(initialPayment);

  if (!thread) return null;

  const isWaitingForMore = thread.status === "live" && !thread.verdict && !thread.debateError;
  const badge = ARTICLE_BADGE[thread.status];
  const finished = Boolean(thread.verdict) || thread.status !== "live";
  const totalTokens =
    thread.posts.reduce((sum, post) => sum + (post.usage?.totalTokens ?? 0), 0) +
    (thread.verdict?.usage?.totalTokens ?? 0);

  return (
    <section className="flex flex-col gap-4 pt-2">
      <article className="rounded-xl p-8" style={{ border: "1px solid #e5e7eb" }}>
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-full px-2.5 py-[3px] font-mono text-[11px]"
            style={{ backgroundColor: badge.bg, color: badge.fg }}
          >
            {badge.label}
          </span>
          <span className="font-mono text-xs" style={{ color: "#898989" }}>
            thread {thread.publicRef} · opened {relativeTimeFrom(thread.openedAt)}
          </span>
        </div>

        <h1
          className="m-0 mb-4 font-display font-semibold text-ink"
          style={{ fontSize: "clamp(26px, 3.6vw, 36px)", letterSpacing: "-0.035em", lineHeight: 1.15 }}
        >
          {thread.title}
        </h1>

        <div className="mb-[18px] flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-full" style={{ backgroundColor: "#F3BA2F" }} />
          <span className="font-mono text-[13px]" style={{ color: "#374151" }}>
            {thread.authorAddress}
          </span>
          <span className="rounded-full px-[9px] py-0.5 text-xs" style={{ backgroundColor: "#f5f5f5", color: "#6b7280" }}>
            author
          </span>
        </div>

        <p className="m-0 mb-5 text-base leading-[1.55]" style={{ color: "#374151" }}>
          {thread.idea}
        </p>

        {thread.research && (
          <div className="rounded-xl p-6" style={{ backgroundColor: "#f5f5f5" }}>
            <div className="mb-3 text-[13px] font-medium" style={{ color: "#6b7280" }}>
              Author&apos;s own research
            </div>
            <div className="flex flex-col gap-2.5">
              {thread.research
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, index) => (
                  <div key={index} className="flex gap-2.5 text-[15px] leading-[1.55]" style={{ color: "#374151" }}>
                    <span style={{ color: "#898989" }}>—</span>
                    <span>{line}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3.5 px-1">
        <div className="flex items-center gap-2.5">
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: "#F3BA2F", animation: finished ? undefined : "pulse-dot 1.4s ease-in-out infinite" }}
          />
          <span className="text-sm font-medium text-ink">{finished ? "Debate closed" : "Debate in progress"}</span>
        </div>
        <span className="font-mono text-xs text-muted">
          {thread.posts.length} posts{totalTokens > 0 ? ` · ${totalTokens.toLocaleString()} tokens` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {thread.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {isWaitingForMore && thread.activeTurn && (
          <ActiveTurnIndicator agentKey={thread.activeTurn.agentKey} startedAt={thread.activeTurn.startedAt} />
        )}

        {isWaitingForMore && !thread.activeTurn && (
          <div className="flex items-center gap-[11px] rounded-xl px-6 py-4" style={{ border: "1px dashed #e5e7eb" }}>
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full font-mono text-[11px]"
              style={{ backgroundColor: "#f5f5f5", color: "#6b7280" }}
            >
              ···
            </span>
            <span className="text-sm" style={{ color: "#6b7280" }}>
              The council is drafting a response
            </span>
            <span className="flex gap-1">
              <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out infinite" }} />
              <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out .18s infinite" }} />
              <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: "#6b7280", animation: "bob 1.1s ease-in-out .36s infinite" }} />
            </span>
          </div>
        )}

        {(thread.debateError || thread.status === "failed") && !thread.verdict && (
          <div className="rounded-xl p-4 text-sm text-red-700" style={{ backgroundColor: "#fee2e2" }}>
            This debate failed to complete{thread.debateError ? `: ${thread.debateError}` : "."}
          </div>
        )}
      </div>

      {thread.verdict && (
        <VerdictCard
          verdict={thread.verdict}
          risks={thread.risks}
          payment={payment ?? initialPayment}
          totalTokens={totalTokens}
        />
      )}
    </section>
  );
}
