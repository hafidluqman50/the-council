import { createAgent, toolStrategy } from "langchain";
import { z } from "zod";

import { createChatModelForAgent } from "../../llm";
import type { DebatePost } from "../../state";
import { ATTACK_INSTRUCTIONS } from "./instruction";
import { getTechValidatorTools } from "./tools";

export const TechResponseSchema = z.object({
  body: z.string().min(1),
  references: z.array(z.object({ label: z.string(), url: z.string().optional() })).min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export const createTechAttackAgent = (postsSoFar: DebatePost[]) =>
  createAgent({
    model: createChatModelForAgent("tech"),
    tools: getTechValidatorTools(postsSoFar),
    systemPrompt: ATTACK_INSTRUCTIONS,
    responseFormat: toolStrategy(TechResponseSchema),
  });
