import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import type { AgentKey } from "@/http/threads";
import { alpha } from "@/lib/color";

export function AgentAvatar({ agentKey, size = 28 }: { agentKey: AgentKey; size?: number }) {
  const agent = getAgentRosterEntry(agentKey);

  return (
    <span
      title={agent.name}
      className="inline-flex flex-none items-center justify-center rounded-full font-mono text-[11px]"
      style={{ width: size, height: size, backgroundColor: alpha(agent.color, 0.1), color: agent.color }}
    >
      {agent.initial}
    </span>
  );
}
