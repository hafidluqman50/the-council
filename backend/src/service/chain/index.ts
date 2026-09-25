import { type Address } from "viem";

import { env } from "../../config/env";
import { AgentIdentityService } from "./AgentIdentityService";
import { ChainClient } from "./ChainClient";
import { ThreadRegistryService } from "./ThreadRegistryService";

export const chainClient = new ChainClient(env.chain.rpcUrl, env.chain.chainId);

export const agentIdentityService = new AgentIdentityService(
  chainClient,
  env.chain.identityRegistry as Address,
);

export const threadRegistryService = new ThreadRegistryService(
  chainClient,
  env.chain.threadRegistry as Address,
  env.chain.minterPrivateKey as `0x${string}`,
  {
    orc: env.agentWallets.orc as `0x${string}`,
    m1: env.agentWallets.m1 as `0x${string}`,
    m2: env.agentWallets.m2 as `0x${string}`,
    m3: env.agentWallets.m3 as `0x${string}`,
    tech: env.agentWallets.tech as `0x${string}`,
  },
);

export type { DebateAgentKey } from "./ThreadRegistryService";
