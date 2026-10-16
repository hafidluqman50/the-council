"use client";

import dynamic from "next/dynamic";

import { SCENE_COLORS } from "@/lib/scene-palette";

function ScenePlaceholder({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl font-mono text-xs"
      style={{ height, background: SCENE_COLORS.background, border: "1px solid var(--line)", color: "#80808a" }}
    >
      {label}
    </div>
  );
}

export const LazyRotundaScene = dynamic(() => import("./rotunda-scene"), {
  ssr: false,
  loading: () => <ScenePlaceholder height={600} label="Raising the rotunda…" />,
});

export const LazyArchipelagoScene = dynamic(() => import("./archipelago-scene"), {
  ssr: false,
  loading: () => <ScenePlaceholder height={460} label="Surfacing the archipelago…" />,
});

export const LazyAssemblyHallScene = dynamic(() => import("./assembly-hall-scene"), {
  ssr: false,
  loading: () => <ScenePlaceholder height={560} label="Opening the hall…" />,
});
