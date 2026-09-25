import Link from "next/link";

import { AgentAvatar } from "@/components/agent/agent-avatar";
import { StatusBadge } from "@/components/ui/badge";
import { relativeTimeFrom } from "@/lib/relative-time";
import type { AgentKey, ThreadSummary } from "@/http/threads";

const COUNCIL_MEMBERS: AgentKey[] = ["m1", "m2", "m3", "tech"];

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ThreadCard({ thread }: { thread: ThreadSummary }) {
  return (
    <Link
      href={`/forum/${thread.id}`}
      className="flex flex-col gap-3.5 rounded-xl bg-canvas p-6 text-left transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ border: "1px solid #e5e7eb" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={thread.status} />
        <span className="font-mono text-xs" style={{ color: "#898989" }}>
          #{thread.id} · {truncateAddress(thread.authorAddress)} · {relativeTimeFrom(thread.openedAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[220px] flex-1">
          <div className="mb-2 font-display text-xl font-semibold leading-[1.3] text-ink" style={{ letterSpacing: "-0.025em" }}>
            {thread.title}
          </div>
          <div className="text-[15px] leading-[1.5]" style={{ color: "#6b7280" }}>
            {thread.excerpt}
          </div>
        </div>
        <div className="flex flex-none flex-col items-end gap-1">
          <span className="font-mono text-2xl font-medium leading-none text-ink">{thread.score ?? "··"}</span>
          <span className="font-mono text-[11px]" style={{ color: "#898989" }}>
            consensus
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#f3f4f6] pt-3.5 font-mono text-xs text-muted">
        <span>{thread.replyCount} replies</span>
        <span>{thread.sourceCount} sources cited</span>
        <span className="flex items-center gap-[5px]">
          {COUNCIL_MEMBERS.map((agentKey) => (
            <AgentAvatar key={agentKey} agentKey={agentKey} size={20} />
          ))}
        </span>
      </div>
    </Link>
  );
}
