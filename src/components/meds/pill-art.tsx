/** Illustrated capsule or tablet (MedIllustration in Section 5). Decorative. */
export function PillArt({
  form,
  color,
  size = 64,
  white = false,
}: {
  form: "capsule" | "tablet";
  color: string;
  size?: number;
  white?: boolean;
}) {
  const c = white ? "#ffffff" : color;
  if (form === "capsule") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <g transform="rotate(-35 32 32)">
          <rect x="19" y="9" width="26" height="46" rx="13" fill={c} />
          <path d="M19 32 h26 v10 a13 13 0 0 1-13 13 a13 13 0 0 1-13-13 z" fill={`color-mix(in srgb, ${c} 55%, #000)`} />
          <rect x="19" y="9" width="26" height="46" rx="13" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
          <ellipse cx="27" cy="20" rx="3.5" ry="7" fill="rgba(255,255,255,.45)" />
        </g>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="21" fill={c} />
      <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
      <rect x="21" y="30" width="22" height="4" rx="2" fill="rgba(255,255,255,.6)" />
      <ellipse cx="26" cy="24" rx="4.5" ry="6" fill="rgba(255,255,255,.45)" />
    </svg>
  );
}
