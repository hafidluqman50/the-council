import { createAgent, toolStrategy } from "langchain";
import { z } from "zod";

import { createChatModelForAgent } from "../../llm";
import type { DebatePost } from "../../state";
import { OPEN_INSTRUCTIONS, VERDICT_INSTRUCTIONS } from "./instruction";
import { getOrchestratorTools } from "./tools";

export const OpenResponseSchema = z.object({ body: z.string().min(1) });

export const createOrchestratorOpenAgent = (postsSoFar: DebatePost[]) =>
  createAgent({
    model: createChatModelForAgent("orc"),
    tools: getOrchestratorTools(postsSoFar),
    systemPrompt: OPEN_INSTRUCTIONS,
    responseFormat: toolStrategy(OpenResponseSchema),
  });

export const VerdictResponseSchema = z.object({
  statusText: z.string().min(1),
  score: z.number().int().min(0).max(100),
  risks: z.array(
    z.object({
      label: z.string().min(1),
      severity: z.enum(["low", "medium", "high"]),
      note: z.string().optional(),
    }),
  ),
  conclusion: z.string().min(1),
  unprovenGap: z.string().min(1),
});

export const createOrchestratorVerdictAgent = (postsSoFar: DebatePost[]) =>
  createAgent({
    model: createChatModelForAgent("orc"),
    tools: getOrchestratorTools(postsSoFar),
    systemPrompt: VERDICT_INSTRUCTIONS,
    responseFormat: toolStrategy(VerdictResponseSchema),
  });
