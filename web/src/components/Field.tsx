import { useMemo } from "react";
import { guilloche, LOGO_FP } from "../lib/guilloche";

type Props = {
  /** Where the rosette sits relative to its container. */
  place?: "hero" | "right" | "left" | "studio";
  className?: string;
};

/**
 * Security-print backdrop. The line work is the same guilloche that
 * draws every seal, enlarged and faded into the page like the field behind
 * a banknote portrait, so the background says what the product does:
 * this page is a printed, verifiable document.
 */
export function Field({ place = "right", className = "" }: Props) {
  const g = useMemo(() => guilloche(LOGO_FP, 180), []);
  const paths = [...g.outer.paths, ...g.inner.paths, ...g.core.paths];
  return (
    <div className={`field field-${place} ${className}`} aria-hidden="true">
      <svg viewBox="-110 -110 220 220" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle r="104" strokeWidth="0.5" />
        <circle r="98" strokeWidth="0.25" strokeDasharray="1 2" />
        {paths.map((d, i) => <path key={i} d={d} strokeWidth="0.28" />)}
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2;
          const long = i % 6 === 0;
          const r1 = 104, r2 = long ? 109 : 106.5;
          return <line key={`t${i}`} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} strokeWidth={long ? 0.45 : 0.25} />;
        })}
      </svg>
    </div>
  );
}
