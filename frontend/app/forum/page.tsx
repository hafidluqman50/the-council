import { AppShell } from "@/components/layout/app-shell";
import { ThreadList } from "@/components/forum/thread-list";
import { SiteNav } from "@/components/layout/site-nav";
import { listThreads } from "@/http/threads";

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const initialThreads = await listThreads();

  return (
    <>
      <SiteNav />
      <AppShell threadCount={initialThreads.length}>
        <ThreadList initialThreads={initialThreads} />
      </AppShell>
    </>
  );
}
