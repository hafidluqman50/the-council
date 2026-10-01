export function alpha(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    const n = parseInt(color.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return `color-mix(in oklab, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

export function shade(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, #000)`;
}
