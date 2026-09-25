import { useQuery } from "@tanstack/react-query";

import { listThreads, type ThreadStatus, type ThreadSummary } from "@/http/threads";

export const threadsQueryKey = (status?: ThreadStatus) => ["threads", status ?? "all"] as const;

export function useThreadsQuery(status?: ThreadStatus, initialData?: ThreadSummary[]) {
  return useQuery({
    queryKey: threadsQueryKey(status),
    queryFn: () => listThreads(status),
    initialData,
  });
}
