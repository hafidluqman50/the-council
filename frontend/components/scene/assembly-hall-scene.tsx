"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  Vector3,
} from "three";

import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import { useDebateReplay } from "@/hooks/use-debate-replay";
import type { AgentKey, ThreadDetail } from "@/http/threads";
import { derivePostTag } from "@/lib/post-tag";
import { beamTarget, seededRandom, stripMarkdown, type BeamTarget } from "@/lib/scene-logic";
import { SCENE_ACCENT, SCENE_AGENT_COLORS, SCENE_COLORS } from "@/lib/scene-palette";
import { PointField } from "./atmosphere";
import { Chair, CouncilFigure, faceCenterRotation, SEATED_HEAD_HEIGHT, STANDING_HEAD_HEIGHT } from "./council-figure";
import { ArgumentBeam, ChainBlock, CouncilMark, SceneLabel, Shockwave, useGlowMaterial } from "./debate-props";
import { buildAnnulusSector, buildLathe, createStandard, sharedMaterials } from "./materials";
import { OrbitRig, type OrbitGoal } from "./orbit-rig";
import { SceneStage } from "./stage";

const TABLE_START = Math.PI / 2 + 0.62;
const TABLE_END = Math.PI / 2 - 0.62 + Math.PI * 2;
const SEAT_RADIUS = 4.5;
const ROSTRUM_Z = -5.4;
const ROSTRUM_TOP = 0.44;
const TIER_PHI_START = Math.PI + 0.82;
const TIER_PHI_LENGTH = Math.PI * 2 - 1.64;
const RING_Y = 5.4;
const RING_RADIUS = 3.1;
const MAX_BLOCKS = 16;

const PANEL_SEATS: Array<{ key: AgentKey; angle: number }> = [
  { key: "m1", angle: Math.PI / 2 + 1.0 },
  { key: "m2", angle: Math.PI / 2 + 2.05 },
  { key: "m3", angle: Math.PI / 2 - 1.0 },
  { key: "tech", angle: Math.PI / 2 - 2.05 },
];

const SEATS = PANEL_SEATS.map((seat) => {
  const x = Math.cos(seat.angle) * SEAT_RADIUS;
  const z = Math.sin(seat.angle) * SEAT_RADIUS;
  return { ...seat, x, z, rotation: faceCenterRotation(x, z), head: new Vector3(x, SEATED_HEAD_HEIGHT, z) };
});

const ORC_HEAD = new Vector3(0, ROSTRUM_TOP + STANDING_HEAD_HEIGHT, ROSTRUM_Z - 0.12);
const CORE = new Vector3(0, 2.2, 0);

function headOf(target: BeamTarget): Vector3 {
  if (target === "core") return CORE;
  if (target === "orc") return ORC_HEAD;
  return SEATS.find((seat) => seat.key === target)?.head ?? CORE;
}

type HallItem = {
  agentKey: AgentKey;
  tag: string;
  target: BeamTarget;
  text: string;
  round: number;
};

function buildItems(thread: ThreadDetail): HallItem[] {
  const items: HallItem[] = thread.posts.map((post) => ({
    agentKey: post.agentKey,
    tag: derivePostTag(post),
    target: beamTarget(post),
    text: stripMarkdown(post.body),
    round: post.round,
  }));
  if (thread.verdict) {
    items.push({
      agentKey: "orc",
      tag: "VERDICT",
      target: "core",
      text: stripMarkdown(`${thread.verdict.statusText}. ${thread.verdict.conclusion}`),
      round: items[items.length - 1]?.round ?? 1,
    });
  }
  return items;
}

function drawRing(canvas: HTMLCanvasElement, name: string, color: string, tag: string, text: string): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(8,8,11,0.8)";
  context.fillRect(0, 0, width, height);
  const half = width / 2;
  for (let copy = 0; copy < 2; copy += 1) {
    const x = copy * half + 40;
    context.textBaseline = "middle";
    context.font = '600 40px "JetBrains Mono", ui-monospace, monospace';
    context.fillStyle = color;
    context.fillText(`● ${name.toUpperCase()}  ·  ${tag}`, x, 46);
    context.font = '500 40px Inter, system-ui, sans-serif';
    context.fillStyle = "#f5f5f5";
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      line = context.measureText(candidate).width > half - 90 ? `…${word}` : candidate;
    }
    context.fillText(line, x, 108);
  }
}

