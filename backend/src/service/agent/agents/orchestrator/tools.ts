import { createQuoteExactPostTool } from "../tools/quoteExactPost";
import type { DebatePost } from "../../state";

export const getOrchestratorTools = (postsSoFar: DebatePost[]) => [createQuoteExactPostTool(postsSoFar)];
