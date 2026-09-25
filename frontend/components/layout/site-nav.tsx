"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CouncilMark } from "@/components/brand/council-mark";
import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";
import { WalletButton } from "@/components/layout/wallet-button";

export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isForum = pathname?.startsWith("/forum") ?? false;

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? "#ffffff" : "transparent",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
    color: active ? "#111111" : "#6b7280",
  });

  return (
    <header
      className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[#f3f4f6] bg-canvas px-6 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center text-ink">
          <CouncilMark size={28} />
        </Link>
        <Link href="/" className="font-display text-xl font-semibold tracking-[-0.04em] text-ink">
          The Council
        </Link>
        <nav className="ml-3 flex items-center gap-1 rounded-full bg-surface-soft p-[5px]">
          <Link href="/" className="rounded-lg px-3.5 py-[7px] text-sm font-medium transition-colors" style={pillStyle(isHome)}>
            Home
          </Link>
          <Link href="/forum" className="rounded-lg px-3.5 py-[7px] text-sm font-medium transition-colors" style={pillStyle(isForum)}>
            Forum
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2.5">
        <NewThreadTrigger label="Submit an idea" variant="secondary" />
        <WalletButton />
      </div>
    </header>
  );
}