function RingDisplay({ name, color, tag, text }: { name: string; color: string; tag: string; text: string }) {
  const materials = sharedMaterials();
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4096;
    canvas.height = 160;
    const created = new CanvasTexture(canvas);
    created.colorSpace = SRGBColorSpace;
    created.wrapS = RepeatWrapping;
    created.anisotropy = 8;
    return created;
  }, []);
  const material = useMemo(() => {
    const built = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    built.toneMapped = false;
    return built;
  }, [texture]);
  useEffect(() => () => {
    texture.dispose();
    material.dispose();
  }, [texture, material]);

  const meshRef = useRef<Mesh>(null);
  useEffect(() => {
    const map = (meshRef.current?.material as MeshBasicMaterial | undefined)?.map;
    if (!map) return;
    drawRing(map.image as HTMLCanvasElement, name, color, tag, text);
    map.needsUpdate = true;
  }, [name, color, tag, text]);

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = -state.clock.elapsedTime * 0.11;
  });

  return (
    <group position={[0, RING_Y, 0]}>
      <mesh ref={meshRef} material={material}>
        <cylinderGeometry args={[RING_RADIUS, RING_RADIUS, 0.95, 128, 1, true]} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[RING_RADIUS - 0.02, RING_RADIUS - 0.02, 0.95, 128, 1, true]} />
        <meshBasicMaterial color="#050507" side={BackSide} transparent opacity={0.85} />
      </mesh>
      {[0.5, -0.5].map((offset) => (
        <mesh key={offset} material={materials.brass} position={[0, offset, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[RING_RADIUS + 0.02, 0.04, 8, 128]} />
        </mesh>
      ))}
    </group>
  );
}

