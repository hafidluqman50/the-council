"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, Group, Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";

import { buildLathe, createGlow, createStandard, setGlow, sharedMaterials } from "./materials";

const SEATED_PROFILE: Array<[number, number]> = [
  [0, -0.05], [0.34, -0.05], [0.37, 0.1], [0.31, 0.42], [0.27, 0.66], [0.3, 0.78], [0.19, 0.9], [0, 0.93],
];
const STANDING_PROFILE: Array<[number, number]> = [
  [0, 0], [0.36, 0], [0.34, 0.25], [0.29, 0.75], [0.27, 1.15], [0.3, 1.38], [0.2, 1.52], [0, 1.56],
];

export const SEATED_HEAD_HEIGHT = 0.56 + 0.93 + 0.22;
export const STANDING_HEAD_HEIGHT = 1.56 + 0.22;

export function faceCenterRotation(x: number, z: number): number {
  return Math.atan2(-x, -z);
}

export function CouncilFigure({
  color,
  standing = false,
  active,
  hovered = false,
  phase = 0,
}: {
  color: string;
  standing?: boolean;
  active: boolean;
  hovered?: boolean;
  phase?: number;
}) {
  const materials = sharedMaterials();
  const top = standing ? 1.56 : 0.93;
  const robe = useMemo(() => buildLathe(standing ? STANDING_PROFILE : SEATED_PROFILE, 40), [standing]);
  const visor = useMemo(() => createGlow(color, 2.4, { side: DoubleSide }), [color]);
  const halo = useMemo(() => createGlow(color, 2.2, { opacity: 0.95 }), [color]);
  const trim = useMemo(
    () => createStandard(color, { roughness: 0.45, metalness: 0.3, emissive: color, emissiveIntensity: 0.18, env: 0.5 }),
    [color],
  );
  useEffect(() => () => {
    robe.dispose();
    visor.dispose();
    halo.dispose();
    trim.dispose();
  }, [robe, visor, halo, trim]);

  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);
  const visorRef = useRef<Mesh>(null);
  const trimRef = useRef<Mesh>(null);
  const level = useRef({ active: 0, hover: 0 });
  const restArm = standing ? -0.25 : -1.05;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const amount = level.current;
    amount.active += ((active ? 1 : 0) - amount.active) * (1 - Math.exp(-delta * 5));
    amount.hover += ((hovered ? 1 : 0) - amount.hover) * (1 - Math.exp(-delta * 6));
    const a = amount.active;
    if (bodyRef.current) bodyRef.current.rotation.x = (standing ? 0.02 : 0.08) * a + Math.sin(t * 0.8 + phase) * 0.012;
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 3.1 + phase) * 0.06 * a - 0.04;
      headRef.current.rotation.y = Math.sin(t * 0.5 + phase) * 0.12 * (1 - a);
    }
    if (rightArmRef.current) rightArmRef.current.rotation.x = restArm - a * (0.55 + Math.sin(t * 2.4) * 0.25);
    if (leftArmRef.current) leftArmRef.current.rotation.x = restArm - a * 0.15;
    if (visorRef.current) setGlow(visorRef.current.material as MeshBasicMaterial, 1.6 + a * 2.6 + amount.hover * 1.2);
    const haloMesh = haloRef.current;
    if (haloMesh) {
      haloMesh.rotation.z += delta * (0.4 + a * 2.5);
      haloMesh.position.y = top + 0.52 + Math.sin(t * 1.6 + phase) * 0.03 + a * 0.08;
      const s = 1 + a * 0.35 + amount.hover * 0.2;
      haloMesh.scale.set(s, s, s);
      (haloMesh.material as MeshBasicMaterial).opacity = 0.55 + a * 0.45;
    }
    if (trimRef.current) (trimRef.current.material as MeshStandardMaterial).emissiveIntensity = 0.12 + a * 0.5 + amount.hover * 0.3;
  });

  return (
    <group>
      <group ref={bodyRef}>
        <mesh geometry={robe} material={materials.cloth} castShadow receiveShadow />
        <mesh ref={trimRef} material={trim} position={[0, top - 0.08, 0]} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[0.2, 0.055, 12, 40]} />
        </mesh>
        <mesh material={trim} position={[0, top * 0.5, standing ? 0.285 : 0.3]} rotation-x={standing ? -0.05 : -0.12}>
          <boxGeometry args={[0.09, top * 0.75, 0.02]} />
        </mesh>
        <mesh material={materials.ceramic} position={[0, top + 0.03, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
        </mesh>
        <group ref={headRef} position={[0, top + 0.22, 0]}>
          <mesh material={materials.ceramic} scale={[0.95, 1.08, 1]} castShadow>
            <sphereGeometry args={[0.175, 32, 24]} />
          </mesh>
          <mesh ref={visorRef} material={visor} position={[0, 0.01, 0]} scale={[0.97, 1, 1.02]}>
            <cylinderGeometry args={[0.172, 0.172, 0.05, 32, 1, true, -Math.PI * 0.33, Math.PI * 0.66]} />
          </mesh>
        </group>
        {[-1, 1].map((side) => (
          <group
            key={side}
            ref={side === 1 ? rightArmRef : leftArmRef}
            position={[0.27 * side, top - 0.12, 0.02]}
            rotation={[restArm, 0, side * (standing ? 0.12 : 0.08)]}
          >
            <mesh material={materials.cloth} position={[0, -0.26, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.42, 6, 12]} />
            </mesh>
            <mesh material={materials.ceramic} position={[0, -0.52, 0]}>
              <sphereGeometry args={[0.075, 16, 12]} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh ref={haloRef} material={halo} position={[0, top + 0.52, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.21, 0.014, 8, 48]} />
      </mesh>
    </group>
  );
}

export function Chair({ color, glow }: { color: string; glow: number }) {
  const materials = sharedMaterials();
  const strip = useMemo(() => createGlow(color, 1.8), [color]);
  useEffect(() => () => strip.dispose(), [strip]);
  useEffect(() => {
    setGlow(strip, glow);
  }, [strip, glow]);

  return (
    <group>
      <RoundedBox args={[0.64, 0.12, 0.6]} radius={0.05} smoothness={3} position={[0, 0.5, 0]} material={materials.leather} castShadow receiveShadow />
      <RoundedBox args={[0.66, 1.15, 0.12]} radius={0.05} smoothness={3} position={[0, 1.08, -0.27]} rotation-x={-0.1} material={materials.leather} castShadow />
      <mesh material={strip} position={[0, 1.12, -0.205]} rotation-x={-0.1}>
        <boxGeometry args={[0.05, 0.9, 0.02]} />
      </mesh>
      <mesh material={materials.brass} position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.45, 12]} />
      </mesh>
      <mesh material={materials.brass} position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.04, 32]} />
      </mesh>
    </group>
  );
}
