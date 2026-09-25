import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import { AgentAvatar } from "@/components/agent/agent-avatar";
import { MarkdownBody } from "@/components/markdown/markdown-body";
import { alpha } from "@/lib/color";
import { BSC_TESTNET_EXPLORER_TX_URL, formatDuration, truncateHash } from "@/lib/format-hash";
import { derivePostTag } from "@/lib/post-tag";
import type { ThreadPost } from "@/http/threads";

function formatStamp(sequence: number): string {
  return `#${String(sequence).padStart(2, "0")}`;
}

export function PostCard({ post }: { post: ThreadPost }) {
  const agent = getAgentRosterEntry(post.agentKey);
  const quotedAgent = post.quoteOfAgentKey ? getAgentRosterEntry(post.quoteOfAgentKey) : null;
  const isReply = Boolean(post.quoteOfAgentKey);
  const tag = derivePostTag(post);
  const chipBg = alpha(agent.color, 0.1);

  const confidenceLabel = post.confidence === null ? "—" : `${Math.round(post.confidence * 100)}% confidence`;
  const sourcesLabel = post.references.length === 0 ? "no sources" : `${post.references.length} sources`;

  return (
    <article
      className="rounded-xl p-6"
      style={{
        marginLeft: isReply ? 34 : 0,
        border: "1px solid #e5e7eb",
        backgroundColor: isReply ? "#f8f9fa" : "#ffffff",
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <AgentAvatar agentKey={post.agentKey} size={36} />
        <span className="text-base font-semibold text-ink">{agent.name}</span>
        <span
          className="rounded-full px-2.5 py-[3px] font-mono text-[11px]"
          style={{ backgroundColor: chipBg, color: agent.color }}
        >
          {tag}
        </span>
        <span className="ml-auto font-mono text-xs" style={{ color: "#898989" }}>
          {formatStamp(post.sequence)}
        </span>
      </div>

      {quotedAgent && post.quoteText && (
        <div className="mb-3 border-l-2 py-0.5 pl-3.5" style={{ borderColor: "#e5e7eb" }}>
          <div className="mb-1 font-mono text-[11px]" style={{ color: "#898989" }}>
            ▸ {quotedAgent.name} wrote:
          </div>
          <MarkdownBody className="text-sm leading-[1.5]" style={{ color: "#6b7280" }}>
            {post.quoteText}
          </MarkdownBody>
        </div>
      )}

      <MarkdownBody>{post.body}</MarkdownBody>

      {post.references.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg" style={{ border: "1px solid #e5e7eb" }}>
          <div
            className="px-3.5 py-2.5 font-mono text-[11px]"
            style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f8f9fa", color: "#6b7280" }}
          >
            SOURCES
          </div>
          {post.references.map((reference, index) => (
            <a
              key={index}
              href={reference.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-baseline gap-2.5 px-3.5 py-[11px]"
              style={{ borderTop: index > 0 ? "1px solid #f3f4f6" : undefined, color: "inherit" }}
            >
              <span className="whitespace-nowrap font-mono text-[11px]" style={{ color: agent.color }}>
                [{index + 1}]
              </span>
              <span className="text-sm font-medium text-ink">{reference.label}</span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-4 font-mono text-xs" style={{ color: "#898989" }}>
        <span>{confidenceLabel}</span>
        <span>{sourcesLabel}</span>
        {post.durationMs !== null && <span>{formatDuration(post.durationMs)}</span>}
        {post.usage && <span>{post.usage.totalTokens.toLocaleString()} tokens</span>}
        {post.txHash && (
          <a
            href={`${BSC_TESTNET_EXPLORER_TX_URL}${post.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#065f46" }}
          >
            on-chain · {truncateHash(post.txHash)} ↗
          </a>
        )}
      </div>
    </article>
  );
}
