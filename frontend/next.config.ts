import type { NextConfig } from "next";

// RainbowKit statically pulls in the Coinbase Base Account connector, which drags @coinbase/cdp-sdk
// and its optional @x402/* peers into the module graph. Those packages have no BNB Chain support at
// all, so rather than installing them we resolve them to a stub that throws if anything calls them.
const X402_SPECIFIERS = [
  "@x402/core/client",
  "@x402/core/schemas",
  "@x402/core/server",
  "@x402/evm",
  "@x402/evm/exact/client",
  "@x402/evm/exact/server",
  "@x402/evm/upto/client",
  "@x402/evm/upto/server",
  "@x402/express",
  "@x402/extensions/bazaar",
  "@x402/fetch",
  "@x402/svm/exact/client",
  "@x402/svm/exact/server",
  "@x402/svm/upto/client",
  "@x402/svm/upto/server",
];

const stubPath = "./lib/stubs/x402-unsupported.ts";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: Object.fromEntries(X402_SPECIFIERS.map((specifier) => [specifier, stubPath])),
  },
};

export default nextConfig;
