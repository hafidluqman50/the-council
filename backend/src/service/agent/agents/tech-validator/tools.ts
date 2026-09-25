import { createCalculateTool } from "../tools/calculate";
import { createQuoteExactPostTool } from "../tools/quoteExactPost";
import { createWebSearchTool } from "../tools/webSearch";
import type { DebatePost } from "../../state";

export const getTechValidatorTools = (postsSoFar: DebatePost[]) => [
  createCalculateTool(),
  createQuoteExactPostTool(postsSoFar),
  createWebSearchTool(),
];
