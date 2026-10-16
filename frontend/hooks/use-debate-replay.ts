"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { typedLength } from "@/lib/scene-logic";

type ReplayOptions = {
  msPerChar?: number;
  delayMs?: number;
  holdMs?: number;
  endHoldMs?: number;
  loop?: boolean;
};

export type DebateReplay = {
  index: number;
  typed: number;
  playing: boolean;
  finished: boolean;
  setPlaying: (playing: boolean) => void;
  jump: (index: number) => void;
};

export function useDebateReplay(lengths: number[], options: ReplayOptions = {}): DebateReplay {
  const { msPerChar = 18, delayMs = 700, holdMs = 1900, endHoldMs = 9000, loop = true } = options;
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startedAt = useRef(0);
  const count = lengths.length;
  const lengthsKey = lengths.join(",");

  const jump = useCallback(
    (next: number) => {
      if (count === 0) return;
      startedAt.current = performance.now();
      setIndex(Math.max(0, Math.min(count - 1, next)));
      setTyped(0);
    },
    [count],
  );

  useEffect(() => {
    startedAt.current = performance.now();
  }, [lengthsKey]);

  useEffect(() => {
    if (count === 0) return;
    let frame = 0;
    let lastPush = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const length = lengths[index] ?? 0;
      const elapsed = now - startedAt.current;
      const shown = typedLength(elapsed, delayMs, msPerChar, length);
      const doneFor = elapsed - delayMs - length * msPerChar;
      if (playing && shown >= length) {
        if (index < count - 1 && doneFor > holdMs) {
          startedAt.current = now;
          setIndex(index + 1);
          setTyped(0);
          return;
        }
        if (index === count - 1 && loop && doneFor > endHoldMs) {
          startedAt.current = now;
          setIndex(0);
          setTyped(0);
          return;
        }
      }
      if (now - lastPush > 55 || shown === length) {
        lastPush = now;
        setTyped((previous) => (previous === shown ? previous : shown));
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // lengthsKey stands in for the lengths array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, count, lengthsKey, msPerChar, delayMs, holdMs, endHoldMs, loop]);

  const last = count - 1;
  const finished = count > 0 && index === last && typed >= (lengths[last] ?? 0);
  return { index: count === 0 ? 0 : Math.min(index, last), typed, playing, finished, setPlaying, jump };
}
