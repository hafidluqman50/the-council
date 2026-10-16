"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, Color, DoubleSide, Group, Mesh, type MeshStandardMaterial, Object3D, PlaneGeometry, SpotLight, Vector3 } from "three";

import { getAgentRosterEntry } from "@/components/agent/agent-roster";
import { useDebateReplay } from "@/hooks/use-debate-replay";
import type { AgentKey } from "@/http/threads";
import { beamTarget, seededRandom, stripMarkdown, wrapAngle } from "@/lib/scene-logic";
import { SCENE_ACCENT, SCENE_AGENT_COLORS, SCENE_COLORS } from "@/lib/scene-palette";
import { CloudLayer, PointField, SkyDome } from "./atmosphere";
import { Chair, CouncilFigure, faceCenterRotation, SEATED_HEAD_HEIGHT } from "./council-figure";
import { ArgumentBeam, ChainBlock, SceneLabel, Shockwave, useGlowMaterial } from "./debate-props";
import { buildLathe, createStandard, sharedMaterials } from "./materials";
import { OrbitRig, type OrbitGoal } from "./orbit-rig";
import { RockIsland, Tree } from "./rock-island";
import { SceneStage, usePrefersReducedMotion } from "./stage";

export type RotundaPost = {
  agentKey: AgentKey;
  quoteOfAgentKey: AgentKey | null;
  tag: string;
  body: string;
};

const SEAT_ORDER: AgentKey[] = ["orc", "m1", "m2", "m3", "tech"];
const SEAT_RADIUS = 3.3;
const FLOOR_Y = 0.5;
const COLUMN_HEIGHT = 4.4;
const DOME_RADIUS = 6;
const DOME_SQUASH = 0.72;
const DOME_CUT = Math.PI / 2 - 0.17;
const ENTABLATURE_Y = FLOOR_Y + COLUMN_HEIGHT;
const DOME_Y = ENTABLATURE_Y + 0.5;
const OCULUS_Y = DOME_Y + Math.sin(DOME_CUT) * DOME_RADIUS * DOME_SQUASH;
const OCULUS_RADIUS = Math.cos(DOME_CUT) * DOME_RADIUS;
const CORE_Y = FLOOR_Y + 0.94 + 1.25;

const SEATS = SEAT_ORDER.map((key, index) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
  const x = Math.cos(angle) * SEAT_RADIUS;
  const z = Math.sin(angle) * SEAT_RADIUS;
  return { key, angle, x, z, rotation: faceCenterRotation(x, z), head: new Vector3(x, FLOOR_Y + SEATED_HEAD_HEIGHT, z) };
});

const CORE_POSITION = new Vector3(0, CORE_Y, 0);

function headOf(target: AgentKey | "core"): Vector3 {
  if (target === "core") return CORE_POSITION;
  return SEATS.find((seat) => seat.key === target)?.head ?? CORE_POSITION;
}

function chainSlot(index: number): [number, number, number] {
  return [Math.cos(index * 0.95) * 0.75, CORE_Y + 1.4 + index * 0.5, Math.sin(index * 0.95) * 0.75];
}

function Banner({ color, angle, phase }: { color: string; angle: number; phase: number }) {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(0.95, 2.5, 6, 14);
    plane.translate(0, -1.25, 0);
    return plane;
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const cloth = useMemo(
    () =>
      createStandard(`#${new Color(color).multiplyScalar(0.32).getHexString()}`, {
        roughness: 0.8,
        side: DoubleSide,
        emissive: color,
        emissiveIntensity: 0.06,
        env: 0.2,
      }),
    [color],
  );
  const hem = useGlowMaterial(color, 1.6);
  const meshRef = useRef<Mesh>(null);
  useEffect(() => () => {
    geometry.dispose();
    cloth.dispose();
  }, [geometry, cloth]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const attribute = mesh.geometry.attributes.position as BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let index = 0; index < attribute.count; index += 1) {
      const x = base[index * 3];
      const y = base[index * 3 + 1];
      attribute.setZ(index, Math.sin(t * 1.4 + phase + y * 2.2 + x * 1.5) * 0.06 * (-y / 2.5));
    }
    attribute.needsUpdate = true;
  });

  const x = Math.cos(angle) * 5.55;
  const z = Math.sin(angle) * 5.55;
  return (
    <group position={[x, ENTABLATURE_Y - 0.02, z]} rotation-y={faceCenterRotation(x, z)}>
      <mesh ref={meshRef} geometry={geometry} material={cloth} castShadow />
      <mesh material={hem} position={[0, -2.5, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.02]} />
      </mesh>
      <mesh material={sharedMaterials().brass} position={[0, 0.02, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 1.15, 10]} />
      </mesh>
    </group>
  );
}

