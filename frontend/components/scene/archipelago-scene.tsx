"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, Group, Mesh, QuadraticBezierCurve3, TubeGeometry, Vector3 } from "three";

import type { ForumFilter } from "@/components/forum/filter-chips";
import type { AgentKey, ThreadStatus, ThreadSummary } from "@/http/threads";
import { islandVariant, scoreToHeight } from "@/lib/scene-logic";
import { SCENE_ACCENT, SCENE_AGENT_COLORS, SCENE_COLORS, SCENE_STATUS_COLORS } from "@/lib/scene-palette";
import { CloudLayer, PointField, SkyDome } from "./atmosphere";
import { Chair, CouncilFigure, faceCenterRotation } from "./council-figure";
import { ArgumentBeam, SceneLabel, useGlowMaterial } from "./debate-props";
import { buildLathe, createStandard, sharedMaterials } from "./materials";
import { OrbitRig, type OrbitGoal } from "./orbit-rig";
import { RockIsland, Tree } from "./rock-island";
import { SceneStage, usePrefersReducedMotion } from "./stage";

const MAX_ISLANDS = 12;
const PANEL_AGENTS: AgentKey[] = ["orc", "m1", "m2", "m3", "tech"];

const STATUS_LABEL: Record<ThreadStatus, string> = {
  live: "LIVE",
  resolved: "RESOLVED",
  revise: "REVISE",
  failed: "FAILED",
};

type IslandLayout = {
  thread: ThreadSummary;
  position: Vector3;
  baseY: number;
  angle: number;
};

function layoutIslands(threads: ThreadSummary[]): IslandLayout[] {
  const shown = threads.slice(0, MAX_ISLANDS);
  const count = Math.max(shown.length, 1);
  return shown.map((thread, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.2;
    const distance = 8.4 + (index % 2) * 1.6 + (count > 8 ? 1.2 : 0);
    const baseY = Math.sin(index * 1.7) * 1.1;
    return { thread, angle, baseY, position: new Vector3(Math.cos(angle) * distance, baseY, Math.sin(angle) * distance) };
  });
}

function SessionDiorama({ color }: { color: string }) {
  const materials = sharedMaterials();
  const table = useMemo(() => buildLathe([[0, 0], [0.18, 0], [0.08, 0.05], [0.07, 0.25], [0.12, 0.28], [0.62, 0.29], [0.66, 0.33], [0, 0.33]], 48), []);
  useEffect(() => () => table.dispose(), [table]);
  const ring = useGlowMaterial(color, 1.8);
  const core = useGlowMaterial(color, 2.2);
  const beam = useGlowMaterial(color, 0.4, { additive: true, opacity: 0.3, side: DoubleSide });
  const [speaker, setSpeaker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSpeaker((value) => (value + 1) % PANEL_AGENTS.length), 2400);
    return () => clearInterval(interval);
  }, []);
  const coreRef = useRef<Mesh>(null);
  useFrame((state, delta) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y += delta;
    coreRef.current.position.y = 0.75 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
  });

  return (
    <group>
      <mesh geometry={table} material={materials.tableStone} castShadow />
      <mesh material={ring} rotation-x={-Math.PI / 2} position={[0, 0.333, 0]}>
        <ringGeometry args={[0.4, 0.43, 64]} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.75, 0]}>
        <icosahedronGeometry args={[0.16, 1]} />
        <primitive object={core} attach="material" wireframe />
      </mesh>
      <mesh material={beam} position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 4.5, 24, 1, true]} />
      </mesh>
      {PANEL_AGENTS.map((key, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
        const x = Math.cos(angle) * 0.95;
        const z = Math.sin(angle) * 0.95;
        return (
          <group key={key} position={[x, 0, z]} rotation-y={faceCenterRotation(x, z)} scale={0.38}>
            <Chair color={SCENE_AGENT_COLORS[key]} glow={index === speaker ? 3 : 1.2} />
            <group position={[0, 0.56, 0.04]}>
              <CouncilFigure color={SCENE_AGENT_COLORS[key]} active={index === speaker} phase={index * 1.3} />
            </group>
          </group>
        );
      })}
      <pointLight color={color} intensity={3} distance={4} decay={2} position={[0, 0.9, 0]} />
    </group>
  );
}

