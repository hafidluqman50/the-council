import type { Callbacks } from "@langchain/core/callbacks/manager";

import { logger } from "../../logger/logger";

const truncate = (value: string, max = 300): string => (value.length > max ? `${value.slice(0, max)}…` : value);

type ToolMessageLike = { name?: string; content?: unknown };

const collectSearchUrls = (output: ToolMessageLike, into: Set<string>): void => {
  if (output.name !== "web_search" || typeof output.content !== "string") return;

  try {
    const parsed = JSON.parse(output.content) as { results?: Array<{ url?: string }> };
    for (const result of parsed.results ?? []) {
      if (result.url) into.add(result.url);
    }
  } catch {
    // Not JSON, or not the shape we expect — nothing to collect.
  }
};

/** Every agent turn was a black box until now — no visibility into which tool it called,
 * how many times, or why a turn ever hit the recursion limit. This logs each step so a
 * runaway loop (same tool, same args, forever) is visible in seconds instead of guessed at.
 * It also collects every URL a web_search call actually returned this turn, so the final
 * structured response's citations can be checked against real search results instead of
 * trusting whatever URL the model claims — a model has been caught inventing a plausible
 * but entirely fake URL for an internal quote citation. */
export const createTurnLogger = (node: string) => {
  let step = 0;
  const startedAt = Date.now();
  const searchUrls = new Set<string>();

  const callbacks: Callbacks = [
    {
      handleToolStart: (_tool: unknown, input: string, _runId: string, _parentRunId?: string, _tags?: string[], _metadata?: unknown, runName?: string) => {
        step += 1;
        logger.info("agent tool call", { node, step, tool: runName, input: truncate(input) });
      },
      handleToolEnd: (output: unknown) => {
        const toolMessage = (output ?? {}) as ToolMessageLike;
        collectSearchUrls(toolMessage, searchUrls);
        const text = typeof output === "string" ? output : JSON.stringify(output);
        logger.info("agent tool result", { node, step, output: truncate(text ?? "") });
      },
      handleToolError: (error: Error) => {
        logger.warn("agent tool error", { node, step, error: error.message });
      },
    },
  ];

  return {
    callbacks,
    searchUrls,
    logDone: (): number => {
      const durationMs = Date.now() - startedAt;
      logger.info("agent turn done", { node, steps: step, ms: durationMs });
      return durationMs;
    },
  };
};
