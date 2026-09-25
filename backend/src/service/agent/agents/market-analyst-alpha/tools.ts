import { createCalculateTool } from "../tools/calculate";
import { createQuoteExactPostTool } from "../tools/quoteExactPost";
import { createWebSearchTool } from "../tools/webSearch";
import type { DebatePost } from "../../state";

export const getMarketAnalystAlphaTools = (postsSoFar: DebatePost[]) => [
  createCalculateTool(),
  createQuoteExactPostTool(postsSoFar),
  createWebSearchTool(),
];
