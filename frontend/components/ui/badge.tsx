import type { ThreadStatus } from "@/http/threads";

const STATUS_LABEL: Record<ThreadStatus, string> = {
  live: "LIVE",
  resolved: "RESOLVED",
  revise: "REVISE",
  failed: "FAILED",
};

const STATUS_STYLE: Record<ThreadStatus, { bg: string; fg: string }> = {
  live: { bg: "#F3BA2F", fg: "#111111" },
  resolved: { bg: "#d1fae5", fg: "#065f46" },
  revise: { bg: "#f5f5f5", fg: "#6b7280" },
  failed: { bg: "#fee2e2", fg: "#b91c1c" },
};

export function StatusBadge({ status }: { status: ThreadStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px]"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
