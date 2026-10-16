import { describe, expect, test } from "bun:test";

import { beamTarget, islandVariant, scoreToHeight, seededRandom, stripMarkdown, typedLength } from "@/lib/scene-logic";

describe("islandVariant", () => {
  test("maps every thread status to its diorama", () => {
    expect(islandVariant("live")).toBe("session");
    expect(islandVariant("resolved")).toBe("monument");
    expect(islandVariant("revise")).toBe("scaffold");
    expect(islandVariant("failed")).toBe("ruin");
  });
});

describe("beamTarget", () => {
  test("aims at the quoted agent when a post quotes someone else", () => {
    expect(beamTarget({ agentKey: "m2", quoteOfAgentKey: "m1" })).toBe("m1");
  });

  test("aims at the idea core when nothing is quoted", () => {
    expect(beamTarget({ agentKey: "tech", quoteOfAgentKey: null })).toBe("core");
  });

  test("aims at the idea core when an agent quotes itself", () => {
    expect(beamTarget({ agentKey: "m3", quoteOfAgentKey: "m3" })).toBe("core");
  });
});

describe("scoreToHeight", () => {
  test("uses the minimum height when there is no score yet", () => {
    expect(scoreToHeight(null, 0.6, 2.6)).toBe(0.6);
  });

  test("scales linearly and clamps to 0–100", () => {
    expect(scoreToHeight(50, 0, 2)).toBeCloseTo(1);
    expect(scoreToHeight(140, 0, 2)).toBe(2);
    expect(scoreToHeight(-10, 0, 2)).toBe(0);
  });
});

describe("typedLength", () => {
  test("waits for the delay, then reveals one character per step, capped at the length", () => {
    expect(typedLength(500, 700, 20, 50)).toBe(0);
    expect(typedLength(900, 700, 20, 50)).toBe(10);
    expect(typedLength(9000, 700, 20, 50)).toBe(50);
  });
});

describe("stripMarkdown", () => {
  test("removes emphasis, code, links and quotes", () => {
    expect(stripMarkdown("> **Demand** is `unproven` per [source](https://example.com)")).toBe("Demand is unproven per source");
  });
});

describe("seededRandom", () => {
  test("is deterministic for a seed", () => {
    const first = seededRandom(42);
    const second = seededRandom(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });
});
