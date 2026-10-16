"use client";

import type { ReactNode } from "react";

import { useThemePreference } from "@/hooks/use-theme-preference";
import type { ThemePreference } from "@/lib/theme";

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  {
    value: "system",
    label: "System theme",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg {...iconProps}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const [preference, setPreference] = useThemePreference();

  return (
    <div role="group" aria-label="Theme" className="flex flex-none items-center gap-0.5 rounded-lg border border-hairline bg-canvas p-[3px]">
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            aria-label={option.label}
            aria-pressed={active}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{
              backgroundColor: active ? "var(--pill-on)" : "transparent",
              color: active ? "var(--ink)" : "var(--muted)",
            }}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