function Tiers({ crowd }: { crowd: number }) {
  const materials = sharedMaterials();
  const tiers = useMemo(
    () => buildLathe([[8, 0], [8, 0.45], [9.3, 0.45], [9.3, 0.9], [10.6, 0.9], [10.6, 1.35], [11.9, 1.35], [11.9, 1.8], [12.8, 1.8], [12.8, 0], [8, 0]], 96, TIER_PHI_START, TIER_PHI_LENGTH),
    [],
  );
  const lips = useMemo(
    () =>
      [[8.02, 0.45], [9.32, 0.9], [10.62, 1.35], [11.92, 1.8]].map(([radius, y]) =>
        buildLathe([[radius, y - 0.025], [radius + 0.03, y - 0.025], [radius + 0.03, y + 0.005], [radius, y + 0.005]], 96, TIER_PHI_START, TIER_PHI_LENGTH),
      ),
    [],
  );
  const lipMaterial = useGlowMaterial(SCENE_COLORS.lamp, 1.4);
  const spots = useMemo(() => {
    const list: Array<{ radius: number; y: number; phi: number }> = [];
    [[8.65, 0.45], [9.95, 0.9], [11.25, 1.35]].forEach(([radius, y]) => {
      const step = 0.95 / radius;
      for (let phi = TIER_PHI_START + 0.06; phi < TIER_PHI_START + TIER_PHI_LENGTH - 0.04; phi += step) list.push({ radius, y, phi });
    });
    return list;
  }, []);
  const occupied = useMemo(() => {
    const random = seededRandom(77);
    return spots
      .map((spot) => ({ spot, take: random() < crowd, scale: 0.95 + random() * 0.12, tint: random(), glow: 0.5 + random() * 0.6 }))
      .filter((entry) => entry.take);
  }, [spots, crowd]);

  const seatGeometry = useMemo(() => new BoxGeometry(0.56, 0.08, 0.5), []);
  const backGeometry = useMemo(() => new BoxGeometry(0.56, 0.62, 0.08), []);
  const bodyGeometry = useMemo(() => buildLathe([[0, 0], [0.22, 0], [0.24, 0.1], [0.2, 0.36], [0.17, 0.5], [0.11, 0.58], [0, 0.6]], 16), []);
  const headGeometry = useMemo(() => new SphereGeometry(0.12, 14, 10), []);
  const visorGeometry = useMemo(() => new BoxGeometry(0.17, 0.03, 0.03), []);
  const seatMaterial = useMemo(() => createStandard(SCENE_COLORS.seat, { roughness: 0.6, env: 0.3 }), []);
  const bodyMaterial = useMemo(() => createStandard(SCENE_COLORS.spectator, { roughness: 0.85, env: 0.2 }), []);
  const headMaterial = useMemo(() => createStandard(SCENE_COLORS.spectatorHead, { roughness: 0.4, env: 0.5 }), []);
  const visorMaterial = useMemo(() => {
    const built = new MeshBasicMaterial({ color: "#ffffff" });
    built.toneMapped = false;
    return built;
  }, []);
  useEffect(() => () => {
    [tiers, ...lips, seatGeometry, backGeometry, bodyGeometry, headGeometry, visorGeometry].forEach((geometry) => geometry.dispose());
    [seatMaterial, bodyMaterial, headMaterial, visorMaterial].forEach((material) => material.dispose());
  }, [tiers, lips, seatGeometry, backGeometry, bodyGeometry, headGeometry, visorGeometry, seatMaterial, bodyMaterial, headMaterial, visorMaterial]);

  const seatRef = useRef<InstancedMesh>(null);
  const backRef = useRef<InstancedMesh>(null);
  const bodyRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  const visorRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    spots.forEach((spot, index) => {
      dummy.position.set(Math.sin(spot.phi) * spot.radius, spot.y + 0.42, Math.cos(spot.phi) * spot.radius);
      dummy.rotation.set(0, spot.phi + Math.PI, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      seatRef.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(Math.sin(spot.phi) * (spot.radius + 0.23), spot.y + 0.72, Math.cos(spot.phi) * (spot.radius + 0.23));
      dummy.updateMatrix();
      backRef.current?.setMatrixAt(index, dummy.matrix);
    });
    const palette = [SCENE_AGENT_COLORS.m1, SCENE_AGENT_COLORS.tech, SCENE_AGENT_COLORS.m3, SCENE_AGENT_COLORS.orc, SCENE_ACCENT].map((hex) => new Color(hex).multiplyScalar(1.4));
    occupied.forEach((entry, index) => {
      const { spot } = entry;
      const x = Math.sin(spot.phi) * (spot.radius + 0.02);
      const z = Math.cos(spot.phi) * (spot.radius + 0.02);
      dummy.rotation.set(0, spot.phi + Math.PI, 0);
      dummy.scale.setScalar(entry.scale);
      dummy.position.set(x, spot.y + 0.46, z);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, spot.y + 1.18, z);
      dummy.updateMatrix();
      headRef.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x - Math.sin(spot.phi) * 0.11, spot.y + 1.19, z - Math.cos(spot.phi) * 0.11);
      dummy.updateMatrix();
      visorRef.current?.setMatrixAt(index, dummy.matrix);
      visorRef.current?.setColorAt(index, palette[Math.floor(entry.tint * palette.length)].clone().multiplyScalar(entry.glow));
    });
    [seatRef, backRef, bodyRef, headRef, visorRef].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
    if (visorRef.current?.instanceColor) visorRef.current.instanceColor.needsUpdate = true;
  }, [spots, occupied]);

  return (
    <group>
      <mesh geometry={tiers} material={materials.hallMarble} receiveShadow />
      {lips.map((geometry, index) => (
        <mesh key={index} geometry={geometry} material={lipMaterial} />
      ))}
      <instancedMesh ref={seatRef} args={[seatGeometry, seatMaterial, spots.length]} receiveShadow />
      <instancedMesh ref={backRef} args={[backGeometry, seatMaterial, spots.length]} />
      {occupied.length > 0 && (
        <>
          <instancedMesh ref={bodyRef} args={[bodyGeometry, bodyMaterial, occupied.length]} />
          <instancedMesh ref={headRef} args={[headGeometry, headMaterial, occupied.length]} />
          <instancedMesh ref={visorRef} args={[visorGeometry, visorMaterial, occupied.length]} />
        </>
      )}
    </group>
  );
}

