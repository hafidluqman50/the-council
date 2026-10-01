"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import { useIsoScene } from "@/components/scene/use-iso-scene";
import { useIsDark } from "@/hooks/use-is-dark";
import { alpha, shade } from "@/lib/color";
import type { AgentKey } from "@/http/threads";

const SEAT_KEYS: AgentKey[] = ["orc", "m1", "m2", "m3", "tech"];
const TABLE_LAYERS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const ACCENT = "#F3BA2F";

export type CouncilScenePost = {
  agentKey: AgentKey;
  tag: string;
  body: string;
};

type ScheduledPost = CouncilScenePost & { start: number; dur: number; end: number };

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function CouncilScene({
  threadRef,
  score,
  posts,
}: {
  threadRef: string;
  score: number | null;
  posts: CouncilScenePost[];
}) {
  const sceneRef = useIsoScene(580);
  const isDark = useIsDark();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  const schedule: ScheduledPost[] = useMemo(() => {
    const scheduled: ScheduledPost[] = [];
    let prevEnd = 0;
    for (let index = 0; index < posts.length; index += 1) {
      const post = posts[index];
      const body = stripMarkdown(post.body);
      const dur = Math.max(1300, body.length * 15);
      const start = index === 0 ? 800 : prevEnd + 1200;
      prevEnd = start + dur;
      scheduled.push({ ...post, body, start, dur, end: prevEnd });
    }
    return scheduled;
  }, [posts]);

  const total = schedule.length > 0 ? schedule[schedule.length - 1].end : 0;

  useEffect(() => {
    startRef.current = Date.now();
    const timer = setInterval(() => {
      const t = Date.now() - startRef.current;
      if (t > total + 9000) {
        startRef.current = Date.now();
        setElapsed(0);
        return;
      }
      setElapsed(t);
    }, 70);
    return () => clearInterval(timer);
  }, [total]);

  const current = schedule.filter((post) => elapsed >= post.start).pop() ?? null;
  const activeKey: AgentKey = current?.agentKey ?? "orc";
  const currentProgress = current ? Math.min(1, (elapsed - current.start) / current.dur) : 0;
  const typed = current
    ? current.body.slice(0, Math.max(1, Math.round(current.body.length * currentProgress)))
    : "Waiting for the first argument.";
  const typing = Boolean(current) && currentProgress < 1;

  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;
  const targetScore = score ?? 0;
  const scoreDisplay = total > 0 ? Math.round(targetScore * progress) : null;
  const round = Math.min(3, Math.floor(progress * 3) + 1);

  const bubbleText = typed.length > 130 ? `${typed.slice(0, 127).replace(/\s+\S*$/, "")}…` : typed;
  const activeAgent = getAgentRosterEntry(activeKey);

  const seats = SEAT_KEYS.map((key, index) => {
    const agent = getAgentRosterEntry(key);
    const on = key === activeKey;
    const theta = ((-45 + index * 72) * Math.PI) / 180;
    const height = on ? 76 : 40;
    const cx = 240 + 172 * Math.cos(theta);
    const cy = 240 + 172 * Math.sin(theta);
    return {
      key,
      initial: agent.initial,
      color: agent.color,
      cx,
      cy,
      hNum: height,
      x: `${Math.round(cx - 22)}px`,
      y: `${Math.round(cy - 22)}px`,
      h: `${height}px`,
      hNeg: `${-height}px`,
      labelZ: `${height + 8}px`,
      south: shade(agent.color, 80),
      west: shade(agent.color, 62),
      glow: on ? `0 0 0 8px ${alpha(agent.color, 0.22)}` : "none",
      labelBg: on ? agent.color : "var(--bg)",
      labelFg: on ? (isDark ? "#111111" : "#ffffff") : agent.color,
    };
  });

  const activeSeat = seats[SEAT_KEYS.indexOf(activeKey)];
  const billboard = "rotateZ(calc(40deg - var(--tx, 0deg))) rotateX(calc(-58deg - var(--ty, 0deg)))";
  const dialDegrees = (scoreDisplay ?? 0) * 3.6;

  return (
    <div
      ref={sceneRef}
      className="relative overflow-hidden"
      style={{
        height: "calc(560px * var(--s, 1))",
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
            left: -240,
            top: -240,
            width: 480,
            height: 480,
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
              backgroundSize: "40px 40px",
              border: "1px solid var(--line)",
            }}
          />
          <div
            className="absolute"
            style={{ left: 0, top: 480, width: 480, height: 18, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: "var(--iso-s)" }}
          />
          <div
            className="absolute"
            style={{ top: 0, left: -18, width: 18, height: 480, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", background: "var(--iso-e)" }}
          />

          {/* council table */}
          <div
            className="absolute"
            style={{
              left: 90,
              top: 90,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,0,0,0.14), transparent 68%)",
              transform: "translateZ(1px)",
            }}
          />
          {TABLE_LAYERS.map((z) => (
            <div
              key={z}
              className="absolute"
              style={{ left: 120, top: 120, width: 240, height: 240, borderRadius: "50%", background: "var(--iso-s)", transform: `translateZ(${z}px)` }}
            />
          ))}
          <div
            className="absolute"
            style={{
              left: 120,
              top: 120,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "var(--iso-top)",
              border: "1px solid var(--line)",
              transform: "translateZ(32px)",
            }}
          />

          {/* consensus dial */}
          <div
            className="absolute"
            style={{
              left: 150,
              top: 150,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `conic-gradient(${ACCENT} ${dialDegrees}deg, var(--line) ${dialDegrees}deg)`,
              transform: "translateZ(33px)",
            }}
          >
            <div className="absolute rounded-full" style={{ inset: 12, background: "var(--iso-top)" }} />
          </div>
          <div className="absolute" style={{ left: 128, top: 128, width: 224, height: 224, transform: "translateZ(33px)" }}>
            <div
              className="absolute inset-0 rounded-full border border-dashed"
              style={{ borderColor: "var(--faint)", animation: "spin-slow 60s linear infinite" }}
            />
          </div>

          {/* agent seats */}
          {seats.map((seat) => (
            <div key={seat.key} style={{ position: "absolute", left: seat.x, top: seat.y, width: 44, height: 44, transformStyle: "preserve-3d" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 44,
                  width: 44,
                  height: seat.h,
                  transformOrigin: "50% 0",
                  transform: "rotateX(90deg)",
                  background: seat.south,
                  transition: "height 600ms cubic-bezier(.2,.8,.2,1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: seat.hNeg,
                  width: seat.h,
                  height: 44,
                  transformOrigin: "100% 50%",
                  transform: "rotateY(90deg)",
                  background: seat.west,
                  transition: "left 600ms cubic-bezier(.2,.8,.2,1), width 600ms cubic-bezier(.2,.8,.2,1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 2,
                  background: seat.color,
                  boxShadow: seat.glow,
                  transform: `translateZ(${seat.h})`,
                  transition: "transform 600ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: 22,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${seat.labelZ})`,
                  transition: "transform 600ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <div
                  className="pointer-events-none flex justify-center"
                  style={{ position: "absolute", left: -40, bottom: 0, width: 80, transformOrigin: "50% 100%", transform: billboard }}
                >
                  <span
                    className="rounded-full border px-2 py-[3px] font-mono text-[11px] whitespace-nowrap"
                    style={{ borderColor: "var(--line)", background: seat.labelBg, color: seat.labelFg }}
                  >
                    {seat.initial}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* center score */}
          <div style={{ position: "absolute", left: 240, top: 240, transformStyle: "preserve-3d", transform: "translateZ(120px)" }}>
            <div
              className="pointer-events-none flex flex-col items-center gap-1"
              style={{ position: "absolute", left: -90, bottom: 0, width: 180, transformOrigin: "50% 100%", transform: billboard }}
            >
              <span className="font-display text-[56px] leading-none font-semibold" style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}>
                {scoreDisplay ?? "—"}
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--muted)" }}>
                consensus · round {round}/3
              </span>
            </div>
          </div>

          {/* active speaker bubble */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformStyle: "preserve-3d",
              transform: `translate3d(${Math.round(activeSeat.cx)}px, ${Math.round(activeSeat.cy)}px, ${activeSeat.hNum + 44}px)`,
              transition: "transform 800ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div
              className="pointer-events-none"
              style={{ position: "absolute", left: -125, bottom: 0, width: 250, transformOrigin: "50% 100%", transform: billboard }}
            >
              <div className="rounded-xl border bg-canvas p-[12px_14px]" style={{ borderColor: "var(--line)", boxShadow: "0 14px 32px rgba(0,0,0,0.14)" }}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold" style={{ color: activeAgent.color }}>
                    {activeAgent.name}
                  </span>
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--muted)" }}>
                    {current?.tag ?? ""}
                  </span>
                </div>
                <div className="text-[13px] leading-[1.45]" style={{ color: "var(--text)" }}>
                  {bubbleText}
                  {typing ? "▍" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="absolute inset-x-0 bottom-0 text-center font-mono text-[11px]" style={{ color: "var(--faint)" }}>
        thread {threadRef} · drag to rotate, tilt on mobile
      </span>
    </div>
  );
}
