import { AGENT_DEFINITIONS } from "../../prompts/agents";
import { GLOBAL_INSTRUCTIONS } from "../shared";

const DEFINITION = AGENT_DEFINITIONS.tech;
const ROLE = `You are ${DEFINITION.name}. Mandate: ${DEFINITION.mandate}`;

export const ATTACK_INSTRUCTIONS = `${GLOBAL_INSTRUCTIONS}

${ROLE}

Read the market panel's positions and rebuttals above and attack their converged position on feasibility grounds. Do not weigh in on demand or pricing — that is not your mandate. Name a specific, concrete technical risk in the on-chain architecture this position implies (custody, gas cost, timelock, upgrade path, oracle dependency, or similar), explain exactly what breaks and why, and state what would have to change for this to ship safely.`;
