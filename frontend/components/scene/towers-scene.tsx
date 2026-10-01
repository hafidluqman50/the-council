"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useIsoScene } from "@/components/scene/use-iso-scene";
import { shade } from "@/lib/color";
import type { ThreadStatus } from "@/http/threads";

const ACCENT = "#F3BA2F";
const PLATFORM_WIDTH = 600;
const TOWER_SIZE = 88;

type TowerThread = {
  id: string;
  status: ThreadStatus;
  score: number | null;
};

function towerColors(status: ThreadStatus): { top: string; south: string; west: string } {
  switch (status) {
    case "live":
      return { top: ACCENT, south: shade(ACCENT, 88), west: shade(ACCENT, 74) };
    case "resolved":
      return { top: "var(--tower-mint-top)", south: "var(--tower-mint-s)", west: "var(--tower-mint-e)" };
    default:
      return { top: "var(--iso-top)", south: "var(--iso-s)", west: "var(--iso-e)" };
  }
}

export function TowersScene({
  threads,
  activeFilter,
}: {
  threads: TowerThread[];
  activeFilter: ThreadStatus | "all";
}) {
  const router = useRouter();
  const sceneRef = useIsoScene(660);
  const [hovered, setHovered] = useState<number | null>(null);

  const spacing =
    threads.length > 1 ? Math.min(140, (PLATFORM_WIDTH - TOWER_SIZE - 80) / (threads.length - 1)) : 0;

  const billboard = "rotateZ(calc(40deg - var(--tx, 0deg))) rotateX(calc(-58deg - var(--ty, 0deg)))";

  return (
    <div
      ref={sceneRef}
      className="relative overflow-hidden rounded-2xl bg-surface-soft"
      style={{
        height: "calc(400px * var(--s, 1))",
        border: "1px solid var(--line2)",
        touchAction: "pan-y",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div className="absolute top-1/2 left-1/2 h-0 w-0" style={{ perspective: 1800, transform: "scale(var(--s, 1))" }}>
        <div
          className="absolute"
          style={{
            left: -300,
            top: -150,
            width: PLATFORM_WIDTH,
            height: 300,
            transformStyle: "preserve-3d",
            transform: "translateY(40px) rotateX(calc(58deg + var(--ty, 0deg))) rotateZ(calc(-40deg + var(--tx, 0deg)))",
          }}
        >
          {/* platform */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "var(--iso-top)",
              backgroundImage:
                "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              border: "1px solid var(--line)",
            }}
          />
          <div
            className="absolute"
            style={{ left: 0, top: 300, width: PLATFORM_WIDTH, height: 16, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: "var(--iso-s)" }}
          />
          <div
            className="absolute"
            style={{ top: 0, left: -16, width: 16, height: 300, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", background: "var(--iso-e)" }}
          />

          {threads.map((thread, index) => {
            const height = Math.max(18, Math.round((thread.score ?? 0) * 1.7));
            const x = threads.length > 1 ? 40 + index * spacing : (PLATFORM_WIDTH - TOWER_SIZE) / 2;
            const colors = towerColors(thread.status);
            const dimmed = activeFilter !== "all" && thread.status !== activeFilter;
            const opacity = dimmed ? 0.22 : 1;
            const lift = hovered === index ? 16 : 0;

            return (
              <div
                key={thread.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/forum/${thread.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") router.push(`/forum/${thread.id}`);
                }}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left: x,
                  top: 106,
                  width: TOWER_SIZE,
                  height: TOWER_SIZE,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${lift}px)`,
                  transition: "transform 400ms cubic-bezier(.2,.8,.2,1)",
                  cursor: "pointer",
                }}
              >
                {/* south face */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: TOWER_SIZE,
                    width: TOWER_SIZE,
                    height,
                    transformOrigin: "50% 0",
                    transform: "rotateX(90deg)",
                    background: colors.south,
                    opacity,
                    transition: "opacity 300ms ease, height 700ms cubic-bezier(.2,.8,.2,1)",
                  }}
                />
                {/* west face */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: -height,
                    width: height,
                    height: TOWER_SIZE,
                    transformOrigin: "100% 50%",
                    transform: "rotateY(90deg)",
                    background: colors.west,
                    opacity,
                    transition: "opacity 300ms ease, left 700ms cubic-bezier(.2,.8,.2,1), width 700ms cubic-bezier(.2,.8,.2,1)",
                  }}
                />
                {/* top face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: "1px solid rgba(0,0,0,0.06)",
                    background: colors.top,
                    transform: `translateZ(${height}px)`,
                    opacity,
                    transition: "opacity 300ms ease, transform 700ms cubic-bezier(.2,.8,.2,1)",
                  }}
                />
                {/* label */}
                <div
                  style={{
                    position: "absolute",
                    left: TOWER_SIZE / 2,
                    top: TOWER_SIZE / 2,
                    transformStyle: "preserve-3d",
                    transform: `translateZ(${height + 12}px)`,
                    transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  <div
                    className="pointer-events-none flex justify-center"
                    style={{ position: "absolute", left: -60, bottom: 0, width: 120, transformOrigin: "50% 100%", transform: billboard }}
                  >
                    <div
                      className="flex flex-col items-center gap-0.5 rounded-[10px] border bg-canvas px-3 py-1.5"
                      style={{ borderColor: "var(--line)", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", opacity }}
                    >
                      <span className="font-mono text-[20px] leading-none font-medium" style={{ color: "var(--ink)" }}>
                        {thread.score ?? "··"}
                      </span>
                      <span className="font-mono text-[10.5px] whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        #{thread.id} · {thread.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <span className="absolute right-4 bottom-3 left-4 font-mono text-[11px]" style={{ color: "var(--faint)" }}>
        tower height = consensus score · click a tower to open · drag to rotate
      </span>
    </div>
  );
}
