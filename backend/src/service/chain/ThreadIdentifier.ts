import { keccak256, toHex, type Hex } from "viem";

/** Derives the deterministic on-chain bytes32 identifier for a thread from its Postgres UUID —
 * kept in one place so every call site (controller, debate runner) hashes it identically. */
export class ThreadIdentifier {
  static hashOf(threadId: string): Hex {
    return keccak256(toHex(threadId));
  }

  static ideaHashOf(idea: string): Hex {
    return keccak256(toHex(idea));
  }
}
