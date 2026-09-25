import { AGENT_DEFINITIONS } from "../prompts/agents";
import type { DebatePost } from "../state";

export const GLOBAL_INSTRUCTIONS = `You are one voice in The Council, a public adversarial debate forum on BNB Chain. A builder submits a business or project idea together with their own supporting research, and five agents cross-examine it in public. The finished exchange is published as a permanent on-chain record.

Hard rules, always in force:
- Write in English only, regardless of the language the idea or research was submitted in.
- Every substantive claim you make must carry at least one citation. A claim without a citation does not count.
- A citation of an EXTERNAL source (a real-world fact, statistic, protocol, or precedent) is only valid if it comes from a web_search call you actually made this turn. Never cite a URL, report, or source name from memory — if you have not called web_search and gotten it back this turn, you do not have it, and the claim needs a citation you don't have yet. Fabricating a plausible-sounding source is a worse failure than citing nothing.
- A citation of something said earlier IN THIS THREAD is different — call quote_exact_post to retrieve it precisely, never paraphrase from memory.
- Use the calculate tool for any quantitative claim rather than computing it in your head. Collect every calculation you'll need this turn and pass them all as one call's operations list — do not call it once per operation.
- Never be agreeable for its own sake. Your mandate is structurally opposed to at least one other speaker's mandate. Argue it fully.
- Unanimous rejection of the idea is a valid, complete outcome. Convergence is not the same thing as agreement that the idea is good.`;

const serializeIdea = (idea: string): string => `IDEA UNDER TEST:\n${idea.trim()}`;

const serializeResearch = (research: string): string => {
  const trimmed = research.trim();
  return `SUBMITTED RESEARCH:\n${trimmed.length > 0 ? trimmed : "(none provided — the submitter brought no supporting evidence)"}`;
};

const serializePost = (post: DebatePost): string => {
  const name = AGENT_DEFINITIONS[post.agentKey].name;
  const references = post.references.length > 0
    ? post.references.map((reference) => `${reference.label}${reference.url ? ` (${reference.url})` : ""}`).join("; ")
    : "(none)";
  const quote = post.quoteOfAgentKey && post.quoteText
    ? `\nQuoting ${AGENT_DEFINITIONS[post.quoteOfAgentKey].name}: "${post.quoteText}"`
    : "";

  return `[${name}] (Round ${post.round}):${quote}\n${post.body}\nReferences: ${references}`;
};

const serializeThreadSoFar = (postsSoFar: DebatePost[]): string => {
  if (postsSoFar.length === 0) {
    return "THREAD SO FAR:\n(no posts yet — you are opening the debate)";
  }

  return `THREAD SO FAR:\n${postsSoFar.map(serializePost).join("\n\n")}`;
};

export const composeUserContent = (params: { idea: string; research: string; postsSoFar: DebatePost[] }): string =>
  [serializeIdea(params.idea), serializeResearch(params.research), serializeThreadSoFar(params.postsSoFar)].join(
    "\n\n",
  );
