import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SiteNav } from "@/components/layout/site-nav";
import { ThreadView } from "@/components/thread/thread-view";
import { getPaymentRequirements, getThread, listThreads } from "@/http/threads";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ publicRef: string }> }) {
  const { publicRef } = await params;
  const [thread, threads, payment] = await Promise.all([
    getThread(publicRef),
    listThreads(),
    getPaymentRequirements(),
  ]);

  if (!thread) {
    notFound();
  }

  return (
    <>
      <SiteNav />
      <AppShell threadCount={threads.length}>
        <Link
          href="/forum"
          className="flex h-9 w-fit items-center gap-2 rounded-lg px-[14px] py-0 pl-[11px] text-sm font-medium"
          style={{ border: "1px solid #e5e7eb", color: "#374151" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to forum
        </Link>
        <ThreadView initialThread={thread} payment={payment} />
      </AppShell>
    </>
  );
}
