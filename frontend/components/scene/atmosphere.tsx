"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Group, Points, ShaderMaterial, SpriteMaterial } from "three";

import { seededRandom } from "@/lib/scene-logic";
import { buildCloudTexture, buildDotTexture } from "./materials";

export function SkyDome({ top, mid, bottom, radius = 160 }: { top: string; mid: string; bottom: string; radius?: number }) {
  const material = useMemo(() => {
    const shader = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new Color(top) }, mid: { value: new Color(mid) }, bottom: { value: new Color(bottom) } },
      vertexShader:
        "varying vec3 vPosition; void main(){ vPosition = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader:
        "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vPosition; void main(){ float h = vPosition.y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h, 0.0, 1.0), 0.6)) : mix(mid, bottom, pow(clamp(-h, 0.0, 1.0), 0.5)); gl_FragColor = vec4(c, 1.0); }",
    });
    shader.toneMapped = false;
    return shader;
  }, [top, mid, bottom]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh renderOrder={-10} material={material}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
}

type PointFieldProps = {
  count: number;
  seed: number;
  color: string;
  size: number;
  opacity: number;
  sphere?: boolean;
  radius: number;
  innerRadius?: number;
  height?: number;
  baseY?: number;
  fog?: boolean;
  spin?: number;
};

export function PointField({ count, seed, color, size, opacity, sphere = false, radius, innerRadius = 0, height = 6, baseY = 0, fog = true, spin = 0 }: PointFieldProps) {
  const pointsRef = useRef<Points>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      if (sphere) {
        const u = random() * 2 - 1;
        const angle = random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        positions[index * 3] = Math.cos(angle) * s * radius;
        positions[index * 3 + 1] = Math.abs(u) * radius * 0.9 + baseY;
        positions[index * 3 + 2] = Math.sin(angle) * s * radius;
      } else {
        const r = innerRadius + random() * (radius - innerRadius);
        const angle = random() * Math.PI * 2;
        positions[index * 3] = Math.cos(angle) * r;
        positions[index * 3 + 1] = baseY + random() * height;
        positions[index * 3 + 2] = Math.sin(angle) * r;
      }
    }
    const built = new BufferGeometry();
    built.setAttribute("position", new BufferAttribute(positions, 3));
    return built;
  }, [count, seed, sphere, radius, innerRadius, height, baseY]);
  const texture = useMemo(() => buildDotTexture(), []);
  useEffect(() => () => {
    geometry.dispose();
    texture.dispose();
  }, [geometry, texture]);

  useFrame((_, delta) => {
    if (spin && pointsRef.current) pointsRef.current.rotation.y += delta * spin;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
        sizeAttenuation
        fog={fog}
        toneMapped={false}
      />
    </points>
  );
}

export function CloudLayer({ count, seed, color, y, radius, innerRadius, scale, opacity, spread, spin = 0.006 }: {
  count: number;
  seed: number;
  color: string;
  y: number;
  radius: number;
  innerRadius: number;
  scale: number;
  opacity: number;
  spread: number;
  spin?: number;
}) {
  const groupRef = useRef<Group>(null);
  const clouds = useMemo(() => {
    const random = seededRandom(seed);
    const textures = [buildCloudTexture(seed + 1), buildCloudTexture(seed + 2), buildCloudTexture(seed + 3)];
    const items = Array.from({ length: count }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const r = innerRadius + random() * (radius - innerRadius);
      const size = scale * (0.6 + random() * 0.8);
      const material = new SpriteMaterial({
        map: textures[index % 3],
        color,
        transparent: true,
        opacity: opacity * (0.6 + random() * 0.4),
        depthWrite: false,
      });
      return {
        key: index,
        material,
        position: [Math.cos(angle) * r, y + (random() - 0.5) * spread, Math.sin(angle) * r] as [number, number, number],
        scale: [size * 1.8, size, 1] as [number, number, number],
      };
    });
    return { items, textures };
  }, [count, seed, color, y, radius, innerRadius, scale, opacity, spread]);
  useEffect(() => () => {
    clouds.items.forEach((item) => item.material.dispose());
    clouds.textures.forEach((texture) => texture.dispose());
  }, [clouds]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * spin;
  });

  return (
    <group ref={groupRef}>
      {clouds.items.map((item) => (
        <sprite key={item.key} material={item.material} position={item.position} scale={item.scale} />
      ))}
    </group>
  );
}
