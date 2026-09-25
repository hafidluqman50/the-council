"use client";

import type { ThreadStatus } from "@/http/threads";

export type ForumFilter = ThreadStatus | "all";

const FILTERS: Array<{ value: ForumFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "resolved", label: "Resolved" },
  { value: "revise", label: "Revise" },
  { value: "failed", label: "Failed" },
];

export function FilterChips({
  active,
  onChange,
}: {
  active: ForumFilter;
  onChange: (filter: ForumFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full bg-surface-soft p-[5px]">
      {FILTERS.map((filter) => {
        const isActive = filter.value === active;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive ? "#ffffff" : "transparent",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              color: isActive ? "#111111" : "#6b7280",
            }}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
