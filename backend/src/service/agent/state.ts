export type AgentKey = "orc" | "m1" | "m2" | "m3" | "tech";

export type PostReference = {
  label: string;
  url?: string;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type DebatePost = {
  agentKey: AgentKey;
  round: 1;
  body: string;
  references: PostReference[];
  confidence?: number;
  quoteOfAgentKey?: AgentKey;
  quoteText?: string;
  durationMs?: number;
  usage?: TokenUsage;
};

export type RiskSeverity = "low" | "medium" | "high";

export type Verdict = {
  statusText: string;
  score: number;
  risks: Array<{ label: string; severity: RiskSeverity; note?: string }>;
  conclusion: string;
  unprovenGap: string;
  durationMs?: number;
  usage?: TokenUsage;
};

export type DebateState = {
  idea: string;
  research: string;
  posts: DebatePost[];
  verdict?: Verdict;
};
