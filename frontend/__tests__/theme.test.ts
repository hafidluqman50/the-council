import { describe, expect, test } from "bun:test";

import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, themeInitScript } from "@/lib/theme";

type Listener = () => void;

function runScript({ stored, osDark, storageThrows = false }: { stored?: string; osDark: boolean; storageThrows?: boolean }) {
  const classes = new Set<string>();
  const style = { colorScheme: "" };
  const windowListeners: Record<string, Listener> = {};
  const mediaListeners: Listener[] = [];
  const media = { matches: osDark, addEventListener: (_: string, fn: Listener) => mediaListeners.push(fn) };
  let value = stored ?? null;

  const documentElement = {
    classList: {
      toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name)),
    },
    style,
  };
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error("denied");
      return key === THEME_STORAGE_KEY ? value : null;
    },
  };
  const window = {
    matchMedia: () => media,
    addEventListener: (name: string, fn: Listener) => {
      windowListeners[name] = fn;
    },
  };

  new Function("document", "window", "localStorage", themeInitScript())({ documentElement }, window, localStorage);

  return {
    isDark: () => classes.has("dark"),
    colorScheme: () => style.colorScheme,
    setOsDark(next: boolean) {
      media.matches = next;
      mediaListeners.forEach((fn) => fn());
    },
    save(next: string | null) {
      value = next;
      windowListeners[THEME_CHANGE_EVENT]?.();
    },
  };
}

describe("themeInitScript", () => {
  test("is valid JavaScript", () => {
    expect(() => new Function(themeInitScript())).not.toThrow();
  });

  test("follows the device when nothing is saved", () => {
    expect(runScript({ osDark: true }).isDark()).toBe(true);
    expect(runScript({ osDark: false }).isDark()).toBe(false);
  });

  test("a saved choice beats the device", () => {
    expect(runScript({ stored: "light", osDark: true }).isDark()).toBe(false);
    expect(runScript({ stored: "dark", osDark: false }).isDark()).toBe(true);
  });

  test("sets color-scheme to match", () => {
    expect(runScript({ stored: "dark", osDark: false }).colorScheme()).toBe("dark");
    expect(runScript({ osDark: false }).colorScheme()).toBe("light");
  });

  test("falls back to the device on an unknown saved value", () => {
    expect(runScript({ stored: "sepia", osDark: true }).isDark()).toBe(true);
  });

  test("falls back to the device when storage throws", () => {
    expect(runScript({ osDark: true, storageThrows: true }).isDark()).toBe(true);
  });

  test("a device change re-applies only while on System", () => {
    const system = runScript({ osDark: false });
    system.setOsDark(true);
    expect(system.isDark()).toBe(true);

    const explicit = runScript({ stored: "light", osDark: false });
    explicit.setOsDark(true);
    expect(explicit.isDark()).toBe(false);
  });

  test("re-applies when the preference changes in the same tab", () => {
    const page = runScript({ stored: "light", osDark: true });
    page.save("dark");
    expect(page.isDark()).toBe(true);
    page.save(null);
    expect(page.isDark()).toBe(true);
  });
});
