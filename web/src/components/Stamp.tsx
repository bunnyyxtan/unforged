type Props = { id: string; label?: string; size?: number; refused?: boolean; animate?: boolean };

/** The seal: a vermilion stamp with the Seal ID around the rim. */
export function Stamp({ id, label = "SEALED", size = 132, refused = false, animate = true }: Props) {
  const color = refused ? "var(--danger)" : "var(--seal)";
  const rim = `${id} · UNFORGED · ${id} · UNFORGED ·`;
  const pathId = `rim-${id}-${refused ? "r" : "s"}`;
  return (
    <span className={`stamp${animate ? " stamping" : ""}`} role="img" aria-label={`${label}, seal ${id}`}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <defs>
          <path id={pathId} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth="3" />
        <circle cx="60" cy="60" r="35" fill="none" stroke={color} strokeWidth="1.5" />
        <text fill={color} fontFamily="JetBrains Mono, monospace" fontSize="8.2" letterSpacing="1.2">
          <textPath href={`#${pathId}`}>{rim}</textPath>
        </text>
        <text x="60" y={refused ? 64 : 60} textAnchor="middle" fill={color} fontFamily="Instrument Serif, serif" fontSize={refused ? 15 : 17}>
          {label}
        </text>
        {!refused && (
          <text x="60" y="74" textAnchor="middle" fill={color} fontFamily="Inter, sans-serif" fontSize="6.5" letterSpacing="1">
            ON MIDNIGHT
          </text>
        )}
      </svg>
    </span>
  );
}