function Rotunda() {
  const materials = sharedMaterials();
  const seatRing = useGlowMaterial(SCENE_ACCENT, 1.4);
  const oculusGlow = useGlowMaterial(SCENE_ACCENT, 2);
  const lightShaft = useGlowMaterial(SCENE_ACCENT, 0.22, { additive: true, opacity: 0.22, side: DoubleSide });
  const lamp = useGlowMaterial(SCENE_COLORS.lamp, 3);
  const entablature = useMemo(() => buildLathe([[5.72, 0], [6.45, 0], [6.5, 0.12], [6.45, 0.5], [5.72, 0.5], [5.72, 0]], 128), []);
  useEffect(() => () => entablature.dispose(), [entablature]);

  const columns = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2 + Math.PI / 12;
        return { key: index, x: Math.cos(angle) * 6.05, z: Math.sin(angle) * 6.05 };
      }),
    [],
  );
  const trees = useMemo(() => {
    const random = seededRandom(21);
    return Array.from({ length: 9 }, (_, index) => {
      const angle = (index / 9) * Math.PI * 2 + 0.6;
      const r = 7.45 + random() * 0.35;
      return { key: index, angle, position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number], scale: 0.9 + random() * 0.7 };
    }).filter((tree) => Math.abs(wrapAngle(tree.angle - Math.PI / 2)) >= 0.5);
  }, []);
  const lanterns = useMemo(
    () => Array.from({ length: 6 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2 + 0.25;
      return { key: index, x: Math.cos(angle) * 7.2, z: Math.sin(angle) * 7.2 };
    }),
    [],
  );

  return (
    <group>
      <mesh material={materials.marble} position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.75, 6.95, 0.5, 120]} />
      </mesh>
      <mesh material={materials.darkStone} rotation-x={-Math.PI / 2} position={[0, 0.505, 0]} receiveShadow>
        <circleGeometry args={[6.35, 120]} />
      </mesh>
      {[[4.15, 4.24], [6.32, 6.45], [2.95, 3.0]].map(([inner, outer]) => (
        <mesh key={inner} material={materials.brass} rotation-x={-Math.PI / 2} position={[0, 0.508, 0]}>
          <ringGeometry args={[inner, outer, 160]} />
        </mesh>
      ))}
      <mesh material={seatRing} rotation-x={-Math.PI / 2} position={[0, 0.51, 0]}>
        <ringGeometry args={[3.72, 3.77, 160]} />
      </mesh>
      {[[7.3, 0.34], [7.65, 0.17]].map(([radius, height]) => (
        <mesh key={radius} material={materials.marble} position={[0, height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 64, 1, false, -0.36, 0.72]} />
        </mesh>
      ))}

      {columns.map((column) => (
        <group key={column.key} position={[column.x, 0, column.z]}>
          <mesh material={materials.marble} position={[0, FLOOR_Y + COLUMN_HEIGHT / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.235, COLUMN_HEIGHT, 32]} />
          </mesh>
          <RoundedBox args={[0.62, 0.22, 0.62]} radius={0.05} smoothness={2} position={[0, 0.61, 0]} material={materials.marble} castShadow />
          <RoundedBox args={[0.62, 0.22, 0.62]} radius={0.05} smoothness={2} position={[0, FLOOR_Y + COLUMN_HEIGHT - 0.08, 0]} material={materials.marble} castShadow />
          <mesh material={materials.brass} position={[0, FLOOR_Y + COLUMN_HEIGHT - 0.3, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.215, 0.02, 6, 32]} />
          </mesh>
        </group>
      ))}

      <mesh geometry={entablature} material={materials.marble} position={[0, ENTABLATURE_Y, 0]} castShadow receiveShadow />
      <mesh material={materials.brass} position={[0, ENTABLATURE_Y + 0.36, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[6.47, 0.035, 8, 160]} />
      </mesh>

      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={index} material={materials.brass} position={[0, DOME_Y, 0]} rotation-y={(index * Math.PI) / 6} scale={[1, DOME_SQUASH, 1]} castShadow>
          <torusGeometry args={[DOME_RADIUS, 0.055, 8, 120, Math.PI]} />
        </mesh>
      ))}
      {[0.35, 0.68].map((fraction) => (
        <mesh
          key={fraction}
          material={materials.brass}
          position={[0, DOME_Y + Math.sin((fraction * Math.PI) / 2) * DOME_RADIUS * DOME_SQUASH, 0]}
          rotation-x={Math.PI / 2}
        >
          <torusGeometry args={[Math.cos((fraction * Math.PI) / 2) * DOME_RADIUS, 0.04, 8, 120]} />
        </mesh>
      ))}
      <mesh material={materials.glass} position={[0, DOME_Y, 0]} scale={[1, DOME_SQUASH, 1]}>
        <sphereGeometry args={[DOME_RADIUS - 0.02, 64, 24, 0, Math.PI * 2, 0, DOME_CUT]} />
      </mesh>
      <mesh material={materials.brass} position={[0, OCULUS_Y, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[OCULUS_RADIUS, 0.09, 12, 64]} />
      </mesh>
      <mesh material={oculusGlow} position={[0, OCULUS_Y, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[OCULUS_RADIUS - 0.12, 0.025, 8, 64]} />
      </mesh>
      <mesh material={lightShaft} position={[0, (OCULUS_Y + 0.6) / 2, 0]}>
        <cylinderGeometry args={[OCULUS_RADIUS - 0.1, 2.4, OCULUS_Y - 0.6, 48, 1, true]} />
      </mesh>

      {trees.map((tree) => (
        <Tree key={tree.key} seed={30 + tree.key} position={tree.position} scale={tree.scale} />
      ))}
      {lanterns.map((lantern) => (
        <group key={lantern.key} position={[lantern.x, 0, lantern.z]}>
          <mesh material={materials.brass} position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.9, 10]} />
          </mesh>
          <mesh material={lamp} position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.09, 16, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CouncilTable({ verdict }: { verdict: boolean }) {
  const materials = sharedMaterials();
  const table = useMemo(
    () => buildLathe([[0, 0], [0.55, 0], [0.5, 0.07], [0.24, 0.14], [0.19, 0.68], [0.32, 0.75], [2.18, 0.77], [2.3, 0.81], [2.32, 0.88], [2.2, 0.94], [0, 0.94]], 96),
    [],
  );
  useEffect(() => () => table.dispose(), [table]);
  const inlay = useGlowMaterial(SCENE_ACCENT, 1.6);
  const projector = useGlowMaterial(SCENE_ACCENT, 2.4);
  const wire = useGlowMaterial(SCENE_ACCENT, 1.8);
  const holo = useGlowMaterial(SCENE_ACCENT, 0.5, { additive: true, opacity: 0.35, side: DoubleSide });
  const crystal = useMemo(() => {
    const material = createStandard("#1a1710", { roughness: 0.08, metalness: 0.3, emissive: SCENE_ACCENT, emissiveIntensity: 0.45, flat: true, env: 1.2 });
    return material;
  }, []);
  useEffect(() => () => crystal.dispose(), [crystal]);

  const coreRef = useRef<Group>(null);
  const wireRef = useRef<Mesh>(null);
  const crystalRef = useRef<Mesh>(null);
  const orbitARef = useRef<Mesh>(null);
  const orbitBRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (wireRef.current) {
      wireRef.current.rotation.y += delta * (verdict ? 0.9 : 0.3);
      wireRef.current.rotation.x += delta * 0.12;
    }
    if (crystalRef.current) crystalRef.current.rotation.y -= delta * 0.5;
    if (orbitARef.current) orbitARef.current.rotation.x += delta * 0.4;
    if (orbitBRef.current) orbitBRef.current.rotation.y += delta * 0.55;
    if (coreRef.current) {
      coreRef.current.position.y = CORE_Y + Math.sin(t * 1.3) * 0.07;
      const pulse = verdict ? 1.12 + Math.sin(t * 5) * 0.05 : 1;
      coreRef.current.scale.setScalar(pulse);
    }
    if (crystalRef.current) (crystalRef.current.material as MeshStandardMaterial).emissiveIntensity = verdict ? 1.2 : 0.45;
  });

  return (
    <group>
      <mesh geometry={table} material={materials.tableStone} position={[0, FLOOR_Y, 0]} castShadow receiveShadow />
      <mesh material={materials.brass} rotation-x={-Math.PI / 2} position={[0, FLOOR_Y + 0.942, 0]}>
        <ringGeometry args={[1.95, 2.02, 120]} />
      </mesh>
      <mesh material={inlay} rotation-x={-Math.PI / 2} position={[0, FLOOR_Y + 0.943, 0]}>
        <ringGeometry args={[1.15, 1.18, 120]} />
      </mesh>
      <mesh material={projector} rotation-x={-Math.PI / 2} position={[0, FLOOR_Y + 0.944, 0]}>
        <circleGeometry args={[0.34, 48]} />
      </mesh>
      <mesh material={holo} position={[0, FLOOR_Y + 0.94 + 0.6, 0]}>
        <cylinderGeometry args={[0.7, 0.3, 1.2, 40, 1, true]} />
      </mesh>
      <group ref={coreRef} position={[0, CORE_Y, 0]}>
        <mesh ref={wireRef}>
          <icosahedronGeometry args={[0.62, 1]} />
          <primitive object={wire} attach="material" wireframe />
        </mesh>
        <mesh ref={crystalRef} material={crystal}>
          <octahedronGeometry args={[0.38, 0]} />
        </mesh>
        <mesh ref={orbitARef} material={materials.brass}>
          <torusGeometry args={[0.85, 0.012, 6, 80]} />
        </mesh>
        <mesh ref={orbitBRef} material={materials.brass} rotation-x={1.1}>
          <torusGeometry args={[0.98, 0.012, 6, 80]} />
        </mesh>
      </group>
      <pointLight color={SCENE_ACCENT} intensity={verdict ? 14 : 8} distance={11} decay={2} position={[0, CORE_Y, 0]} />
    </group>
  );
}

function Satellites() {
  const items = useMemo(() => {
    const random = seededRandom(77);
    return Array.from({ length: 7 }, (_, index) => {
      const radius = 0.6 + random() * 0.8;
      return {
        key: index,
        radius,
        angle: (index / 7) * Math.PI * 2 + random(),
        distance: 11.5 + random() * 5,
        y: -1.5 + random() * 4.5,
        speed: 0.015 + random() * 0.02,
        bob: random() * 6,
        tree: random() > 0.4,
      };
    });
  }, []);
  const refs = useRef<Array<Group | null>>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    items.forEach((item, index) => {
      const group = refs.current[index];
      if (!group) return;
      const angle = item.angle + t * item.speed;
      group.position.set(Math.cos(angle) * item.distance, item.y + Math.sin(t * 0.6 + item.bob) * 0.3, Math.sin(angle) * item.distance);
      group.rotation.y = t * 0.05;
    });
  });
  return (
    <>
      {items.map((item, index) => (
        <group
          key={item.key}
          ref={(group) => {
            refs.current[index] = group;
          }}
        >
          <RockIsland radius={item.radius} depth={item.radius * 2.2} seed={50 + index} bits={2} />
          {item.tree && <Tree seed={70 + index} position={[0, 0, 0]} scale={0.8 + item.radius * 0.4} />}
        </group>
      ))}
    </>
  );
}

