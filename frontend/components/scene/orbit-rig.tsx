"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

import { wrapAngle } from "@/lib/scene-logic";

export type OrbitGoal = {
  target: [number, number, number];
  radius: number;
  polar: number;
  azimuth?: number;
};

type OrbitState = { azimuth: number; polar: number; radius: number; target: Vector3 };

export function OrbitRig({
  goal,
  autoOrbit = false,
  orbitSpeed = 0.05,
  polarRange = [0.5, 1.42],
  damping = 2.8,
  viewOffset,
  onUserDrag,
}: {
  goal: OrbitGoal;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  polarRange?: [number, number];
  damping?: number;
  viewOffset?: (width: number, height: number) => [number, number] | null;
  onUserDrag?: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  const current = useRef<OrbitState | null>(null);
  const desired = useRef<OrbitState | null>(null);
  const lastInteraction = useRef(0);
  const onUserDragRef = useRef(onUserDrag);
  const polarRef = useRef(polarRange);

  useEffect(() => {
    onUserDragRef.current = onUserDrag;
    polarRef.current = polarRange;
  });

  const [tx, ty, tz] = goal.target;
  useEffect(() => {
    const next: OrbitState = {
      azimuth: goal.azimuth ?? desired.current?.azimuth ?? 0.5,
      polar: goal.polar,
      radius: goal.radius,
      target: new Vector3(tx, ty, tz),
    };
    desired.current = next;
    if (!current.current) current.current = { ...next, target: next.target.clone() };
    invalidate();
  }, [tx, ty, tz, goal.radius, goal.polar, goal.azimuth, invalidate]);

  useEffect(() => {
    if (!("setViewOffset" in camera)) return;
    const perspective = camera as typeof camera & { setViewOffset: (...args: number[]) => void; clearViewOffset: () => void; updateProjectionMatrix: () => void };
    const offset = viewOffset?.(size.width, size.height) ?? null;
    if (offset) perspective.setViewOffset(size.width, size.height, offset[0], offset[1], size.width, size.height);
    else perspective.clearViewOffset();
    perspective.updateProjectionMatrix();
  }, [camera, size.width, size.height, viewOffset]);

  useEffect(() => {
    const element = gl.domElement;
    let drag: { x: number; y: number; azimuth: number; polar: number; moved: number; notified: boolean } | null = null;
    const clamp = (value: number) => Math.max(polarRef.current[0], Math.min(polarRef.current[1], value));

    const onDown = (event: PointerEvent) => {
      if (!desired.current) return;
      drag = { x: event.clientX, y: event.clientY, azimuth: desired.current.azimuth, polar: desired.current.polar, moved: 0, notified: false };
      lastInteraction.current = performance.now();
      element.style.cursor = "grabbing";
    };
    const onMove = (event: PointerEvent) => {
      if (!drag || !desired.current) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      desired.current.azimuth = drag.azimuth - dx * 0.006;
      desired.current.polar = clamp(drag.polar - dy * 0.004);
      lastInteraction.current = performance.now();
      if (drag.moved > 6 && !drag.notified) {
        drag.notified = true;
        onUserDragRef.current?.();
      }
    };
    const onUp = () => {
      drag = null;
      element.style.cursor = "grab";
    };
    const onKey = (event: KeyboardEvent) => {
      if (!desired.current) return;
      if (event.key === "ArrowLeft") desired.current.azimuth += 0.22;
      else if (event.key === "ArrowRight") desired.current.azimuth -= 0.22;
      else if (event.key === "ArrowUp") desired.current.polar = clamp(desired.current.polar - 0.1);
      else if (event.key === "ArrowDown") desired.current.polar = clamp(desired.current.polar + 0.1);
      else return;
      event.preventDefault();
      lastInteraction.current = performance.now();
    };

    element.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    element.addEventListener("keydown", onKey);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      element.removeEventListener("keydown", onKey);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const now = current.current;
    const want = desired.current;
    if (!now || !want) return;
    if (autoOrbit && performance.now() - lastInteraction.current > 3500) want.azimuth += delta * orbitSpeed;
    const k = 1 - Math.exp(-delta * damping);
    now.azimuth += wrapAngle(want.azimuth - now.azimuth) * k;
    now.polar += (want.polar - now.polar) * k;
    now.radius += (want.radius - now.radius) * k;
    now.target.lerp(want.target, k);
    camera.position.set(
      now.target.x + now.radius * Math.sin(now.polar) * Math.sin(now.azimuth),
      now.target.y + now.radius * Math.cos(now.polar),
      now.target.z + now.radius * Math.sin(now.polar) * Math.cos(now.azimuth),
    );
    camera.lookAt(now.target);
  });

  return null;
}
