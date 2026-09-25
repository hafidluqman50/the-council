import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc, bscTestnet } from "wagmi/chains";

const isMainnet = process.env.NEXT_PUBLIC_BSC_CHAIN_ID === "56";

export const activeChain = isMainnet ? bsc : bscTestnet;

export const wagmiConfig = getDefaultConfig({
  appName: "The Council",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "the-council-dev",
  chains: [activeChain],
  ssr: true,
});
