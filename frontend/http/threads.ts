export type AgentKey = "orc" | "m1" | "m2" | "m3" | "tech";

export type ThreadStatus = "live" | "resolved" | "revise" | "failed";

export type ThreadSummary = {
  id: string;
  title: string;
  excerpt: string;
  status: ThreadStatus;
  authorAddress: string;
  score: number | null;
  replyCount: number;
  sourceCount: number;
  openedAt: string;
  agentKeys: AgentKey[];
};

export type PostReference = {
  label: string;
  url: string | null;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ThreadPost = {
  id: string;
  agentKey: AgentKey;
  round: 1;
  sequence: number;
  body: string;
  confidence: number | null;
  quoteOfAgentKey: AgentKey | null;
  quoteText: string | null;
  references: PostReference[];
  txHash: string | null;
  durationMs: number | null;
  usage: TokenUsage | null;
};

export type Risk = {
  label: string;
  severity: "low" | "medium" | "high";
  note: string | null;
};

export type Verdict = {
  statusText: string;
  score: number;
  conclusion: string;
  unprovenGap: string;
  txHash: string | null;
  durationMs: number | null;
  usage: TokenUsage | null;
};

export type ThreadDetail = {
  id: string;
  publicRef: string;
  title: string;
  idea: string;
  research: string | null;
  authorAddress: string;
  status: ThreadStatus;
  consensusScore: number | null;
  openedAt: string;
  posts: ThreadPost[];
  verdict: Verdict | null;
  risks: Risk[];
  /** Set client-side from a WebSocket "error" event when the debate run itself fails —
   * never present in the raw API response. */
  debateError?: string | null;
};

export type PaymentAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
};

export type PaymentPayload = {
  token: string;
  payload: { authorization: PaymentAuthorization; signature: string };
};

export type PaymentRequirements = {
  enabled: boolean;
  relayerAddress: string;
  payToAddress: string;
  assetAddress: string;
  priceAtomic: string;
  chainId: number;
};

export type CreateThreadInput = {
  idea: string;
  research: string;
  authorAddress: string;
  payment?: PaymentPayload;
};

export type CreateThreadResult =
  | { ok: true; publicRef: string }
  | { ok: false; code: string; message: string };

const FULL_ROSTER: AgentKey[] = ["orc", "m1", "m2", "m3", "tech"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8080";

type BackendThread = {
  publicRef: string;
  title: string;
  idea: string;
  authorAddress: string;
  status: "LIVE" | "RESOLVED" | "REVISE" | "FAILED";
  consensusScore: number | null;
  openedAt: string;
  posts?: Array<{ agentKey: string; references?: Array<{ id: string }> }>;
};

const mapThread = (raw: BackendThread): ThreadSummary => ({
  id: raw.publicRef,
  title: raw.title,
  excerpt: raw.idea.length > 140 ? `${raw.idea.slice(0, 140)}...` : raw.idea,
  status: raw.status.toLowerCase() as ThreadStatus,
  authorAddress: raw.authorAddress,
  score: raw.consensusScore,
  replyCount: raw.posts?.length ?? 0,
  sourceCount: raw.posts?.reduce((sum, post) => sum + (post.references?.length ?? 0), 0) ?? 0,
  openedAt: raw.openedAt,
  agentKeys: FULL_ROSTER,
});

export async function listThreads(status?: ThreadStatus): Promise<ThreadSummary[]> {
  const query = status ? `?status=${status.toUpperCase()}` : "";
  const response = await fetch(`${API_BASE_URL}/threads${query}`);
  const body = (await response.json()) as { data: BackendThread[] };
  return body.data.map(mapThread);
}

export async function createThread(input: CreateThreadInput): Promise<CreateThreadResult> {
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as { data?: { publicRef: string }; error?: { code: string; message: string } };
  if (body.error) return { ok: false, code: body.error.code, message: body.error.message };
  return { ok: true, publicRef: body.data!.publicRef };
}

export async function getPaymentRequirements(): Promise<PaymentRequirements> {
  const response = await fetch(`${API_BASE_URL}/payment/requirements`);
  const body = (await response.json()) as { data: PaymentRequirements };
  return body.data;
}

type BackendThreadDetail = {
  id: string;
  publicRef: string;
  title: string;
  idea: string;
  research: string | null;
  authorAddress: string;
  status: "LIVE" | "RESOLVED" | "REVISE" | "FAILED";
  consensusScore: number | null;
  openedAt: string;
  posts: Array<{
    id: string;
    agentKey: string;
    round: 1;
    sequence: number;
    body: string;
    confidence: string | number | null;
    quoteOfAgentKey: string | null;
    quoteText: string | null;
    references: Array<{ label: string; url: string | null }>;
    txHash: string | null;
    durationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  }>;
  verdict: {
    statusText: string;
    score: number;
    conclusion: string;
    unprovenGap: string;
    txHash: string | null;
    durationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  } | null;
  risks: Array<{ label: string; severity: "low" | "medium" | "high"; note: string | null }>;
};

export const mapUsage = (raw: {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}): TokenUsage | null =>
  raw.promptTokens !== null && raw.completionTokens !== null && raw.totalTokens !== null
    ? { promptTokens: raw.promptTokens, completionTokens: raw.completionTokens, totalTokens: raw.totalTokens }
    : null;

const mapThreadDetail = (raw: BackendThreadDetail): ThreadDetail => ({
  id: raw.id,
  publicRef: raw.publicRef,
  title: raw.title,
  idea: raw.idea,
  research: raw.research,
  authorAddress: raw.authorAddress,
  status: raw.status.toLowerCase() as ThreadStatus,
  consensusScore: raw.consensusScore,
  openedAt: raw.openedAt,
  posts: raw.posts.map((post) => ({
    id: post.id,
    agentKey: post.agentKey as AgentKey,
    round: post.round,
    sequence: post.sequence,
    body: post.body,
    confidence: post.confidence === null ? null : Number(post.confidence),
    quoteOfAgentKey: post.quoteOfAgentKey as AgentKey | null,
    quoteText: post.quoteText,
    references: post.references,
    txHash: post.txHash,
    durationMs: post.durationMs,
    usage: mapUsage(post),
  })),
  verdict: raw.verdict && {
    statusText: raw.verdict.statusText,
    score: raw.verdict.score,
    conclusion: raw.verdict.conclusion,
    unprovenGap: raw.verdict.unprovenGap,
    txHash: raw.verdict.txHash,
    durationMs: raw.verdict.durationMs,
    usage: mapUsage(raw.verdict),
  },
  risks: raw.risks,
});

export async function getThread(publicRef: string): Promise<ThreadDetail | null> {
  const response = await fetch(`${API_BASE_URL}/threads/${publicRef}`);
  const body = (await response.json()) as { data?: BackendThreadDetail; error?: { code: string } };
  if (!body.data) return null;
  return mapThreadDetail(body.data);
}
