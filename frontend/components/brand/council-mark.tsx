export function CouncilMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
    >
      <circle cx="24" cy="24" r="9.5" />
      <circle cx="24" cy="7" r="4.2" fill="currentColor" />
      <circle cx="39.5" cy="18.3" r="3.4" />
      <circle cx="33.6" cy="36.5" r="3.4" />
      <circle cx="14.4" cy="36.5" r="3.4" />
      <circle cx="8.5" cy="18.3" r="3.4" />
    </svg>
  );
}
