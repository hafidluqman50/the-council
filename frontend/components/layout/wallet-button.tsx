"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <button
            type="button"
            onClick={connected ? (chain.unsupported ? openChainModal : openAccountModal) : openConnectModal}
            className="flex h-10 items-center gap-[9px] rounded-lg bg-ink py-0 pr-2 pl-[18px] font-sans text-sm font-semibold text-canvas transition-colors hover:bg-ink-pressed"
            aria-hidden={!ready}
          >
            <span>{connected ? (chain.unsupported ? "Wrong network" : account.displayName) : "Connect wallet"}</span>
            <span className="rounded-md bg-white/[0.14] px-[9px] py-[5px] font-mono text-xs font-normal">
              {connected ? account.displayBalance ?? "" : "BSC"}
            </span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
