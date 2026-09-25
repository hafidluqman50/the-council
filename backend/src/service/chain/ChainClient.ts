import { bscTestnet } from "viem/chains";
import { createPublicClient, createWalletClient, http, type Chain, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export class ChainClient {
  readonly publicClient: PublicClient;
  private readonly chain: Chain;
  private readonly rpcUrl: string;

  constructor(rpcUrl: string, chainId: number) {
    this.chain = { ...bscTestnet, id: chainId };
    this.rpcUrl = rpcUrl;
    this.publicClient = createPublicClient({ chain: this.chain, transport: http(rpcUrl) });
  }

  walletClientFor(privateKey: `0x${string}`): WalletClient {
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({ account, chain: this.chain, transport: http(this.rpcUrl) });
  }
}