function MonumentDiorama({ color, score, seed }: { color: string; score: number | null; seed: number }) {
  const materials = sharedMaterials();
  const height = scoreToHeight(score, 0.6, 2.6);
  const seal = useGlowMaterial(color, 2.4);
  return (
    <group>
      <RoundedBox args={[1, 0.2, 0.55]} radius={0.05} smoothness={2} position={[0, 0.1, 0]} material={materials.marble} castShadow receiveShadow />
      <RoundedBox args={[0.62, height, 0.22]} radius={0.05} smoothness={2} position={[0, 0.2 + height / 2, 0]} material={materials.marble} castShadow />
      <RoundedBox args={[0.72, 0.08, 0.3]} radius={0.03} smoothness={2} position={[0, 0.2 + height + 0.04, 0]} material={materials.brass} castShadow />
      <mesh material={materials.brass} position={[0, 0.2 + height * 0.72, 0.13]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.17, 0.17, 0.04, 40]} />
      </mesh>
      <mesh material={seal} position={[0, 0.2 + height * 0.72, 0.152]}>
        <circleGeometry args={[0.11, 40]} />
      </mesh>
      <mesh material={materials.brass} position={[0, 0.03, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.62, 0.03, 8, 64]} />
      </mesh>
      <Tree seed={seed} position={[-0.95, 0, 0.5]} scale={0.9} />
      <Tree seed={seed + 1} position={[0.85, 0, -0.65]} scale={1.05} />
      <Tree seed={seed + 2} position={[0.55, 0, 0.85]} scale={1.2} />
    </group>
  );
}

function ScaffoldDiorama({ color, score }: { color: string; score: number | null }) {
  const materials = sharedMaterials();
  const height = scoreToHeight(score, 0.6, 2.6) * 0.62;
  const scaffoldHeight = height / 0.62 * 1.15 + 0.2;
  const poles = useMemo(() => createStandard(SCENE_COLORS.scaffold, { roughness: 0.5, metalness: 0.7 }), []);
  const planks = useMemo(() => createStandard(SCENE_COLORS.plank, { roughness: 0.9 }), []);
  useEffect(() => () => {
    poles.dispose();
    planks.dispose();
  }, [poles, planks]);
  const lamp = useGlowMaterial(color, 3.4);
  return (
    <group>
      <RoundedBox args={[1, 0.2, 0.55]} radius={0.05} smoothness={2} position={[0, 0.1, 0]} material={materials.marble} castShadow receiveShadow />
      <RoundedBox args={[0.62, height, 0.22]} radius={0.05} smoothness={2} position={[0, 0.2 + height / 2, 0]} material={materials.marble} castShadow />
      {[[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={poles} position={[x, scaffoldHeight / 2, z]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, scaffoldHeight, 6]} />
        </mesh>
      ))}
      {[0.45, scaffoldHeight - 0.05].map((y) => (
        <group key={y} position={[0, y, 0]}>
          {[-0.22, 0.22].map((z) => (
            <mesh key={z} material={poles} position={[0, 0, z]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.014, 0.014, 0.86, 6]} />
            </mesh>
          ))}
          <mesh material={planks} position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.9, 0.025, 0.5]} />
          </mesh>
        </group>
      ))}
      <mesh material={lamp} position={[0.42, scaffoldHeight + 0.06, 0.22]}>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>
      <RoundedBox args={[0.28, 0.24, 0.28]} radius={0.03} smoothness={2} position={[-0.85, 0.12, 0.5]} material={planks} castShadow />
    </group>
  );
}

