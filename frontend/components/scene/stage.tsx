"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function subscribeReducedMotion(callback: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export type SceneStageProps = {
  label: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  overlay?: ReactNode;
  background?: string;
  fog?: { color: string; density: number };
  bloom?: number;
  cameraPosition?: [number, number, number];
  fov?: number;
  children: ReactNode;
};

export function SceneStage({
  label,
  className,
  style,
  fallback = null,
  overlay,
  background = "#07080c",
  fog,
  bloom = 0.85,
  cameraPosition = [0, 8, 24],
  fov = 32,
  children,
}: SceneStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(hasWebGL);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setVisible(entries[0]?.isIntersecting ?? true), {
      rootMargin: "120px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", ...style }}>
      {supported ? (
        <Canvas
          role="img"
          aria-label={label}
          frameloop={visible ? "always" : "never"}
          dpr={[1, 1.5]}
          shadows="percentage"
          flat
          gl={{ antialias: false, powerPreference: "high-performance" }}
          camera={{ position: cameraPosition, fov, near: 0.1, far: 400 }}
          style={{ position: "absolute", inset: 0, touchAction: "pan-y", cursor: "grab" }}
          onCreated={({ gl }) => {
            gl.domElement.tabIndex = 0;
          }}
        >
          <color attach="background" args={[background]} />
          {fog && <fogExp2 attach="fog" args={[fog.color, fog.density]} />}
          <Environment resolution={128} frames={1} environmentIntensity={0.55}>
            <Lightformer intensity={2.2} position={[0, 6, -10]} scale={[14, 5, 1]} color="#fff1dc" />
            <Lightformer intensity={1.2} position={[-10, 3, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} color="#8fa2ff" />
            <Lightformer intensity={0.9} position={[10, 3, 4]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} color="#ffd8a8" />
          </Environment>
          {children}
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={bloom} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>
      ) : (
        fallback
      )}
      {supported && overlay}
    </div>
  );
}
