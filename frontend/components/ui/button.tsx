import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-canvas hover:bg-ink-pressed",
  secondary: "border border-hairline bg-canvas text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface-soft",
};

export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex h-11 items-center justify-center gap-2 rounded-lg px-[22px] text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