function HallArchitecture() {
  const materials = sharedMaterials();
  const tableTop = useMemo(() => buildAnnulusSector(2.85, 3.95, TABLE_START, TABLE_END, 0.08, 0.04), []);
  const skirt = useMemo(() => buildAnnulusSector(3.78, 3.86, TABLE_START, TABLE_END, 0.66, 0.01), []);
  const skirtInner = useMemo(() => buildAnnulusSector(2.9, 2.96, TABLE_START, TABLE_END, 0.66, 0.01), []);
  const edge = useMemo(() => buildAnnulusSector(3.97, 4.0, TABLE_START, TABLE_END, 0.01, 0), []);
  const trim = useMemo(() => buildAnnulusSector(3.86, 3.9, TABLE_START, TABLE_END, 0.03, 0), []);
  useEffect(() => () => [tableTop, skirt, skirtInner, edge, trim].forEach((geometry) => geometry.dispose()), [tableTop, skirt, skirtInner, edge, trim]);
  const edgeGlow = useGlowMaterial(SCENE_ACCENT, 1.6);
  const columnStrip = useGlowMaterial(SCENE_COLORS.lamp, 1.5);
  const bulb = useGlowMaterial("#ffd9a0", 3.2);
  const backdrop = useMemo(() => createStandard("#141217", { roughness: 0.55, side: DoubleSide, env: 0.3 }), []);
  useEffect(() => () => backdrop.dispose(), [backdrop]);

  const columns = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => (index / 18) * Math.PI * 2 + Math.PI / 18)
        .filter((angle) => Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI))) >= 0.45)
        .map((angle) => ({ angle, x: Math.sin(angle), z: Math.cos(angle) })),
    [],
  );

  return (
    <group>
      <mesh material={materials.tableStone} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[16, 128]} />
      </mesh>
      {[[5.25, 5.36], [7.55, 7.65], [1.7, 1.75]].map(([inner, outer]) => (
        <mesh key={inner} material={materials.brass} rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
          <ringGeometry args={[inner, outer, 160]} />
        </mesh>
      ))}
      <group position={[0, 0.012, 0]}>
        <CouncilMark color={SCENE_ACCENT} scale={0.75} />
      </group>

      <mesh geometry={tableTop} material={materials.tableStone} rotation-x={-Math.PI / 2} position={[0, 0.78, 0]} castShadow receiveShadow />
      <mesh geometry={skirt} material={materials.hallMarble} rotation-x={-Math.PI / 2} position={[0, 0.08, 0]} castShadow />
      <mesh geometry={skirtInner} material={materials.hallMarble} rotation-x={-Math.PI / 2} position={[0, 0.08, 0]} />
      <mesh geometry={edge} material={edgeGlow} rotation-x={-Math.PI / 2} position={[0, 0.84, 0]} />
      <mesh geometry={trim} material={materials.brass} rotation-x={-Math.PI / 2} position={[0, 0.4, 0]} />

      <mesh material={backdrop} position={[0, 4, 0]} receiveShadow>
        <cylinderGeometry args={[9.2, 9.2, 8, 64, 1, true, Math.PI - 0.5, 1]} />
      </mesh>
      {Array.from({ length: 11 }, (_, index) => {
        const angle = Math.PI - 0.47 + index * 0.094;
        return (
          <mesh key={index} material={materials.brass} position={[Math.sin(angle) * 9.1, 4, Math.cos(angle) * 9.1]}>
            <boxGeometry args={[0.05, 7.6, 0.05]} />
          </mesh>
        );
      })}
      <group position={[0, 4.9, -9]} rotation-x={Math.PI / 2}>
        <CouncilMark color={SCENE_ACCENT} scale={1.15} strength={1} />
      </group>
      <pointLight color={SCENE_ACCENT} intensity={6} distance={7} decay={2} position={[0, 4.9, -8.2]} />

      {columns.map((column) => (
        <group key={column.angle}>
          <mesh material={materials.hallMarble} position={[column.x * 13.8, 5.5, column.z * 13.8]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 11, 24]} />
          </mesh>
          <mesh material={columnStrip} position={[column.x * 13.42, 5.4, column.z * 13.42]}>
            <boxGeometry args={[0.06, 9.5, 0.06]} />
          </mesh>
        </group>
      ))}
      <mesh material={materials.brass} position={[0, 10.6, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[13.8, 0.18, 10, 160]} />
      </mesh>
      <group position={[0, 9.4, 0]}>
        <mesh material={materials.brass} rotation-x={Math.PI / 2}>
          <torusGeometry args={[4.6, 0.07, 10, 128]} />
        </mesh>
        {Array.from({ length: 28 }, (_, index) => {
          const angle = (index / 28) * Math.PI * 2;
          return (
            <mesh key={index} material={bulb} position={[Math.cos(angle) * 4.6, -0.12, Math.sin(angle) * 4.6]}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
          );
        })}
      </group>

      <mesh material={materials.brass} position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.12, 48]} />
      </mesh>
    </group>
  );
}

