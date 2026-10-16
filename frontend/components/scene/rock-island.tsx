"use client";

import { useEffect, useMemo } from "react";
import { type MeshBasicMaterial } from "three";

import { seededRandom } from "@/lib/scene-logic";
import { buildRockGeometry, sharedMaterials } from "./materials";

export function RockIsland({
  radius,
  depth,
  seed,
  rimMaterial,
  bits = 6,
}: {
  radius: number;
  depth: number;
  seed: number;
  rimMaterial?: MeshBasicMaterial;
  bits?: number;
}) {
  const materials = sharedMaterials();
  const rock = useMemo(() => buildRockGeometry(radius, depth, seed), [radius, depth, seed]);
  const fragments = useMemo(() => {
    const random = seededRandom(seed * 17);
    return Array.from({ length: bits }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const r = radius * (0.3 + random() * 0.5);
      return {
        key: index,
        size: 0.15 + random() * radius * 0.07,
        position: [Math.cos(angle) * r, -0.5 - depth * (0.25 + random() * 0.5), Math.sin(angle) * r] as [number, number, number],
        rotation: [random() * 3, random() * 3, random() * 3] as [number, number, number],
      };
    });
  }, [radius, depth, seed, bits]);
  useEffect(() => () => rock.dispose(), [rock]);

  return (
    <group>
      <mesh material={materials.slab} position={[0, -0.21, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.985, 0.42, 96]} />
      </mesh>
      <mesh geometry={rock} material={materials.rock} rotation-x={Math.PI} position={[0, -0.42 - depth / 2 + 0.02, 0]} castShadow />
      {fragments.map((fragment) => (
        <mesh key={fragment.key} material={materials.rock} position={fragment.position} rotation={fragment.rotation}>
          <dodecahedronGeometry args={[fragment.size, 0]} />
        </mesh>
      ))}
      {rimMaterial && (
        <mesh material={rimMaterial} rotation-x={Math.PI / 2}>
          <torusGeometry args={[radius - 0.02, 0.025, 8, 160]} />
        </mesh>
      )}
    </group>
  );
}

export function Tree({ seed, position, scale = 1 }: { seed: number; position: [number, number, number]; scale?: number }) {
  const materials = sharedMaterials();
  const crowns = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: 3 }, (_, index) => ({
      key: index,
      radius: 0.22 + random() * 0.1,
      position: [(random() - 0.5) * 0.18, 0.55 + index * 0.13, (random() - 0.5) * 0.18] as [number, number, number],
    }));
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      <mesh material={materials.trunk} position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 0.5, 8]} />
      </mesh>
      {crowns.map((crown) => (
        <mesh key={crown.key} material={materials.leaf} position={crown.position} castShadow>
          <icosahedronGeometry args={[crown.radius, 0]} />
        </mesh>
      ))}
    </group>
  );
}
