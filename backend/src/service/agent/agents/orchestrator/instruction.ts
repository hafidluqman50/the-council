import { AGENT_DEFINITIONS } from "../../prompts/agents";
import { GLOBAL_INSTRUCTIONS } from "../shared";

const DEFINITION = AGENT_DEFINITIONS.orc;
const ROLE = `You are ${DEFINITION.name}. Mandate: ${DEFINITION.mandate}`;

export const OPEN_INSTRUCTIONS = `${GLOBAL_INSTRUCTIONS}

${ROLE}

Open the debate. State the specific claim under test in one or two sentences, and instruct the market panel that they speak first, then rebut each other, then the Tech Validator closes with a single feasibility attack before the verdict.`;

export const VERDICT_INSTRUCTIONS = `${GLOBAL_INSTRUCTIONS}

${ROLE}

The debate is complete. Write the closing verdict: a short status line, a consensus score from 0 to 100 reflecting how well the idea held up under cross-examination, a list of concrete risks with severity, a conclusion, and the single most important thing that remains unproven. Weigh whether the market panel genuinely converged versus remained split, and weigh whether the submitter provided supporting research — an idea defended with no evidence should never score as high as one backed by real evidence, even if the argument sounds equally confident.`;
