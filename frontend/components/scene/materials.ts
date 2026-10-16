import {
  AdditiveBlending,
  NormalBlending,
  CanvasTexture,
  Color,
  ConeGeometry,
  DoubleSide,
  ExtrudeGeometry,
  FrontSide,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Shape,
  Vector2,
  Vector3,
  type Side,
} from "three";

import { seededRandom } from "@/lib/scene-logic";
import { SCENE_COLORS } from "@/lib/scene-palette";

type StandardOptions = {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  flat?: boolean;
  env?: number;
  side?: Side;
  transparent?: boolean;
  opacity?: number;
};

export function createStandard(color: string, options: StandardOptions = {}): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: new Color(color),
    roughness: options.roughness ?? 0.6,
    metalness: options.metalness ?? 0,
    flatShading: options.flat ?? false,
    side: options.side ?? FrontSide,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
  if (options.emissive) {
    material.emissive = new Color(options.emissive);
    material.emissiveIntensity = options.emissiveIntensity ?? 1;
  }
  material.envMapIntensity = options.env ?? 0.5;
  return material;
}

type GlowOptions = { opacity?: number; additive?: boolean; side?: Side; depthWrite?: boolean };

export function createGlow(color: string, strength = 2.2, options: GlowOptions = {}): MeshBasicMaterial {
  const material = new MeshBasicMaterial({
    color: new Color(color).multiplyScalar(strength),
    transparent: options.opacity !== undefined || Boolean(options.additive),
    opacity: options.opacity ?? 1,
    side: options.side ?? FrontSide,
    depthWrite: options.additive ? false : (options.depthWrite ?? true),
    blending: options.additive ? AdditiveBlending : NormalBlending,
  });
  material.toneMapped = false;
  material.userData.base = new Color(color);
  material.userData.strength = strength;
  return material;
}

export function setGlow(material: MeshBasicMaterial, strength: number, color?: string): void {
  if (color) material.userData.base = new Color(color);
  material.userData.strength = strength;
  material.color.copy(material.userData.base as Color).multiplyScalar(strength);
}

type SharedMaterials = {
  marble: MeshStandardMaterial;
  brass: MeshStandardMaterial;
  darkStone: MeshStandardMaterial;
  tableStone: MeshStandardMaterial;
  hallMarble: MeshStandardMaterial;
  slab: MeshStandardMaterial;
  rock: MeshStandardMaterial;
  leaf: MeshStandardMaterial;
  trunk: MeshStandardMaterial;
  cloth: MeshStandardMaterial;
  leather: MeshStandardMaterial;
  ceramic: MeshPhysicalMaterial;
  glass: MeshPhysicalMaterial;
};

let shared: SharedMaterials | null = null;

export function sharedMaterials(): SharedMaterials {
  if (shared) return shared;
  const ceramic = new MeshPhysicalMaterial({ color: SCENE_COLORS.ceramic, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  ceramic.envMapIntensity = 0.8;
  const glass = new MeshPhysicalMaterial({
    color: "#a8bcd4",
    roughness: 0.06,
    transparent: true,
    opacity: 0.09,
    side: DoubleSide,
    depthWrite: false,
    clearcoat: 1,
  });
  glass.envMapIntensity = 1.4;
  shared = {
    marble: createStandard(SCENE_COLORS.marble, { roughness: 0.38, env: 0.7 }),
    brass: createStandard(SCENE_COLORS.brass, { roughness: 0.28, metalness: 0.95, env: 1 }),
    darkStone: createStandard(SCENE_COLORS.darkStone, { roughness: 0.18, metalness: 0.15, env: 0.6 }),
    tableStone: createStandard(SCENE_COLORS.tableStone, { roughness: 0.12, metalness: 0.15, env: 0.6 }),
    hallMarble: createStandard(SCENE_COLORS.hallMarble, { roughness: 0.32, metalness: 0.1, env: 0.5 }),
    slab: createStandard(SCENE_COLORS.slab, { roughness: 0.75, env: 0.3 }),
    rock: createStandard(SCENE_COLORS.rock, { roughness: 0.92, flat: true, env: 0.2 }),
    leaf: createStandard(SCENE_COLORS.leaf, { roughness: 0.85, flat: true }),
    trunk: createStandard(SCENE_COLORS.trunk, { roughness: 0.9 }),
    cloth: createStandard(SCENE_COLORS.cloth, { roughness: 0.82, env: 0.25 }),
    leather: createStandard(SCENE_COLORS.leather, { roughness: 0.48, metalness: 0.1, env: 0.5 }),
    ceramic,
    glass,
  };
  return shared;
}

function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

export function buildRockGeometry(radius: number, depth: number, seed: number): ConeGeometry {
  const geometry = new ConeGeometry(radius * 0.99, depth, 40, 10);
  const position = geometry.attributes.position;
  const vertex = new Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const t = (depth / 2 - vertex.y) / depth;
    if (t > 0.04) {
      const fine = hash3(Math.round(vertex.x * 40) + seed, Math.round(vertex.y * 40), Math.round(vertex.z * 40));
      const coarse = hash3(Math.round(vertex.x * 9), Math.round(vertex.y * 9) + seed * 3, Math.round(vertex.z * 9));
      const scale = 1 + (fine - 0.5) * 0.35 * t + (coarse - 0.5) * 0.45 * t;
      vertex.x *= scale;
      vertex.z *= scale;
      vertex.y += (fine - 0.5) * 0.35 * t;
    }
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function buildLathe(points: Array<[number, number]>, segments = 64, phiStart = 0, phiLength = Math.PI * 2): LatheGeometry {
  return new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments, phiStart, phiLength);
}

export function buildAnnulusSector(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number, depth: number, bevel: number): ExtrudeGeometry {
  const shape = new Shape();
  const steps = 64;
  for (let index = 0; index <= steps; index += 1) {
    const angle = startAngle + ((endAngle - startAngle) * index) / steps;
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let index = steps; index >= 0; index -= 1) {
    const angle = startAngle + ((endAngle - startAngle) * index) / steps;
    shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
  }
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 });
}

export function buildCloudTexture(seed: number): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const random = seededRandom(seed);
  if (context) {
    for (let index = 0; index < 26; index += 1) {
      const x = 128 + (random() - 0.5) * 140;
      const y = 128 + (random() - 0.5) * 70;
      const radius = 30 + random() * 60;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(255,255,255,0.22)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function buildDotTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(canvas);
}
