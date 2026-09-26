import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  getThread,
  mapUsage,
  WS_BASE_URL,
  type AgentKey,
  type ThreadDetail,
  type ThreadPost,
  type Verdict,
} from "@/http/threads";

export const threadQueryKey = (publicRef: string) => ["thread", publicRef] as const;

type StreamMessage =
  | { type: "replay"; thread: unknown }
  | { type: "post"; post: Record<string, unknown> }
  | { type: "verdict"; verdict: Record<string, unknown> }
  | { type: "error"; message: string }
  | { type: "turn-start"; agentKey: string; round: number; startedAt: number }
  | { type: "post-delta"; agentKey: string; round: number; text: string };

const toUsage = (raw: Record<string, unknown>) =>
  mapUsage({
    promptTokens: (raw.promptTokens as number | null) ?? null,
    completionTokens: (raw.completionTokens as number | null) ?? null,
    totalTokens: (raw.totalTokens as number | null) ?? null,
  });

const toPost = (raw: Record<string, unknown>): ThreadPost => ({
  id: raw.id as string,
  agentKey: raw.agentKey as ThreadPost["agentKey"],
  round: raw.round as ThreadPost["round"],
  sequence: raw.sequence as number,
  body: raw.body as string,
  confidence: raw.confidence === null || raw.confidence === undefined ? null : Number(raw.confidence),
  quoteOfAgentKey: (raw.quoteOfAgentKey as ThreadPost["quoteOfAgentKey"]) ?? null,
  quoteText: (raw.quoteText as string | null) ?? null,
  references: (raw.references as ThreadPost["references"]) ?? [],
  txHash: (raw.txHash as string | null) ?? null,
  durationMs: (raw.durationMs as number | null) ?? null,
  usage: toUsage(raw),
});

const toVerdict = (raw: Record<string, unknown>): Verdict => ({
  statusText: raw.statusText as string,
  score: raw.score as number,
  conclusion: raw.conclusion as string,
  unprovenGap: raw.unprovenGap as string,
  txHash: (raw.txHash as string | null) ?? null,
  durationMs: (raw.durationMs as number | null) ?? null,
  usage: toUsage(raw),
});

export function useThreadQuery(publicRef: string, initialData?: ThreadDetail) {
  const queryClient = useQueryClient();
  const queryKey = threadQueryKey(publicRef);

  const query = useQuery({
    queryKey,
    queryFn: () => getThread(publicRef),
    initialData,
    // WebSocket is the primary channel for live updates, but Fly's proxy can drop an idle
    // connection with no reconnect logic here — polling is the fallback so the UI still
    // catches up to a finished debate even if the socket silently died mid-thread.
    refetchInterval: (query) => (query.state.data?.status === "live" ? 5000 : false),
  });

  const status = query.data?.status;

  useEffect(() => {
    if (status !== "live") return;

    const socket = new WebSocket(`${WS_BASE_URL}/threads/${publicRef}/stream`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as StreamMessage;

      if (message.type === "turn-start") {
        queryClient.setQueryData(queryKey, (current: ThreadDetail | null | undefined) =>
          current
            ? {
                ...current,
                activeTurn: {
                  agentKey: message.agentKey as AgentKey,
                  round: message.round,
                  startedAt: message.startedAt,
                },
                draft: null,
              }
            : current,
        );
      }

      if (message.type === "post-delta") {
        queryClient.setQueryData(queryKey, (current: ThreadDetail | null | undefined) =>
          current
            ? {
                ...current,
                draft: { agentKey: message.agentKey as AgentKey, round: message.round, text: message.text },
              }
            : current,
        );
      }

      if (message.type === "post") {
        queryClient.setQueryData(queryKey, (current: ThreadDetail | null | undefined) =>
          current
            ? { ...current, posts: [...current.posts, toPost(message.post)], activeTurn: null, draft: null }
            : current,
        );
      }

      if (message.type === "verdict") {
        const verdict = toVerdict(message.verdict);
        queryClient.setQueryData(queryKey, (current: ThreadDetail | null | undefined) =>
          current
            ? { ...current, verdict, status: "resolved" as const, activeTurn: null, draft: null }
            : current,
        );
      }

      if (message.type === "error") {
        queryClient.setQueryData(queryKey, (current: ThreadDetail | null | undefined) =>
          current
            ? {
                ...current,
                status: "failed" as const,
                debateError: message.message,
                activeTurn: null,
                draft: null,
              }
            : current,
        );
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicRef, status]);

  return query;
}
