/** A photo's fingerprint drawn as a 32-segment radial glyph: one segment per byte. */
export function Glyph({ fp, size = 40 }: { fp: Uint8Array; size?: number }) {
  const segs = Array.from(fp.slice(0, 32), (b, i) => {
    const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
    const r1 = 7;
    const r2 = 8 + (b / 255) * 11;
    return (
      <line
        key={i}
        x1={20 + Math.cos(a) * r1}
        y1={20 + Math.sin(a) * r1}
        x2={20 + Math.cos(a) * r2}
        y2={20 + Math.sin(a) * r2}
        stroke={i % 8 === 0 ? "var(--seal)" : "currentColor"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {segs}
      <circle cx="20" cy="20" r="3" fill="var(--seal)" />
    </svg>
  );
}