function RuinDiorama() {
  const stone = useMemo(() => createStandard(SCENE_COLORS.ruin, { roughness: 0.75 }), []);
  useEffect(() => () => stone.dispose(), [stone]);
  const ember = useGlowMaterial(SCENE_COLORS.ember, 2.2);
  return (
    <group rotation-z={0.09}>
      <RoundedBox args={[1, 0.2, 0.55]} radius={0.05} smoothness={2} position={[0, 0.1, 0]} material={stone} castShadow receiveShadow />
      <RoundedBox args={[0.62, 0.55, 0.22]} radius={0.05} smoothness={2} position={[0, 0.38, 0]} rotation-z={-0.06} material={stone} castShadow />
      <RoundedBox args={[0.62, 0.7, 0.22]} radius={0.05} smoothness={2} position={[0.7, 0.14, 0.45]} rotation={[0.2, 0.5, 1.45]} material={stone} castShadow />
      <mesh material={stone} position={[-0.5, 0.06, 0.55]}>
        <dodecahedronGeometry args={[0.1, 0]} />
      </mesh>
      <mesh material={ember} position={[0, 0.7, 0.12]}>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
    </group>
  );
}

function Bridge({ to, color, live }: { to: Vector3; color: string; live: boolean }) {
  const from = useMemo(() => new Vector3(0, 0.05, 0), []);
  const end = useMemo(() => to.clone().setY(to.y - 0.25).multiplyScalar(0.84), [to]);
  const tube = useMemo(() => {
    const mid = from.clone().add(end).multiplyScalar(0.5);
    mid.y -= 0.9;
    return new TubeGeometry(new QuadraticBezierCurve3(from, mid, end), 48, 0.02, 5, false);
  }, [from, end]);
  useEffect(() => () => tube.dispose(), [tube]);
  const material = useGlowMaterial(color, 1.2, { opacity: 0.22 });
  if (live) return <ArgumentBeam from={end} to={from} color={color} lift={-0.9} />;
  return <mesh geometry={tube} material={material} />;
}

function Island({
  layout,
  matches,
  hovered,
  selected,
  onHover,
  onSelect,
  index,
}: {
  layout: IslandLayout;
  matches: boolean;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  index: number;
}) {
  const { thread } = layout;
  const color = SCENE_STATUS_COLORS[thread.status];
  const variant = islandVariant(thread.status);
  const rim = useGlowMaterial(color, 1.4);
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const motion = useRef({ lift: 0, sink: 0 });

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const k = 1 - Math.exp(-delta * 4);
    const m = motion.current;
    m.lift += (((hovered || selected) && matches ? 0.45 : 0) - m.lift) * k;
    m.sink += ((matches ? 0 : 1) - m.sink) * k;
    group.position.set(layout.position.x, layout.baseY + Math.sin(state.clock.elapsedTime * 0.7 + index * 1.3) * 0.18 + m.lift - m.sink * 2.2, layout.position.z);
    group.scale.setScalar(1 - m.sink * 0.25);
    if (innerRef.current) innerRef.current.rotation.y += delta * 0.04;
  });

  const emphasis = selected ? 1 : hovered ? 0.6 : 0;
  return (
    <group
      ref={groupRef}
      position={layout.position.toArray()}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover(thread.id);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (event.delta > 6) return;
        event.stopPropagation();
        onSelect(thread.id);
      }}
    >
      <group ref={innerRef}>
        <RockIsland radius={1.6} depth={2.8} seed={7 + index * 13} rimMaterial={rim} bits={3} />
        <mesh material={sharedMaterials().darkStone} rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
          <circleGeometry args={[1.45, 64]} />
        </mesh>
        {variant === "session" && <SessionDiorama color={color} />}
        {variant === "monument" && <MonumentDiorama color={color} score={thread.score} seed={index * 7 + 3} />}
        {variant === "scaffold" && <ScaffoldDiorama color={color} score={thread.score} />}
        {variant === "ruin" && <RuinDiorama />}
      </group>
      <SceneLabel
        text={thread.score === null ? "··" : String(thread.score)}
        sub={`#${thread.id} · ${thread.status}`}
        color={color}
        position={[0, 3.2, 0]}
        emphasis={emphasis}
        opacity={matches ? 1 : 0.25}
      />
    </group>
  );
}