function Rostrum({ active, hovered, onHover, onPick }: { active: boolean; hovered: boolean; onHover: (key: AgentKey | null) => void; onPick: (key: AgentKey) => void }) {
  const materials = sharedMaterials();
  const color = SCENE_AGENT_COLORS.orc;
  return (
    <group
      position={[0, 0, ROSTRUM_Z]}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover("orc");
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (event.delta > 6) return;
        event.stopPropagation();
        onPick("orc");
      }}
    >
      <RoundedBox args={[2.8, 0.22, 1.9]} radius={0.05} smoothness={2} position={[0, 0.11, 0]} material={materials.marble} castShadow receiveShadow />
      <RoundedBox args={[2.2, 0.22, 1.45]} radius={0.05} smoothness={2} position={[0, 0.33, -0.1]} material={materials.marble} castShadow receiveShadow />
      <RoundedBox args={[1, 1.05, 0.5]} radius={0.06} smoothness={2} position={[0, 0.96, 0.42]} rotation-x={0.05} material={materials.hallMarble} castShadow />
      <RoundedBox args={[1.15, 0.06, 0.62]} radius={0.02} smoothness={2} position={[0, 1.5, 0.4]} rotation-x={-0.18} material={materials.brass} castShadow />
      <group position={[0, 0.98, 0.68]} rotation-x={Math.PI / 2}>
        <CouncilMark color={SCENE_ACCENT} scale={0.12} />
      </group>
      <group position={[0, ROSTRUM_TOP, -0.12]}>
        <CouncilFigure color={color} standing active={active} hovered={hovered} phase={0.4} />
      </group>
      <SceneLabel text={getAgentRosterEntry("orc").initial} color={color} position={[0, 2.9, -0.1]} emphasis={hovered ? 1 : active ? 0.5 : 0} />
    </group>
  );
}

function SpeakerSpot({ speaker, verdict }: { speaker: AgentKey | null; verdict: boolean }) {
  const lightRef = useRef<SpotLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame((_, delta) => {
    const head = speaker ? headOf(speaker) : CORE;
    target.position.lerp(head, 1 - Math.exp(-delta * 4));
    target.updateMatrixWorld();
    const light = lightRef.current;
    if (!light) return;
    light.position.lerp(new Vector3(head.x * 0.5, 9.2, head.z * 0.5 + 1), 1 - Math.exp(-delta * 2));
    light.intensity += ((verdict ? 90 : 60) - light.intensity) * 0.05;
  });
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={lightRef}
        target={target}
        color="#fff0d8"
        intensity={60}
        distance={18}
        angle={0.26}
        penumbra={0.6}
        decay={1.3}
        position={[0, 9.2, 1]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </>
  );
}

function FlyingBlock({ from, to, color }: { from: Vector3; to: Vector3; color: string }) {
  const ref = useRef<Group>(null);
  const age = useRef(0);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    age.current = Math.min(1, age.current + delta / 1.1);
    const p = age.current;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += 1.6;
    const a = from.clone().lerp(mid, e);
    const b = mid.clone().lerp(to, e);
    group.position.copy(a.lerp(b, e));
    group.rotation.y += delta * (p < 1 ? 5 : 0.25);
  });
  return (
    <group ref={ref} position={from.toArray()}>
      <ChainBlock color={color} />
    </group>
  );
}

function slot(index: number): Vector3 {
  return new Vector3(0, 0.3 + index * 0.29, 0);
}

