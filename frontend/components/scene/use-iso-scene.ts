"use client";

import { useEffect, useRef } from "react";

type TiltState = {
  px: number;
  py: number;
  cx: number;
  cy: number;
  drag: number;
  dragY: number;
  gx: number;
  gy: number;
  gyroAt: number;
  dragging: boolean;
  lx: number;
  ly: number;
  lastMove: number;
  asked: boolean;
  sw: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Drives the shared rotation of an isometric 3D scene: mouse tilt, pointer
 * drag, device gyroscope, and an idle sway — written to --tx/--ty on the
 * element, plus a responsive scale in --s.
 */
export function useIsoScene(baseWidth: number) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tilt: TiltState = {
      px: 0,
      py: 0,
      cx: 0,
      cy: 0,
      drag: 0,
      dragY: 0,
      gx: 0,
      gy: 0,
      gyroAt: 0,
      dragging: false,
      lx: 0,
      ly: 0,
      lastMove: 0,
      asked: false,
      sw: 0,
    };

    const onPointerMove = (event: PointerEvent) => {
      if (tilt.dragging) {
        tilt.drag += (event.clientX - tilt.lx) * 0.35;
        tilt.dragY = clamp(tilt.dragY + (event.clientY - tilt.ly) * 0.12, -16, 16);
        tilt.lx = event.clientX;
        tilt.ly = event.clientY;
      }
      if (event.pointerType === "mouse") {
        tilt.px = (event.clientX / window.innerWidth - 0.5) * 2;
        tilt.py = (event.clientY / window.innerHeight - 0.5) * 2;
      }
      tilt.lastMove = performance.now();
    };

    const onPointerUp = () => {
      tilt.dragging = false;
    };

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null) return;
      tilt.gx = clamp(event.gamma, -35, 35) / 35;
      tilt.gy = clamp((event.beta ?? 0) - 40, -35, 35) / 35;
      tilt.gyroAt = performance.now();
    };

    const onPointerDown = (event: PointerEvent) => {
      tilt.dragging = true;
      tilt.lx = event.clientX;
      tilt.ly = event.clientY;
      tilt.lastMove = performance.now();

      const orientationEvent = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (!tilt.asked && typeof orientationEvent.requestPermission === "function") {
        tilt.asked = true;
        orientationEvent.requestPermission().catch(() => {});
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("deviceorientation", onDeviceOrientation);
    el.addEventListener("pointerdown", onPointerDown);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let lastWidth = -1;
    let raf = 0;

    const loop = () => {
      const now = performance.now();
      const gyroActive = Boolean(tilt.gyroAt) && now - tilt.gyroAt < 1000;
      const x = gyroActive ? tilt.gx : tilt.px;
      const y = gyroActive ? tilt.gy : tilt.py;
      const idle = !gyroActive && !tilt.dragging && !reduced && now - tilt.lastMove > 2500;
      tilt.sw += ((idle ? 1 : 0) - tilt.sw) * 0.02;

      const targetX = x * 14 + Math.sin(now / 2600) * 9 * tilt.sw + tilt.drag;
      const targetY = clamp(y * 8 + tilt.dragY, -20, 16);
      tilt.cx += (targetX - tilt.cx) * 0.08;
      tilt.cy += (targetY - tilt.cy) * 0.08;

      const width = el.clientWidth;
      if (width !== lastWidth) {
        lastWidth = width;
        el.style.setProperty("--s", Math.min(1, width / baseWidth).toFixed(3));
      }
      el.style.setProperty("--tx", `${tilt.cx.toFixed(2)}deg`);
      el.style.setProperty("--ty", `${tilt.cy.toFixed(2)}deg`);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [baseWidth]);

  return ref;
}
