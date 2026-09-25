import { createAgent, toolStrategy } from "langchain";
import { z } from "zod";

import { createChatModelForAgent } from "../../llm";
import type { AgentKey, DebatePost } from "../../state";
import { OPENING_INSTRUCTIONS, REBUTTAL_INSTRUCTIONS } from "./instruction";
import { getMarketAnalystAlphaTools } from "./tools";

export const OpeningResponseSchema = z.object({
  body: z.string().min(1),
  references: z.array(z.object({ label: z.string(), url: z.string().optional() })).min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export const createAlphaOpeningAgent = (postsSoFar: DebatePost[]) =>
  createAgent({
    model: createChatModelForAgent("m1"),
    tools: getMarketAnalystAlphaTools(postsSoFar),
    systemPrompt: OPENING_INSTRUCTIONS,
    responseFormat: toolStrategy(OpeningResponseSchema),
  });

export const buildRebuttalResponseSchema = (targets: [AgentKey, ...AgentKey[]]) =>
  z.object({
    body: z.string().min(1),
    references: z.array(z.object({ label: z.string(), url: z.string().optional() })).min(1),
    confidence: z.number().min(0).max(1).optional(),
    quoteOfAgentKey: z.enum(targets),
    quoteText: z.string().min(1),
  });

export const createAlphaRebuttalAgent = (postsSoFar: DebatePost[], targets: [AgentKey, ...AgentKey[]]) =>
  createAgent({
    model: createChatModelForAgent("m1"),
    tools: getMarketAnalystAlphaTools(postsSoFar),
    systemPrompt: REBUTTAL_INSTRUCTIONS,
    responseFormat: toolStrategy(buildRebuttalResponseSchema(targets)),
  });
