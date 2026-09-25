export function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function formatAtomicAmount(atomic: string, decimals = 18): string {
  const value = Number(BigInt(atomic)) / 10 ** decimals;
  return value.toString();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const BSC_TESTNET_EXPLORER_TX_URL = "https://testnet.bscscan.com/tx/";