function FlyingBlock({ from, slot, color }: { from: Vector3; slot: [number, number, number]; color: string }) {
  const ref = useRef<Group>(null);
  const age = useRef(0);
  const target = useMemo(() => new Vector3(...slot), [slot]);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    age.current = Math.min(1, age.current + delta / 1.0);
    const p = age.current;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const mid = from.clone().add(target).multiplyScalar(0.5);
    mid.y += 1.4;
    const a = from.clone().lerp(mid, e);
    const b = mid.clone().lerp(target, e);
    group.position.copy(a.lerp(b, e));
    group.rotation.y += delta * (p < 1 ? 5 : 0.4);
  });
  return (
    <group ref={ref} position={from.toArray()}>
      <ChainBlock color={color} />
    </group>
  );
}

function SpeakerSpot({ speaker, verdict }: { speaker: AgentKey | null; verdict: boolean }) {
  const lightRef = useRef<SpotLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame((_, delta) => {
    const goal = speaker ? headOf(speaker) : new Vector3(0, CORE_Y + 3, 0);
    target.position.lerp(goal, 1 - Math.exp(-delta * 4));
    target.updateMatrixWorld();
    if (lightRef.current) lightRef.current.intensity += ((verdict ? 70 : 45) - lightRef.current.intensity) * 0.05;
  });
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={lightRef}
        target={target}
        color="#fff0d8"
        intensity={45}
        distance={16}
        angle={0.3}
        penumbra={0.65}
        decay={1.4}
        position={[0, OCULUS_Y - 0.5, 0]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </>
  );
}

