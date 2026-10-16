"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, DoubleSide, Mesh, MeshStandardMaterial, QuadraticBezierCurve3, TubeGeometry, Vector3, type MeshBasicMaterial } from "three";

import { createGlow, setGlow } from "./materials";

export function ArgumentBeam({ from, to, color, lift = 1.6 }: { from: Vector3; to: Vector3; color: string; lift?: number }) {
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += lift;
    return new QuadraticBezierCurve3(from.clone(), mid, to.clone());
  }, [from, to, lift]);
  const tube = useMemo(() => new TubeGeometry(curve, 80, 0.018, 6, false), [curve]);
  const tubeMaterial = useMemo(() => createGlow(color, 2.6, { opacity: 0 }), [color]);
  const pulseMaterials = useMemo(() => [0, 1, 2].map(() => createGlow(color, 4, { opacity: 0 })), [color]);
  useEffect(() => () => {
    tube.dispose();
    tubeMaterial.dispose();
    pulseMaterials.forEach((material) => material.dispose());
  }, [tube, tubeMaterial, pulseMaterials]);

  const pulseRefs = useRef<Array<Mesh | null>>([]);
  const tubeRef = useRef<Mesh>(null);
  const age = useRef(0);
  useEffect(() => {
    age.current = 0;
  }, [curve]);

  useFrame((_, delta) => {
    age.current += delta;
    const fade = Math.max(0, Math.min(1, (age.current - 0.25) / 0.5));
    if (tubeRef.current) (tubeRef.current.material as MeshBasicMaterial).opacity = 0.85 * fade;
    pulseRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const t = (age.current * 0.6 + index / 3) % 1;
      mesh.position.copy(curve.getPoint(t));
      (mesh.material as MeshBasicMaterial).opacity = fade * Math.sin(t * Math.PI);
    });
  });

  return (
    <group>
      <mesh ref={tubeRef} geometry={tube} material={tubeMaterial} />
      {pulseMaterials.map((material, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            pulseRefs.current[index] = mesh;
          }}
          material={material}
        >
          <sphereGeometry args={[0.06, 14, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export function ChainBlock({ color, glow = 0.6, scale = 1 }: { color: string; glow?: number; scale?: number }) {
  const shell = useMemo(() => {
    const material = new MeshStandardMaterial({ color: "#15151a", roughness: 0.15, metalness: 0.6, emissive: new Color(color), emissiveIntensity: glow });
    material.envMapIntensity = 0.9;
    return material;
  }, [color, glow]);
  const core = useMemo(() => createGlow(color, 2.2), [color]);
  useEffect(() => () => {
    shell.dispose();
    core.dispose();
  }, [shell, core]);

  return (
    <group scale={scale}>
      <RoundedBox args={[0.4, 0.24, 0.4]} radius={0.05} smoothness={2} material={shell} castShadow />
      <mesh material={core}>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
      </mesh>
    </group>
  );
}

const MARK_NODES: Array<{ x: number; z: number; radius: number; filled: boolean }> = [
  { x: 0, z: -1.7, radius: 0.42, filled: true },
  { x: 1.55, z: -0.57, radius: 0.34, filled: false },
  { x: 0.96, z: 1.25, radius: 0.34, filled: false },
  { x: -0.96, z: 1.25, radius: 0.34, filled: false },
  { x: -1.55, z: -0.57, radius: 0.34, filled: false },
];

export function CouncilMark({ color, scale = 1, strength = 1.6 }: { color: string; scale?: number; strength?: number }) {
  const material = useMemo(() => createGlow(color, strength, { side: DoubleSide }), [color, strength]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group scale={scale}>
      <mesh material={material} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.95, 0.07, 10, 80]} />
      </mesh>
      {MARK_NODES.map((node, index) =>
        node.filled ? (
          <mesh key={index} material={material} position={[node.x, 0, node.z]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[node.radius, 40]} />
          </mesh>
        ) : (
          <mesh key={index} material={material} position={[node.x, 0, node.z]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[node.radius, 0.06, 8, 40]} />
          </mesh>
        ),
      )}
    </group>
  );
}

export function SceneLabel({
  text,
  color,
  position,
  emphasis = 0,
  sub,
  opacity = 1,
}: {
  text: string;
  color: string;
  position: [number, number, number];
  emphasis?: number;
  sub?: string;
  opacity?: number;
}) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: sub ? "4px 10px" : "3px 9px",
          borderRadius: 999,
          background: "rgba(10, 10, 12, 0.86)",
          border: `1.5px solid ${color}`,
          color,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          transform: `scale(${1 + emphasis * 0.2})`,
          opacity,
          transition: "transform 200ms ease, opacity 300ms ease",
        }}
      >
        <span>{text}</span>
        {sub && <span style={{ color: "#a1a1aa", fontSize: 10, fontWeight: 500 }}>{sub}</span>}
      </div>
    </Html>
  );
}

export function Shockwave({ color, trigger, y = 0.03, maxScale = 10, duration = 2.6 }: { color: string; trigger: number; y?: number; maxScale?: number; duration?: number }) {
  const material = useMemo(() => createGlow(color, 2, { opacity: 0, side: DoubleSide, depthWrite: false }), [color]);
  useEffect(() => () => material.dispose(), [material]);
  const meshRef = useRef<Mesh>(null);
  const age = useRef(Number.POSITIVE_INFINITY);
  useEffect(() => {
    if (trigger > 0) age.current = 0;
  }, [trigger]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    age.current += delta;
    const p = age.current / duration;
    if (p >= 1) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const s = 1 + p * maxScale;
    mesh.scale.set(s, s, s);
    (mesh.material as MeshBasicMaterial).opacity = 0.8 * (1 - p);
  });

  return (
    <mesh ref={meshRef} material={material} rotation-x={-Math.PI / 2} position={[0, y, 0]} visible={false}>
      <ringGeometry args={[0.95, 1, 128]} />
    </mesh>
  );
}

export function useGlowMaterial(color: string, strength: number, options?: Parameters<typeof createGlow>[2]): MeshBasicMaterial {
  const opacity = options?.opacity;
  const additive = options?.additive;
  const side = options?.side;
  const material = useMemo(() => createGlow(color, strength, { opacity, additive, side }), [color, strength, opacity, additive, side]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

export function useAnimatedGlow(material: MeshBasicMaterial, strength: number): void {
  useEffect(() => {
    setGlow(material, strength);
  }, [material, strength]);
}
