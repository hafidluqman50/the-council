"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CouncilMark } from "@/components/brand/council-mark";
import { NewThreadTrigger } from "@/components/forum/new-thread-trigger";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WalletButton } from "@/components/layout/wallet-button";

export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isForum = pathname?.startsWith("/forum") ?? false;

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? "var(--pill-on)" : "transparent",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
    color: active ? "var(--ink)" : "var(--muted)",
  });

  return (
    <header
      className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-hairline-soft px-6 py-2.5 backdrop-blur-xl"
      style={{ backgroundColor: "var(--header-bg)" }}
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
        <ThemeToggle />
        <div className="hidden min-[640px]:block">
          <NewThreadTrigger label="Submit an idea" variant="secondary" />
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