function liftAboveHud(_width: number, height: number): [number, number] {
  return [0, height * 0.16];
}

function CameraDirector({ focused, compact }: { focused: AgentKey | null; compact: boolean }) {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);
  const baseRadius = aspect < 0.9 ? 46 : aspect < 1.35 ? 38 : 32;
  const reduced = usePrefersReducedMotion();
  let goal: OrbitGoal = { target: [0, 3.4, 0], radius: compact ? baseRadius + 4 : baseRadius, polar: 0.98 };
  if (focused) {
    const seat = SEATS.find((item) => item.key === focused);
    if (seat) {
      goal = {
        target: [seat.head.x, seat.head.y, seat.head.z],
        radius: 4.8,
        polar: 1.12,
        azimuth: Math.atan2(-Math.cos(seat.angle), -Math.sin(seat.angle)) + 0.55,
      };
    }
  }
  return <OrbitRig goal={goal} autoOrbit={!focused && !reduced} orbitSpeed={0.05} polarRange={[0.55, 1.42]} viewOffset={liftAboveHud} />;
}

function RotundaWorld({
  speaker,
  target,
  recorded,
  chainAgents,
  verdict,
  verdictTrigger,
  hovered,
  focused,
  onHover,
  onPick,
}: {
  speaker: AgentKey | null;
  target: AgentKey | "core";
  recorded: number;
  chainAgents: AgentKey[];
  verdict: boolean;
  verdictTrigger: number;
  hovered: AgentKey | null;
  focused: AgentKey | null;
  onHover: (key: AgentKey | null) => void;
  onPick: (key: AgentKey | null) => void;
}) {
  const rim = useGlowMaterial(SCENE_ACCENT, 1.6);
  const settled = Math.max(0, recorded - 1);

  return (
    <>
      <SkyDome top={SCENE_COLORS.skyTop} mid={SCENE_COLORS.skyMid} bottom={SCENE_COLORS.skyBottom} />
      <PointField count={900} seed={4} sphere radius={150} size={0.55} opacity={0.75} color={SCENE_COLORS.stars} fog={false} />
      <CloudLayer count={56} seed={9} color={SCENE_COLORS.cloud} y={-8} radius={40} innerRadius={5} scale={10} opacity={0.6} spread={4} />
      <hemisphereLight args={[SCENE_COLORS.hemiSky, SCENE_COLORS.skyBottom, 0.5]} />
      <directionalLight
        color={SCENE_COLORS.keyLight}
        intensity={2.2}
        position={[10, 18, 8]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={60}
      />
      <directionalLight color={SCENE_COLORS.rimLight} intensity={0.8} position={[-12, 7, -12]} />

      <RockIsland radius={8.2} depth={7.5} seed={3} rimMaterial={rim} bits={9} />
      <Rotunda />
      <CouncilTable verdict={verdict} />

      {SEATS.map((seat, index) => {
        const agentColor = SCENE_AGENT_COLORS[seat.key];
        const isHot = hovered === seat.key || focused === seat.key;
        const isActive = speaker === seat.key;
        return (
          <group
            key={seat.key}
            position={[seat.x, FLOOR_Y, seat.z]}
            rotation-y={seat.rotation}
            onPointerOver={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              onHover(seat.key);
            }}
            onPointerOut={() => onHover(null)}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              if (event.delta > 6) return;
              event.stopPropagation();
              onPick(focused === seat.key ? null : seat.key);
            }}
          >
            <Chair color={agentColor} glow={1.2 + (isActive ? 2.2 : 0) + (isHot ? 1 : 0)} />
            <group position={[0, 0.56, 0.04]}>
              <CouncilFigure color={agentColor} active={isActive} hovered={isHot} phase={index * 1.3} />
            </group>
            <SceneLabel text={getAgentRosterEntry(seat.key).initial} color={agentColor} position={[0, 2.55, 0]} emphasis={isHot ? 1 : isActive ? 0.5 : 0} />
          </group>
        );
      })}

      {SEATS.map((seat, index) => (
        <Banner key={seat.key} color={SCENE_AGENT_COLORS[seat.key]} angle={seat.angle} phase={index * 1.3} />
      ))}

      <SpeakerSpot speaker={speaker} verdict={verdict} />
      <Satellites />
      <PointField count={320} seed={8} radius={9} height={9} baseY={0.6} size={0.08} color={SCENE_ACCENT} opacity={0.55} spin={0.03} />

      <group>
        {Array.from({ length: settled }, (_, index) => (
          <group key={index} position={chainSlot(index)} rotation-y={index * 0.95}>
            <ChainBlock color={SCENE_AGENT_COLORS[chainAgents[index] ?? "orc"]} glow={verdict ? 0.9 : 0.55} />
          </group>
        ))}
      </group>

      {speaker && recorded > 0 && (
        <FlyingBlock key={`fly-${recorded}`} from={headOf(speaker)} slot={chainSlot(recorded - 1)} color={SCENE_AGENT_COLORS[speaker]} />
      )}
      {speaker && (
        <ArgumentBeam key={`beam-${recorded}`} from={headOf(speaker)} to={headOf(target)} color={SCENE_AGENT_COLORS[speaker]} lift={target === "core" ? 0.8 : 1.6} />
      )}
      <Shockwave color={SCENE_ACCENT} trigger={verdictTrigger} y={FLOOR_Y + 0.02} maxScale={10} />
    </>
  );
}

