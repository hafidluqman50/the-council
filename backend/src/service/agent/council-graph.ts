import type { Callbacks } from "@langchain/core/callbacks/manager";
import { isAIMessage, type BaseMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

import { logger } from "../../logger/logger";
import { broadcastToThread } from "../realtime/thread-stream";
import { composeUserContent } from "./agents/shared";
import { createTurnLogger } from "./turn-logger";
import { createOrchestratorOpenAgent, createOrchestratorVerdictAgent } from "./agents/orchestrator";
import { createAlphaOpeningAgent, createAlphaRebuttalAgent } from "./agents/market-analyst-alpha";
import { createBetaOpeningAgent, createBetaRebuttalAgent } from "./agents/market-analyst-beta";
import { createGammaOpeningAgent, createGammaRebuttalAgent } from "./agents/market-analyst-gamma";
import { createTechAttackAgent } from "./agents/tech-validator";
import { MARKET_PANEL_KEYS } from "./prompts/agents";
import { CouncilStateAnnotation, type CouncilState } from "./graph-state";
import type { AgentKey, DebatePost, PostReference, TokenUsage } from "./state";

type TurnResult<T> = {
  response: T;
  durationMs: number;
  usage: TokenUsage | null;
  searchUrls: Set<string>;
};

const sumUsage = (messages: BaseMessage[] = []): TokenUsage | null => {
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let found = false;

  for (const message of messages) {
    if (!isAIMessage(message) || !message.usage_metadata) continue;
    found = true;
    promptTokens += message.usage_metadata.input_tokens;
    completionTokens += message.usage_metadata.output_tokens;
    totalTokens += message.usage_metadata.total_tokens;
  }

  return found ? { promptTokens, completionTokens, totalTokens } : null;
};

/** A model was caught inventing a plausible but entirely fake URL for an internal quote
 * citation (nothing on the other end of it). External citations are only trustworthy if
 * they came from a web_search call actually made this turn — anything else gets its url
 * stripped (the label survives, the fabricated link doesn't). */
const sanitizeReferences = (references: PostReference[], searchUrls: Set<string>): PostReference[] =>
  references.map((reference) =>
    reference.url && searchUrls.has(reference.url) ? reference : { label: reference.label },
  );

const invokeAgent = async <T>(
  agent: {
    invoke: (
      input: { messages: { role: string; content: string }[] },
      config?: { recursionLimit?: number; callbacks?: Callbacks; signal?: AbortSignal },
    ) => Promise<{ structuredResponse: T; messages: BaseMessage[] }>;
  },
  content: string,
  node: string,
  signal?: AbortSignal,
): Promise<TurnResult<T>> => {
  // Each agent's internal tool-calling loop defaults to LangGraph's recursionLimit of 25.
  // Observed live runs show agents legitimately making many calculate/quote_exact_post calls
  // in a single turn while fact-checking their own arguments before submitting — not a bug,
  // just thorough. Raised again (100 -> 200) after adding the web_search tool: a third tool
  // means legitimately longer tool-calling turns (search, re-search a narrower query, quote,
  // calculate) before the model is ready to commit to a final answer.
  const attempt = async (attemptContent: string, recursionLimit: number): Promise<TurnResult<T>> => {
    // A prior turn in this same debate already failed and DebateRunner aborted — without this
    // check a still-in-flight node would go ahead and start a brand new, real, billable
    // web_search/DeepSeek turn for a thread that's already been marked FAILED.
    if (signal?.aborted) throw Object.assign(new Error("Debate aborted"), { name: "AbortError" });

    const turnLogger = createTurnLogger(node);
    try {
      const result = await agent.invoke(
        { messages: [{ role: "human", content: attemptContent }] },
        { recursionLimit, callbacks: turnLogger.callbacks, signal },
      );
      const durationMs = turnLogger.logDone();

      // The model occasionally ends its turn with a plain message instead of ever calling
      // the forced structured-output tool — no error is thrown, `structuredResponse` is just
      // missing. Treat that the same as a recursion failure: retry once with a sharper nudge
      // rather than crash the whole debate on a downstream `undefined.body`.
      if (!result.structuredResponse) {
        throw Object.assign(new Error("Agent turn ended without a structured response"), {
          name: "MissingStructuredResponseError",
        });
      }

      return {
        response: result.structuredResponse,
        durationMs,
        usage: sumUsage(result.messages),
        searchUrls: turnLogger.searchUrls,
      };
    } catch (error) {
      turnLogger.logDone();
      throw error;
    }
  };

  try {
    return await attempt(content, 200);
  } catch (error) {
    const isRecursionError = error instanceof Error && error.name === "GraphRecursionError";
    const isMissingResponse = error instanceof Error && error.name === "MissingStructuredResponseError";
    logger.error("agent turn threw", { node, error: error instanceof Error ? error.message : String(error) });

    // A single turn occasionally spends its whole budget on legitimate but excessive
    // fact-checking (many small web_search/calculate calls) rather than a real infinite
    // loop. Retrying fresh with a hard deadline instruction is cheaper than failing the
    // entire debate over one over-thorough turn.
    if (!isRecursionError && !isMissingResponse) throw error;

    logger.warn("agent turn retrying after recursion limit or missing structured response", { node });
    return attempt(
      `${content}\n\nDEADLINE NOTICE: Your previous attempt at this turn ran out of steps before finishing. This time, do at most two web_search calls and one calculate call (batching all arithmetic into its operations list), then commit to your final structured answer immediately.`,
      60,
    );
  }
};

type NodeConfig = { signal?: AbortSignal; configurable?: { threadId?: string } };

/** No token-level content streaming yet (deferred — parsing partial JSON tool-call args
 * safely needs real testing time this doesn't have). This is the minimum viable progress
 * signal: tells the client which agent is working and since when, so a long turn (eg the
 * Tech Validator doing several web_search/calculate calls) shows a live elapsed timer
 * instead of a static, indistinguishable-from-hung "..." forever. */
const announceTurn = (config: NodeConfig, agentKey: string, round: number) => {
  const threadId = config.configurable?.threadId;
  if (!threadId) return;
  broadcastToThread(threadId, { type: "turn-start", agentKey, round, startedAt: Date.now() });
};

const orchestratorOpen = async (state: CouncilState, config: NodeConfig) => {
  announceTurn(config, "orc", 1);
  const agent = createOrchestratorOpenAgent(state.posts);
  const content = composeUserContent({ idea: state.idea, research: state.research, postsSoFar: state.posts });
  const turn = await invokeAgent<{ body: string }>(agent, content, "orchestratorOpen", config.signal);

  const post: DebatePost = {
    agentKey: "orc",
    round: 1,
    body: turn.response.body,
    references: [],
    durationMs: turn.durationMs,
    usage: turn.usage ?? undefined,
  };
  return { posts: [post] };
};

const analystOpen = async (
  agentKey: AgentKey,
  createAgentFn: (postsSoFar: DebatePost[]) => ReturnType<typeof createAlphaOpeningAgent>,
  state: CouncilState,
  config: NodeConfig,
) => {
  announceTurn(config, agentKey, 1);
  const agent = createAgentFn(state.posts);
  const content = composeUserContent({ idea: state.idea, research: state.research, postsSoFar: state.posts });
  const turn = await invokeAgent<{ body: string; references: PostReference[]; confidence?: number }>(
    agent,
    content,
    `analystOpen:${agentKey}`,
    config.signal,
  );

  const post: DebatePost = {
    agentKey,
    round: 1,
    body: turn.response.body,
    references: sanitizeReferences(turn.response.references, turn.searchUrls),
    confidence: turn.response.confidence,
    durationMs: turn.durationMs,
    usage: turn.usage ?? undefined,
  };
  return { posts: [post] };
};

const analystAlpha = (state: CouncilState, config: NodeConfig) =>
  analystOpen("m1", createAlphaOpeningAgent, state, config);
const analystBeta = (state: CouncilState, config: NodeConfig) =>
  analystOpen("m2", createBetaOpeningAgent, state, config);
const analystGamma = (state: CouncilState, config: NodeConfig) =>
  analystOpen("m3", createGammaOpeningAgent, state, config);

type RebuttalAgentFactory = (
  postsSoFar: DebatePost[],
  targets: [AgentKey, ...AgentKey[]],
) => ReturnType<typeof createAlphaRebuttalAgent>;

const runRebuttalTurn = async (
  agentKey: AgentKey,
  createAgentFn: RebuttalAgentFactory,
  state: CouncilState,
  priorRebuttalsThisRound: DebatePost[],
  config: NodeConfig,
) => {
  announceTurn(config, agentKey, 1);
  const targets = MARKET_PANEL_KEYS.filter((key) => key !== agentKey) as [AgentKey, ...AgentKey[]];
  const postsSoFar = [...state.posts, ...priorRebuttalsThisRound];

  const agent = createAgentFn(postsSoFar, targets);
  const content = composeUserContent({ idea: state.idea, research: state.research, postsSoFar });
  const turn = await invokeAgent<{
    body: string;
    references: PostReference[];
    confidence?: number;
    quoteOfAgentKey: AgentKey;
    quoteText: string;
  }>(agent, content, `runRebuttalTurn:${agentKey}`, config.signal);

  const post: DebatePost = {
    agentKey,
    round: 1,
    body: turn.response.body,
    references: sanitizeReferences(turn.response.references, turn.searchUrls),
    confidence: turn.response.confidence,
    quoteOfAgentKey: turn.response.quoteOfAgentKey,
    quoteText: turn.response.quoteText,
    durationMs: turn.durationMs,
    usage: turn.usage ?? undefined,
  };
  return post;
};

const analystRebuttal = async (state: CouncilState, config: NodeConfig) => {
  const newPosts: DebatePost[] = [];

  const alphaPost = await runRebuttalTurn("m1", createAlphaRebuttalAgent, state, newPosts, config);
  newPosts.push(alphaPost);

  const betaPost = await runRebuttalTurn("m2", createBetaRebuttalAgent, state, newPosts, config);
  newPosts.push(betaPost);

  const gammaPost = await runRebuttalTurn("m3", createGammaRebuttalAgent, state, newPosts, config);
  newPosts.push(gammaPost);

  return { posts: newPosts };
};

const techValidatorAttack = async (state: CouncilState, config: NodeConfig) => {
  announceTurn(config, "tech", 1);
  const agent = createTechAttackAgent(state.posts);
  const content = composeUserContent({ idea: state.idea, research: state.research, postsSoFar: state.posts });
  const turn = await invokeAgent<{ body: string; references: PostReference[]; confidence?: number }>(
    agent,
    content,
    "techValidatorAttack",
    config.signal,
  );

  const post: DebatePost = {
    agentKey: "tech",
    round: 1,
    body: turn.response.body,
    references: sanitizeReferences(turn.response.references, turn.searchUrls),
    confidence: turn.response.confidence,
    durationMs: turn.durationMs,
    usage: turn.usage ?? undefined,
  };
  return { posts: [post] };
};

const orchestratorVerdict = async (state: CouncilState, config: NodeConfig) => {
  announceTurn(config, "orc", 2);
  const agent = createOrchestratorVerdictAgent(state.posts);
  const content = composeUserContent({ idea: state.idea, research: state.research, postsSoFar: state.posts });
  const turn = await invokeAgent(agent, content, "orchestratorVerdict", config.signal);
  const verdict = { ...turn.response, durationMs: turn.durationMs, usage: turn.usage ?? undefined };
  return { verdict };
};

export const buildCouncilGraph = () =>
  new StateGraph(CouncilStateAnnotation)
    .addNode("orchestratorOpen", orchestratorOpen)
    .addNode("analystAlpha", analystAlpha)
    .addNode("analystBeta", analystBeta)
    .addNode("analystGamma", analystGamma)
    .addNode("analystRebuttal", analystRebuttal)
    .addNode("techValidatorAttack", techValidatorAttack)
    .addNode("orchestratorVerdict", orchestratorVerdict)
    .addEdge(START, "orchestratorOpen")
    .addEdge("orchestratorOpen", "analystAlpha")
    .addEdge("analystAlpha", "analystBeta")
    .addEdge("analystBeta", "analystGamma")
    .addEdge("analystGamma", "analystRebuttal")
    .addEdge("analystRebuttal", "techValidatorAttack")
    .addEdge("techValidatorAttack", "orchestratorVerdict")
    .addEdge("orchestratorVerdict", END)
    .compile();

export const runCouncilDebate = async (idea: string, research: string) => {
  const graph = buildCouncilGraph();
  return graph.invoke({ idea, research, posts: [] });
};
