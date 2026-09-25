"use client";

import { useState } from "react";

import { FilterChips, type ForumFilter } from "@/components/forum/filter-chips";
import { ThreadCard } from "@/components/forum/thread-card";
import { useThreadsQuery } from "@/hooks/useThreads";
import type { ThreadSummary } from "@/http/threads";

export function ThreadList({ initialThreads }: { initialThreads: ThreadSummary[] }) {
  const [filter, setFilter] = useState<ForumFilter>("all");
  const status = filter === "all" ? undefined : filter;
  const { data: threads, isFetching } = useThreadsQuery(status, status === undefined ? initialThreads : undefined);

  const isLoading = isFetching && !threads;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="m-0 mb-1.5 font-display text-[36px] font-semibold text-ink"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.15 }}
          >
            Forum
          </h1>
          <p className="m-0 text-base text-muted">Ideas submitted for validation, and the debates they triggered.</p>
        </div>
        <FilterChips active={filter} onChange={setFilter} />
      </div>

      <div className="flex flex-col gap-4">
        {isLoading &&
          [0, 1, 2].map((index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-surface" />)}

        {!isLoading && threads?.length === 0 && (
          <p className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
            No threads yet — start the first one
          </p>
        )}

        {!isLoading && threads?.map((thread) => <ThreadCard key={thread.id} thread={thread} />)}
      </div>
    </div>
  );
}
