import { ChatDeepSeek } from "@langchain/deepseek";

import { env } from "../../config/env";
import type { AgentKey } from "./state";

const modelNameForAgent = (agentKey: AgentKey): string =>
  agentKey === "orc" ? env.llm.orchestratorModel : agentKey === "tech" ? env.llm.validatorModel : env.llm.panelModel;

export const createChatModelForAgent = (agentKey: AgentKey): ChatDeepSeek =>
  new ChatDeepSeek({
    apiKey: env.llm.apiKey,
    model: modelNameForAgent(agentKey),
    temperature: 0.7,
    // DeepSeek's V4 models default to "thinking" mode, which the API rejects when a forced
    // tool_choice (used by structured output) is also present. Disabling thinking is required
    // for every structured call, not an optimization.
    modelKwargs: { thinking: { type: "disabled" } },
  });