function Hub() {
  const materials = sharedMaterials();
  const rim = useGlowMaterial(SCENE_ACCENT, 1.6);
  const core = useGlowMaterial(SCENE_ACCENT, 2.4);
  const hubRef = useRef<Group>(null);
  const armillaryRef = useRef<Group>(null);
  const ringRefs = useRef<Array<Mesh | null>>([]);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (hubRef.current) hubRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    if (armillaryRef.current) armillaryRef.current.position.y = 2.2 + Math.sin(t * 1.1) * 0.08;
    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;
      ring.rotation.x += delta * (0.2 + index * 0.12);
      ring.rotation.y += delta * (0.15 + index * 0.08);
    });
  });
  return (
    <group ref={hubRef}>
      <RockIsland radius={2.2} depth={3.4} seed={99} rimMaterial={rim} bits={4} />
      <mesh material={materials.marble} position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.5, 48]} />
      </mesh>
      <mesh material={materials.brass} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.4, 12]} />
      </mesh>
      <group ref={armillaryRef} position={[0, 2.2, 0]}>
        {[1.25, 1.05, 0.85].map((radius, index) => (
          <mesh
            key={radius}
            material={materials.brass}
            rotation={[index * 0.9, index * 0.5, 0]}
            castShadow
            ref={(mesh) => {
              ringRefs.current[index] = mesh;
            }}
          >
            <torusGeometry args={[radius, 0.045, 10, 96]} />
          </mesh>
        ))}
        <mesh material={materials.brass} rotation-z={0.35}>
          <cylinderGeometry args={[0.025, 0.025, 3.2, 8]} />
        </mesh>
        <mesh material={core}>
          <icosahedronGeometry args={[0.32, 2]} />
        </mesh>
        <pointLight color={SCENE_ACCENT} intensity={10} distance={9} decay={2} />
      </group>
    </group>
  );
}

function CameraDirector({ selected, layouts }: { selected: string | null; layouts: IslandLayout[] }) {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);
  const baseRadius = aspect < 0.9 ? 52 : aspect < 1.4 ? 38 : 30;
  const reduced = usePrefersReducedMotion();
  let goal: OrbitGoal = { target: [0, 0.4, 0], radius: baseRadius, polar: 1.08 };
  const chosen = selected ? layouts.find((layout) => layout.thread.id === selected) : null;
  if (chosen) {
    goal = {
      target: [chosen.position.x, chosen.baseY + 1, chosen.position.z],
      radius: 8.5,
      polar: 1.12,
      azimuth: Math.atan2(chosen.position.x, chosen.position.z) + 0.25,
    };
  }
  return <OrbitRig goal={goal} autoOrbit={!selected && !reduced} orbitSpeed={0.04} polarRange={[0.6, 1.42]} />;
}

