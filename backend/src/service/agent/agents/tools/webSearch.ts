import { DynamicStructuredTool } from "@langchain/core/tools";
import { TavilySearch } from "@langchain/tavily";

import { env } from "../../../../config/env";

const MAX_SEARCHES_PER_TURN = 2;

/** Named explicitly "web_search" — the underlying @langchain/tavily tool defaults to
 * "tavily_search", which never matched the name this project's prompts and hallucination
 * filter (turn-logger.ts) expect, so real search results were never actually being
 * recognized as real. Also caps calls per turn: the Tavily/DeepSeek API keys are shared
 * with another project, and turns were making up to 6 real search calls each. */
export const createWebSearchTool = () => {
  const underlying = new TavilySearch({ tavilyApiKey: env.tavilyApiKey, maxResults: 5, name: "web_search" });
  let callCount = 0;

  return new DynamicStructuredTool({
    name: "web_search",
    description: underlying.description,
    schema: underlying.schema,
    func: async (input) => {
      callCount += 1;
      if (callCount > MAX_SEARCHES_PER_TURN) {
        return `Search budget exhausted for this turn (max ${MAX_SEARCHES_PER_TURN} calls). Proceed with what you already found — do not call web_search again this turn.`;
      }
      return underlying.invoke(input);
    },
  });
};
