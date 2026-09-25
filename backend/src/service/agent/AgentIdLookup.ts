import { Agent } from "../../model";
import type { DebateAgentKey } from "../chain";

export class AgentIdLookup {
  async agentIdOf(agentKey: DebateAgentKey): Promise<bigint> {
    const agent = await Agent.findOne({ where: { agentKey } });
    if (!agent?.agentIdOnchain) {
      throw new Error(`Agent ${agentKey} has no registered ERC-8004 identity (agentIdOnchain is null)`);
    }
    return BigInt(agent.agentIdOnchain);
  }
}

export const agentIdLookup = new AgentIdLookup();