function CameraDirector({ follow, director, speaker, verdictWide, hold }: { follow: AgentKey | null; director: boolean; speaker: AgentKey | null; verdictWide: boolean; hold: AgentKey | "verdict" | null }) {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);
  const baseRadius = aspect < 0.9 ? 20 : aspect < 1.4 ? 17 : 15;
  const heldKey = hold === "verdict" ? null : hold;
  const key = follow ?? (director ? (verdictWide ? null : speaker) : heldKey);
  const wide = !follow && (director ? verdictWide : hold === "verdict");
  let goal: OrbitGoal = { target: [0, 1.4, -1.2], radius: baseRadius, polar: 0.94, azimuth: 0 };
  if (wide) {
    goal = { target: [0, 2.2, -2.6], radius: 12, polar: 1.1, azimuth: 0 };
  } else if (key === "orc") {
    goal = { target: [ORC_HEAD.x, ORC_HEAD.y - 0.2, ORC_HEAD.z], radius: 7.5, polar: 1.3, azimuth: 0.25 };
  } else if (key) {
    const seat = SEATS.find((item) => item.key === key);
    if (seat) {
      goal = {
        target: [seat.head.x, seat.head.y - 0.2, seat.head.z],
        radius: 6.2,
        polar: 1.2,
        azimuth: Math.atan2(-Math.cos(seat.angle), -Math.sin(seat.angle)) + 0.4,
      };
    }
  }
  return <OrbitRig goal={goal} polarRange={[0.5, 1.38]} damping={2.2} />;
}

