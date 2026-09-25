import type { AgentKey } from "../state";

export type AgentDefinition = {
  key: AgentKey;
  name: string;
  mandate: string;
};

export const AGENT_DEFINITIONS: Record<AgentKey, AgentDefinition> = {
  orc: {
    key: "orc",
    name: "The Orchestrator",
    mandate: "Set speaking order, close each round, write the verdict.",
  },
  m1: {
    key: "m1",
    name: "Market Analyst α",
    mandate: "Demand — is there real, sized demand on-chain for this.",
  },
  m2: {
    key: "m2",
    name: "Market Analyst β",
    mandate: "Token economics and pricing — does the model hold, will anyone pay.",
  },
  m3: {
    key: "m3",
    name: "Market Analyst γ",
    mandate: "Distribution and GTM — how does this reach users in this ecosystem.",
  },
  tech: {
    key: "tech",
    name: "Tech Validator",
    mandate: "Is the on-chain architecture buildable, at what cost and what timeline.",
  },
};

export const MARKET_PANEL_KEYS: AgentKey[] = ["m1", "m2", "m3"];
