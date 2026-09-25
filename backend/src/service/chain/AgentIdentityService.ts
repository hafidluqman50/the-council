import { parseEventLogs, type Address } from "viem";

import { identityRegistryAbi } from "../../abi/IdentityRegistry";
import { ChainClient } from "./ChainClient";

export class AgentIdentityService {
  constructor(
    private readonly chainClient: ChainClient,
    private readonly identityRegistryAddress: Address,
  ) {}

  async registerIdentity(agentPrivateKey: `0x${string}`): Promise<bigint> {
    const walletClient = this.chainClient.walletClientFor(agentPrivateKey);
    const publicClient = this.chainClient.publicClient;

    const { request } = await publicClient.simulateContract({
      address: this.identityRegistryAddress,
      abi: identityRegistryAbi,
      functionName: "register",
      account: walletClient.account,
    });

    const transactionHash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });

    const [transferEvent] = parseEventLogs({
      abi: identityRegistryAbi,
      eventName: "Transfer",
      logs: receipt.logs,
    });

    if (!transferEvent) {
      throw new Error("Registration succeeded but no Transfer event was found in its logs");
    }

    return transferEvent.args.tokenId;
  }

  async ownerOf(agentId: bigint): Promise<Address> {
    return this.chainClient.publicClient.readContract({
      address: this.identityRegistryAddress,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [agentId],
    });
  }
}
