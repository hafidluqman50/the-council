import type { ThreadPost } from "@/http/threads";

export function derivePostTag(post: ThreadPost): string {
  if (post.agentKey === "orc") return "OPEN";
  if (post.agentKey === "tech") return "BLOCK";
  return post.quoteOfAgentKey ? "REBUTTAL" : "ARGUMENT";
}
