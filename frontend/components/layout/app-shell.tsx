"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";

import { AgentAvatar } from "@/components/agent/agent-avatar";
import { AGENT_ROSTER } from "@/components/agent/agent-roster";
import { CouncilMark } from "@/components/brand/council-mark";
import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";

export function AppShell({ threadCount, children }: { threadCount: number; children: ReactNode }) {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const isIndex = pathname === "/forum";

  return (
    <div
      className="mx-auto grid w-full max-w-[1200px] items-start gap-8 px-6 py-6"
      style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
    >
      <div className="grid items-start gap-8 min-[900px]:[grid-template-columns:248px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col gap-3 min-[900px]:sticky min-[900px]:top-[88px]">
          <NewThreadTrigger label="New thread" className="w-full" />

          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
            <Link
              href="/forum"
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
              style={{ backgroundColor: isIndex ? "#f5f5f5" : "#ffffff" }}
            >
              <span className="flex-1 text-sm font-medium" style={{ color: isIndex ? "#111111" : "#374151" }}>
                All threads
              </span>
              <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
                {isConnected ? `${threadCount} total` : "locked"}
              </span>
            </Link>
            {!isConnected && (
              <div
                className="flex flex-col items-center gap-3 px-[18px] py-[26px] text-center"
                style={{ borderTop: "1px solid #f3f4f6" }}
              >
                <span style={{ color: "#e5e7eb" }}>
                  <CouncilMark size={40} />
                </span>
                <span className="text-sm leading-[1.5]" style={{ color: "#6b7280" }}>
                  Connect your wallet to load your thread history from the on-chain index.
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ border: "1px solid #e5e7eb" }}>
            <div className="mb-3 text-[13px] font-medium" style={{ color: "#6b7280" }}>
              Council members
            </div>
            <div className="flex flex-col gap-[11px]">
              {AGENT_ROSTER.map((agent) => (
                <div key={agent.key} className="flex items-center gap-2.5">
                  <AgentAvatar agentKey={agent.key} size={28} />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold" style={{ color: agent.color }}>
                      {agent.name}
                    </div>
                    <div className="text-[12.5px]" style={{ color: "#6b7280" }}>
                      {agent.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
