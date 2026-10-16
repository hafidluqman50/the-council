import type { AgentKey, ThreadStatus } from "@/http/threads";

export type IslandVariant = "session" | "monument" | "scaffold" | "ruin";

export function islandVariant(status: ThreadStatus): IslandVariant {
  switch (status) {
    case "live":
      return "session";
    case "resolved":
      return "monument";
    case "revise":
      return "scaffold";
    default:
      return "ruin";
  }
}

export type BeamTarget = AgentKey | "core";

export function beamTarget(post: { agentKey: AgentKey; quoteOfAgentKey: AgentKey | null }): BeamTarget {
  if (post.quoteOfAgentKey && post.quoteOfAgentKey !== post.agentKey) return post.quoteOfAgentKey;
  return "core";
}

export function scoreToHeight(score: number | null, min: number, max: number): number {
  if (score === null || Number.isNaN(score)) return min;
  const clamped = Math.max(0, Math.min(100, score));
  return min + (max - min) * (clamped / 100);
}

export function typedLength(elapsedMs: number, delayMs: number, msPerChar: number, length: number): number {
  return Math.max(0, Math.min(length, Math.floor((elapsedMs - delayMs) / msPerChar)));
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/^#+\s?/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
