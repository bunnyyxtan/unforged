/** Pool size against the anonymity floor. */
export function PoolRing({ size, min, px = 104 }: { size: number; min: number; px?: number }) {
  const cap = Math.max(size, min * 2, 1);
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = Math.min(size / cap, 1) * c;
  const floor = (min / cap) * 360 - 90;
  const safe = size >= min;
  return (
    <svg width={px} height={px} viewBox="0 0 100 100" role="img" aria-label={`${size} phones in pool, minimum ${min}`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={safe ? "var(--ok)" : "var(--warn)"} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`} transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray .5s ease" }}
      />
      <line
        x1={50 + Math.cos((floor * Math.PI) / 180) * 34} y1={50 + Math.sin((floor * Math.PI) / 180) * 34}
        x2={50 + Math.cos((floor * Math.PI) / 180) * 50} y2={50 + Math.sin((floor * Math.PI) / 180) * 50}
        stroke="var(--text)" strokeWidth="2"
      />
      <text x="50" y="52" textAnchor="middle" fontFamily="Satoshi, system-ui, sans-serif" fontWeight="700" fontSize="28" fill="var(--text)">{size}</text>
      <text x="50" y="66" textAnchor="middle" fontSize="8" fill="var(--text-2)">phones</text>
    </svg>
  );
}
