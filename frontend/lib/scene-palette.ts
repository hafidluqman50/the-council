import type { AgentKey, ThreadStatus } from "@/http/threads";

// WebGL materials cannot read CSS variables, and the scenes always render the night diorama
// (plan council-frontend-3d-redesign v1.1 §7.1), so they mirror the `.dark` token values here.
export const SCENE_AGENT_COLORS: Record<AgentKey, string> = {
  orc: "#f5f5f5",
  m1: "#34d399",
  m2: "#10b981",
  m3: "#2dd4bf",
  tech: "#60a5fa",
};

export const SCENE_ACCENT = "#f3ba2f";

export const SCENE_STATUS_COLORS: Record<ThreadStatus, string> = {
  live: SCENE_ACCENT,
  resolved: "#34d399",
  revise: "#60a5fa",
  failed: "#8b8b95",
};

export const SCENE_COLORS = {
  background: "#07080c",
  fog: "#0c0d14",
  skyTop: "#03040a",
  skyMid: "#10131f",
  skyBottom: "#2b1d0b",
  stars: "#dde2ff",
  cloud: "#3b3346",
  marble: "#d9d3c4",
  brass: "#c29a5b",
  darkStone: "#1c1c21",
  tableStone: "#15151a",
  slab: "#2a282d",
  rock: "#2f2b30",
  leaf: "#2d5a43",
  trunk: "#3b2a20",
  cloth: "#2a2a31",
  ceramic: "#e8e4dc",
  leather: "#1f1f25",
  lamp: "#ffc983",
  keyLight: "#ffdcb2",
  rimLight: "#6f86ff",
  hemiSky: "#8a97c8",
  hall: "#08080c",
  hallMarble: "#26232b",
  seat: "#2a1f22",
  spectator: "#24242b",
  spectatorHead: "#9b978f",
  scaffold: "#6b6f78",
  plank: "#5a4632",
  ruin: "#4a4a52",
  ember: "#b45309",
} as const;
