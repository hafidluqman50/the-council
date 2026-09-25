import { parseEventLogs, type Address, type Hash, type Hex } from "viem";

import { councilThreadRegistryAbi } from "../../abi/CouncilThreadRegistry";
import { ChainClient } from "./ChainClient";

export type DebateAgentKey = "orc" | "m1" | "m2" | "m3" | "tech";

export class ThreadRegistryService {
  constructor(
    private readonly chainClient: ChainClient,
    private readonly registryAddress: Address,
    private readonly serviceWriterPrivateKey: `0x${string}`,
    private readonly agentPrivateKeys: Record<DebateAgentKey, `0x${string}`>,
  ) {}

  async openThread(threadId: Hex, author: Address, ideaHash: Hex): Promise<Hash> {
    const walletClient = this.chainClient.walletClientFor(this.serviceWriterPrivateKey);
    const { request } = await this.chainClient.publicClient.simulateContract({
      address: this.registryAddress,
      abi: councilThreadRegistryAbi,
      functionName: "openThread",
      args: [threadId, author, ideaHash],
      account: walletClient.account,
    });
    const transactionHash = await walletClient.writeContract(request);
    await this.chainClient.publicClient.waitForTransactionReceipt({ hash: transactionHash });
    return transactionHash;
  }

  async recordPost(params: {
    threadId: Hex;
    agentKey: DebateAgentKey;
    agentId: bigint;
    round: number;
    contentHash: Hex;
  }): Promise<{ sequence: number; transactionHash: Hash }> {
    const walletClient = this.chainClient.walletClientFor(this.agentPrivateKeys[params.agentKey]);
    const { request } = await this.chainClient.publicClient.simulateContract({
      address: this.registryAddress,
      abi: councilThreadRegistryAbi,
      functionName: "recordPost",
      args: [params.threadId, params.agentId, params.round, params.contentHash],
      account: walletClient.account,
    });
    const transactionHash = await walletClient.writeContract(request);
    const receipt = await this.chainClient.publicClient.waitForTransactionReceipt({ hash: transactionHash });

    const [recordedEvent] = parseEventLogs({
      abi: councilThreadRegistryAbi,
      eventName: "PostRecorded",
      logs: receipt.logs,
    });
    if (!recordedEvent) {
      throw new Error("recordPost succeeded but no PostRecorded event was found in its logs");
    }

    return { sequence: recordedEvent.args.sequence, transactionHash };
  }

  async recordVerdict(params: {
    threadId: Hex;
    agentKey: DebateAgentKey;
    agentId: bigint;
    score: number;
    verdictHash: Hex;
  }): Promise<Hash> {
    const walletClient = this.chainClient.walletClientFor(this.agentPrivateKeys[params.agentKey]);
    const { request } = await this.chainClient.publicClient.simulateContract({
      address: this.registryAddress,
      abi: councilThreadRegistryAbi,
      functionName: "recordVerdict",
      args: [params.threadId, params.agentId, params.score, params.verdictHash],
      account: walletClient.account,
    });
    const transactionHash = await walletClient.writeContract(request);
    await this.chainClient.publicClient.waitForTransactionReceipt({ hash: transactionHash });
    return transactionHash;
  }
}
