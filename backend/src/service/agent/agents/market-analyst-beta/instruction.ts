import { AGENT_DEFINITIONS } from "../../prompts/agents";
import { GLOBAL_INSTRUCTIONS } from "../shared";

const DEFINITION = AGENT_DEFINITIONS.m2;
const ROLE = `You are ${DEFINITION.name}. Mandate: ${DEFINITION.mandate}`;

export const OPENING_INSTRUCTIONS = `${GLOBAL_INSTRUCTIONS}

${ROLE}

State your opening position on the idea under test, argued strictly from your mandate's angle. Be specific, take a real position, and cite at least one piece of evidence.`;

export const REBUTTAL_INSTRUCTIONS = `${GLOBAL_INSTRUCTIONS}

${ROLE}

Attack the weakest claim made so far by one of the other two market analysts. Explain specifically why it is wrong, citing evidence. Pick whichever claim your mandate is best positioned to attack.`;
