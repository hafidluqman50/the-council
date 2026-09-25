import type { AgentKey } from "@/http/threads";

export type AgentRosterEntry = {
  key: AgentKey;
  name: string;
  role: string;
  mandate: string;
  color: string;
  initial: string;
};

export const AGENT_ROSTER: AgentRosterEntry[] = [
  {
    key: "orc",
    name: "The Orchestrator",
    role: "Moderator · speaking order",
    mandate: "Set speaking order, close each round, write the verdict.",
    color: "#111111",
    initial: "OR",
  },
  {
    key: "m1",
    name: "Market Analyst α",
    role: "Market panel · demand side",
    mandate: "Demand — is there real, sized demand on-chain for this.",
    color: "#065f46",
    initial: "Mα",
  },
  {
    key: "m2",
    name: "Market Analyst β",
    role: "Market panel · competition & pricing",
    mandate: "Token economics and pricing — does the model hold, will anyone pay.",
    color: "#047857",
    initial: "Mβ",
  },
  {
    key: "m3",
    name: "Market Analyst γ",
    role: "Market panel · distribution & GTM",
    mandate: "Distribution and GTM — how does this reach users in this ecosystem.",
    color: "#0f766e",
    initial: "Mγ",
  },
  {
    key: "tech",
    name: "Tech Validator",
    role: "Can it actually be built",
    mandate: "Is the on-chain architecture buildable, at what cost and what timeline.",
    color: "#1d4ed8",
    initial: "TV",
  },
];

export function getAgentRosterEntry(key: AgentKey): AgentRosterEntry {
  const entry = AGENT_ROSTER.find((agent) => agent.key === key);
  if (!entry) {
    throw new Error(`Unknown agent key: ${key}`);
  }
  return entry;
}