export default function AssemblyHallScene({ thread }: { thread: ThreadDetail }) {
  const items = useMemo(() => buildItems(thread), [thread]);
  const isLive = thread.status === "live" && !thread.verdict && !thread.debateError;
  const lengths = useMemo(() => items.map((item) => item.text.length), [items]);
  const replay = useDebateReplay(isLive ? [] : lengths, { loop: false });
  const [director, setDirector] = useState(true);
  const [follow, setFollow] = useState<AgentKey | null>(null);
  const [hovered, setHovered] = useState<AgentKey | null>(null);
  const [hold, setHold] = useState<AgentKey | "verdict" | null>(null);

  const activeTurn = isLive ? thread.activeTurn ?? null : null;
  const liveDraft = activeTurn && thread.draft && thread.draft.agentKey === activeTurn.agentKey && thread.draft.round === activeTurn.round ? stripMarkdown(thread.draft.text) : "";
  const lastPost = items[items.length - 1] ?? null;

  let speaker: AgentKey | null;
  let tag: string;
  let text: string;
  let target: BeamTarget;
  let recorded: number;
  let round: number;
  let typing: boolean;
  if (isLive) {
    speaker = activeTurn?.agentKey ?? lastPost?.agentKey ?? null;
    tag = activeTurn ? "WRITING" : lastPost?.tag ?? "WAITING";
    text = activeTurn ? liveDraft || "Thinking…" : lastPost?.text ?? "The council is drafting a response.";
    target = activeTurn ? "core" : lastPost?.target ?? "core";
    recorded = thread.posts.length;
    round = activeTurn?.round ?? lastPost?.round ?? 1;
    typing = Boolean(activeTurn);
  } else {
    const item = items[replay.index] ?? null;
    speaker = item?.agentKey ?? null;
    tag = item?.tag ?? "";
    text = item ? item.text.slice(0, replay.typed) : "This thread has no posts yet.";
    target = item?.target ?? "core";
    recorded = items.length > 0 ? Math.min(replay.index + 1, thread.posts.length) : 0;
    round = item?.round ?? 1;
    typing = item ? replay.typed < item.text.length : false;
  }
  const verdictShown = !isLive && Boolean(thread.verdict) && replay.index === items.length - 1;
  const verdictWide = verdictShown && replay.typed > 30;
  const speakerEntry = speaker ? getAgentRosterEntry(speaker) : null;
  const speakerColor = speaker ? SCENE_AGENT_COLORS[speaker] : "#9d9da5";
  const targetName = target === "core" ? "the idea" : getAgentRosterEntry(target).name;
  const settledBlocks = Math.min(MAX_BLOCKS, Math.max(0, recorded - 1));
  const ringName = speakerEntry?.name ?? "The Council";

  const overlay = (
    <>
      <div className="pointer-events-none absolute top-3.5 right-4 left-4 z-10 flex flex-wrap justify-between gap-2 font-mono text-[11px]" style={{ color: "#9d9da5" }}>
        <span className="rounded-lg px-2.5 py-1.5" style={{ background: "rgba(12,12,16,0.72)", border: "1px solid #26262c" }}>
          {isLive ? "LIVE · " : ""}ROUND {round}
        </span>
        <span className="rounded-lg px-2.5 py-1.5" style={{ background: "rgba(12,12,16,0.72)", border: "1px solid #26262c" }}>
          RECORDED ON-CHAIN · {thread.posts.length} {thread.posts.length === 1 ? "POST" : "POSTS"}
          {thread.verdict ? " + VERDICT" : ""}
        </span>
      </div>
      <div
        className="absolute right-3 bottom-3 left-3 z-10 flex flex-col gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: "rgba(11,11,15,0.84)", border: "1px solid #26262c", backdropFilter: "blur(14px)" }}
      >
        {!isLive && items.length > 0 && (
          <div className="flex gap-1" role="group" aria-label="Jump to post">
            {items.map((item, index) => {
              const color = SCENE_AGENT_COLORS[item.agentKey];
              const done = index < replay.index;
              const isCurrent = index === replay.index;
              return (
                <button key={index} type="button" aria-label={`Replay post ${index + 1} by ${getAgentRosterEntry(item.agentKey).name}`} onClick={() => replay.jump(index)} className="flex h-5 flex-1 items-center">
                  <span className="block w-full rounded-sm" style={{ height: isCurrent ? 5 : 3, background: done || isCurrent ? color : "#2a2a30", opacity: done ? 0.6 : 1 }} />
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span className="inline-flex items-center gap-2" style={{ color: speakerColor }}>
                <span className="h-2 w-2 rounded-full" style={{ background: speakerColor }} />
                {speakerEntry?.name ?? "The council"}
              </span>
              {tag && (
                <span className="rounded-md px-2 py-0.5" style={{ border: "1px solid #2a2a30", color: "#c9c9ce" }}>
                  {tag}
                </span>
              )}
              <span style={{ color: "#80808a" }}>→ {targetName}</span>
            </div>
            <p aria-live="polite" className="m-0 min-h-[44px] text-[15px] leading-[1.5]" style={{ color: "#f5f5f5" }}>
              {text.length > 260 ? `…${text.slice(-260)}` : text}
              {typing && <span className="ml-0.5 inline-block h-4 w-2 align-[-2px]" style={{ background: "#f5f5f5", animation: "pulse-dot 1s steps(2) infinite" }} />}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isLive && (
              <>
                <button type="button" aria-label="Previous post" onClick={() => replay.jump(replay.index - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#1e1e22", color: "#c9c9ce" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={replay.playing ? "Pause the replay" : "Play the replay"}
                  onClick={() => {
                    if (!replay.playing && replay.finished) replay.jump(0);
                    replay.setPlaying(!replay.playing || replay.finished);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: "#1e1e22", color: "#f5f5f5" }}
                >
                  {replay.playing && !replay.finished ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M7 5v14l12-7z" />
                    </svg>
                  )}
                </button>
                <button type="button" aria-label="Next post" onClick={() => replay.jump(replay.index + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#1e1e22", color: "#c9c9ce" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
            <button
              type="button"
              aria-pressed={director}
              onClick={() => {
                setFollow(null);
                setHold(null);
                setDirector((value) => !value);
              }}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-medium"
              style={{ background: director ? "#f5f5f5" : "#1e1e22", color: director ? "#0b0b0d" : "#c9c9ce" }}
            >
              Director cam
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <SceneStage
      label="3D assembly hall: the four council agents sit at a horseshoe table, the Orchestrator stands at the rostrum, spectators fill the tiers, and a ring display above the table shows the current statement. Each recorded post stacks as a block at the centre of the floor. Drag to orbit, click an agent to follow it."
      className="h-[560px] overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--line)", background: SCENE_COLORS.hall }}
      background={SCENE_COLORS.hall}
      fog={{ color: "#08080c", density: 0.032 }}
      bloom={0.95}
      cameraPosition={[0, 9, 12]}
      overlay={overlay}
    >
      <CameraDirector follow={follow} director={director} speaker={speaker} verdictWide={verdictWide} hold={hold} />
      <HallDirectorBridge
        onDrag={() => {
          if (!director || follow) return;
          setHold(verdictWide ? "verdict" : speaker);
          setDirector(false);
        }}
      />
      <hemisphereLight args={["#8a90b0", "#120d08", 0.35]} />
      <directionalLight
        color="#ffe2c0"
        intensity={1.5}
        position={[4, 16, 9]}
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
      <pointLight color="#ffc27a" intensity={14} distance={16} decay={2} position={[-9, 4, 4]} />
      <pointLight color="#ffc27a" intensity={14} distance={16} decay={2} position={[9, 4, 4]} />
      <HallArchitecture />
      <Tiers crowd={0.45} />
      <Rostrum active={speaker === "orc"} hovered={hovered === "orc" || follow === "orc"} onHover={setHovered} onPick={(key) => setFollow((current) => (current === key ? null : key))} />
      {SEATS.map((seat, index) => {
        const color = SCENE_AGENT_COLORS[seat.key];
        const isHot = hovered === seat.key || follow === seat.key;
        const isActive = speaker === seat.key;
        return (
          <group
            key={seat.key}
            position={[seat.x, 0, seat.z]}
            rotation-y={seat.rotation}
            onPointerOver={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setHovered(seat.key);
            }}
            onPointerOut={() => setHovered(null)}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              if (event.delta > 6) return;
              event.stopPropagation();
              setFollow((current) => (current === seat.key ? null : seat.key));
            }}
          >
            <Chair color={color} glow={1.2 + (isActive ? 2.2 : 0) + (isHot ? 1 : 0)} />
            <group position={[0, 0.56, 0.06]}>
              <CouncilFigure color={color} active={isActive} hovered={isHot} phase={index * 1.3} />
            </group>
            <RoundedBox args={[0.7, 0.16, 0.05]} radius={0.02} smoothness={2} position={[0, 0.92, 0.82]} rotation-x={-0.4} material={sharedMaterials().brass} />
            <SceneLabel text={getAgentRosterEntry(seat.key).initial} color={color} position={[0, 2.55, 0]} emphasis={isHot ? 1 : isActive ? 0.5 : 0} />
          </group>
        );
      })}
      <RingDisplay name={ringName} color={speakerColor} tag={tag || "WAITING"} text={text} />
      <SpeakerSpot speaker={speaker} verdict={verdictShown} />
      <group>
        {Array.from({ length: settledBlocks }, (_, index) => (
          <group key={index} position={slot(index).toArray()} rotation-y={index * 0.35}>
            <ChainBlock color={SCENE_AGENT_COLORS[items[index]?.agentKey ?? "orc"]} glow={verdictShown ? 0.9 : 0.55} />
          </group>
        ))}
      </group>
      {recorded > 0 && recorded <= MAX_BLOCKS && items[recorded - 1] && (
        <FlyingBlock key={`fly-${recorded}`} from={headOf(items[recorded - 1].agentKey)} to={slot(recorded - 1)} color={SCENE_AGENT_COLORS[items[recorded - 1].agentKey]} />
      )}
      {speaker && (
        <ArgumentBeam key={`beam-${speaker}-${recorded}-${tag}`} from={headOf(speaker)} to={headOf(target)} color={speakerColor} lift={target === "core" ? 1 : 2} />
      )}
      <Shockwave color={SCENE_ACCENT} trigger={verdictShown ? 1 : 0} maxScale={12} duration={2.8} />
      <PointField count={380} seed={12} radius={12} height={9} baseY={0.5} size={0.05} color="#ffe2b8" opacity={0.35} spin={0.01} />
    </SceneStage>
  );
}

function HallDirectorBridge({ onDrag }: { onDrag: () => void }) {
  const gl = useThree((state) => state.gl);
  const onDragRef = useRef(onDrag);
  useEffect(() => {
    onDragRef.current = onDrag;
  });
  useEffect(() => {
    const element = gl.domElement;
    let start: { x: number; y: number } | null = null;
    const down = (event: PointerEvent) => {
      start = { x: event.clientX, y: event.clientY };
    };
    const move = (event: PointerEvent) => {
      if (start && Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y) > 6) {
        start = null;
        onDragRef.current();
      }
    };
    const up = () => {
      start = null;
    };
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);
  return null;
}