export default function RotundaScene({
  posts,
  score,
  threadRef,
  threadHref,
}: {
  posts: RotundaPost[];
  score: number | null;
  threadRef: string;
  threadHref: string | null;
}) {
  const texts = useMemo(() => posts.map((post) => stripMarkdown(post.body)), [posts]);
  const lengths = useMemo(() => texts.map((text) => text.length), [texts]);
  const replay = useDebateReplay(lengths);
  const [hovered, setHovered] = useState<AgentKey | null>(null);
  const [focused, setFocused] = useState<AgentKey | null>(null);

  const hasPosts = posts.length > 0;
  const current = hasPosts ? posts[replay.index] : null;
  const speaker = current?.agentKey ?? null;
  const target = current ? beamTarget(current) : "core";
  const verdict = replay.finished && score !== null;
  const typedText = current ? texts[replay.index].slice(0, replay.typed) : "";
  const typing = current ? replay.typed < texts[replay.index].length : false;
  const speakerEntry = speaker ? getAgentRosterEntry(speaker) : null;
  const targetName = target === "core" ? "the idea" : getAgentRosterEntry(target).name;
  const focusEntry = focused ? getAgentRosterEntry(focused) : null;
  const recorded = hasPosts ? replay.index + 1 : 0;
  const chainAgents = useMemo(() => posts.map((post) => post.agentKey), [posts]);
  const verdictTrigger = verdict ? replay.index + 1 : 0;
  const circumference = 2 * Math.PI * 20;

  const hud = (
    <>
      {focusEntry && (
        <aside
          className="absolute top-4 right-4 z-10 flex w-[min(300px,calc(100%-32px))] flex-col gap-3 rounded-2xl p-4"
          style={{ background: "rgba(14,14,18,0.86)", border: "1px solid #2a2a30", backdropFilter: "blur(14px)" }}
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold" style={{ color: "#f5f5f5" }}>
                {focusEntry.name}
              </span>
              <span className="text-[13px]" style={{ color: "#9d9da5" }}>
                {focusEntry.role}
              </span>
            </div>
            <button
              type="button"
              aria-label="Close agent panel"
              onClick={() => setFocused(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#1e1e22", color: "#c9c9ce" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <p className="m-0 text-sm leading-[1.5]" style={{ color: "#e4e4e7" }}>
            {focusEntry.mandate}
          </p>
        </aside>
      )}

      <div
        className="absolute right-3 bottom-3 left-3 z-10 flex flex-col gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: "rgba(12,12,16,0.82)", border: "1px solid #26262c", backdropFilter: "blur(14px)" }}
      >
        {hasPosts ? (
          <>
            <div className="flex gap-[3px]" role="group" aria-label="Jump to post">
              {posts.map((post, index) => {
                const color = SCENE_AGENT_COLORS[post.agentKey];
                const done = index < replay.index;
                const isCurrent = index === replay.index;
                return (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Jump to post ${index + 1} by ${getAgentRosterEntry(post.agentKey).name}`}
                    onClick={() => replay.jump(index)}
                    className="flex h-4 flex-1 items-center"
                  >
                    <span
                      className="block h-[3px] w-full rounded-sm"
                      style={{ background: done || isCurrent ? color : "#2a2a30", opacity: done ? 0.55 : 1 }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              {speakerEntry && speaker && (
                <span className="inline-flex items-center gap-2" style={{ color: SCENE_AGENT_COLORS[speaker] }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: SCENE_AGENT_COLORS[speaker] }} />
                  {speakerEntry.name}
                </span>
              )}
              {current && (
                <span className="rounded-md px-2 py-0.5" style={{ border: "1px solid #2a2a30", color: "#c9c9ce" }}>
                  {current.tag}
                </span>
              )}
              <span style={{ color: "#80808a" }}>→ {targetName}</span>
              {threadHref && (
                <a href={threadHref} className="ml-auto underline-offset-4 hover:underline" style={{ color: "#c9c9ce" }}>
                  {threadRef}
                </a>
              )}
            </div>
            <p aria-live="polite" className="m-0 min-h-[44px] text-[15px] leading-[1.5]" style={{ color: "#f5f5f5" }}>
              {typedText.length > 220 ? `…${typedText.slice(-220)}` : typedText}
              {typing && <span className="ml-0.5 inline-block h-4 w-2 align-[-2px]" style={{ background: "#f5f5f5", animation: "pulse-dot 1s steps(2) infinite" }} />}
            </p>
            <div className="flex items-center justify-between gap-3">
              {verdict && score !== null ? (
                <div className="flex items-center gap-2.5">
                  <svg width="40" height="40" viewBox="0 0 48 48" role="img" aria-label={`Consensus score ${score} of 100`}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#26262c" strokeWidth="4" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={SCENE_ACCENT}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${((circumference * score) / 100).toFixed(1)} ${circumference.toFixed(1)}`}
                      transform="rotate(-90 24 24)"
                    />
                    <text x="24" y="29" textAnchor="middle" fill="#f5f5f5" style={{ font: "600 14px var(--font-mono)" }}>
                      {score}
                    </text>
                  </svg>
                  <span className="font-mono text-[11px]" style={{ color: "#9d9da5" }}>
                    CONSENSUS · RECORDED ON-CHAIN
                  </span>
                </div>
              ) : (
                <span className="font-mono text-[11px]" style={{ color: "#80808a" }}>
                  DRAG TO ORBIT · CLICK AN AGENT
                </span>
              )}
              <button
                type="button"
                aria-label={replay.playing ? "Pause the replay" : "Play the replay"}
                onClick={() => replay.setPlaying(!replay.playing)}
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "#1e1e22", color: "#f5f5f5" }}
              >
                {replay.playing ? (
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
            </div>
          </>
        ) : (
          <p className="m-0 text-sm" style={{ color: "#9d9da5" }}>
            The council is waiting for its first idea.
          </p>
        )}
      </div>
    </>
  );

  return (
    <SceneStage
      label="Interactive 3D diorama: a marble rotunda on a floating island where the five council agents debate the latest thread at a round table. Each recorded post rises as a block inside the dome. Drag to orbit, click an agent to inspect it."
      className="h-[600px] overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--line)", background: SCENE_COLORS.background }}
      background={SCENE_COLORS.background}
      fog={{ color: SCENE_COLORS.fog, density: 0.014 }}
      bloom={0.9}
      cameraPosition={[14, 14, 26]}
      overlay={hud}
    >
      <CameraDirector focused={focused} compact={false} />
      <RotundaWorld
        speaker={speaker}
        target={target}
        recorded={recorded}
        chainAgents={chainAgents}
        verdict={verdict}
        verdictTrigger={verdictTrigger}
        hovered={hovered}
        focused={focused}
        onHover={setHovered}
        onPick={setFocused}
      />
    </SceneStage>
  );
}