export default function ArchipelagoScene({ threads, filter }: { threads: ThreadSummary[]; filter: ForumFilter }) {
  const layouts = useMemo(() => layoutIslands(threads), [threads]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = selected ? threads.find((thread) => thread.id === selected) ?? null : null;
  const hiddenCount = Math.max(0, threads.length - MAX_ISLANDS);

  const overlay = (
    <>
      <div className="pointer-events-none absolute top-3.5 left-4 z-10 flex flex-wrap gap-3.5 font-mono text-[11px]" style={{ color: "#9d9da5" }}>
        {(Object.keys(STATUS_LABEL) as ThreadStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: SCENE_STATUS_COLORS[status] }} />
            {STATUS_LABEL[status]}
          </span>
        ))}
      </div>
      <span className="pointer-events-none absolute right-4 bottom-3 left-4 z-10 font-mono text-[11px]" style={{ color: "#6b6b75" }}>
        one island per thread · monument height = consensus score · click an island to preview
        {hiddenCount > 0 ? ` · ${hiddenCount} older threads in the list below` : ""}
      </span>
      {chosen && (
        <aside
          aria-live="polite"
          className="absolute top-3.5 right-3.5 z-10 flex w-[min(320px,calc(100%-28px))] flex-col gap-3 rounded-2xl p-4"
          style={{ background: "rgba(14,14,18,0.88)", border: "1px solid #2a2a30", backdropFilter: "blur(14px)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="rounded-full px-2.5 py-[3px] font-mono text-[11px] font-semibold"
              style={{ background: SCENE_STATUS_COLORS[chosen.status], color: "#111111" }}
            >
              {STATUS_LABEL[chosen.status]}
            </span>
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setSelected(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#1e1e22", color: "#c9c9ce" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <span className="font-display text-lg leading-[1.25] font-semibold" style={{ color: "#f5f5f5", letterSpacing: "-0.02em" }}>
            {chosen.title}
          </span>
          <div className="flex items-center justify-between gap-3 border-t pt-2.5 font-mono text-xs" style={{ borderColor: "#26262c", color: "#80808a" }}>
            <span>
              #{chosen.id} · {chosen.replyCount} replies
            </span>
            <span className="text-xl font-semibold" style={{ color: "#f5f5f5" }}>
              {chosen.score ?? "··"}
            </span>
          </div>
          <Link
            href={`/forum/${chosen.id}`}
            className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold"
            style={{ background: "#f5f5f5", color: "#0b0b0d" }}
          >
            Enter the hall
          </Link>
        </aside>
      )}
    </>
  );

  return (
    <SceneStage
      label="3D archipelago: every thread is a floating island around the on-chain index. Live debates show the council at a table, resolved threads carry a monument, revise threads stand under scaffolding, failed threads lie broken. Drag to orbit, click an island to preview the thread."
      className="h-[460px] overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--line2)", background: SCENE_COLORS.background }}
      background={SCENE_COLORS.background}
      fog={{ color: "#0a1016", density: 0.018 }}
      bloom={0.85}
      cameraPosition={[12, 12, 28]}
      overlay={overlay}
    >
      <CameraDirector selected={selected} layouts={layouts} />
      <SkyDome top="#03050a" mid="#0d1520" bottom="#0b1a1c" />
      <PointField count={900} seed={14} sphere radius={150} size={0.55} opacity={0.75} color={SCENE_COLORS.stars} fog={false} />
      <CloudLayer count={70} seed={19} color="#2e3a44" y={-6.5} radius={42} innerRadius={2} scale={9} opacity={0.6} spread={3.5} spin={0.005} />
      <hemisphereLight args={["#8fa6c8", "#0b1a1c", 0.55]} />
      <directionalLight
        color="#ffe0bd"
        intensity={2}
        position={[-10, 18, 10]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-far={60}
      />
      <directionalLight color="#5f9cff" intensity={0.7} position={[12, 6, -12]} />
      <Hub />
      {layouts.map((layout, index) => {
        const matches = filter === "all" || layout.thread.status === filter;
        return (
          <group key={layout.thread.id}>
            <Island
              layout={layout}
              index={index}
              matches={matches}
              hovered={hovered === layout.thread.id}
              selected={selected === layout.thread.id}
              onHover={setHovered}
              onSelect={(id) => setSelected((current) => (current === id ? null : id))}
            />
            {matches && <Bridge to={layout.position} color={SCENE_STATUS_COLORS[layout.thread.status]} live={layout.thread.status === "live"} />}
          </group>
        );
      })}
    </SceneStage>
  );
}
