import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import { guilloche } from "../lib/guilloche";

type Props = {
  fp: Uint8Array;
  id: string;
  size?: number;
  /** Draw the line work in, then emboss. Only for the moment a seal is made. */
  draw?: boolean;
  caption?: string;
  tone?: "seal" | "muted";
};

/**
 * The Unforged seal: a guilloche rosette unique to the photo's fingerprint,
 * embossed like a notary seal, with the Seal ID set around the rim.
 */
export function Seal({ fp, id, size = 200, draw = false, caption = "SEALED ON MIDNIGHT", tone = "seal" }: Props) {
  const reduce = useReducedMotion();
  const g = useMemo(() => guilloche(fp), [fp]);
  const uid = useId().replace(/:/g, "");
  const animate = draw && !reduce;
  const color = tone === "seal" ? "var(--seal)" : "var(--text-3)";
  const rim = `${caption} · ${id} · `;

  const line = (d: string, key: string, delay: number, width: number) =>
    animate ? (
      <motion.path
        key={key}
        d={d}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] }, opacity: { duration: 0.2, delay } }}
        strokeWidth={width}
      />
    ) : (
      <path key={key} d={d} strokeWidth={width} />
    );

  const art = (
    <>
      <circle r="96" strokeWidth="1.6" />
      <circle r="86.5" strokeWidth="0.6" />
      <circle r="24" strokeWidth="0.6" />
      {g.outer.paths.map((d, i) => line(d, `o${i}`, 0.05 + i * 0.025, 0.42))}
      {g.inner.paths.map((d, i) => line(d, `i${i}`, 0.35 + i * 0.025, 0.42))}
      {g.core.paths.map((d, i) => line(d, `c${i}`, 0.6 + i * 0.03, 0.38))}
    </>
  );

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      role="img"
      aria-label={`Seal ${id}`}
      initial={animate ? { scale: 1.04, rotate: -4 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ overflow: "visible" }}
    >
      <defs>
        <path id={`rim-${uid}`} d="M 0 -91.5 A 91.5 91.5 0 1 1 -0.01 -91.5" />
      </defs>
      {/* emboss: highlight up-left, shadow down-right, ink on top */}
      <g fill="none" stroke="var(--emboss-light)" transform="translate(-0.7 -0.7)" aria-hidden="true">{art}</g>
      <g fill="none" stroke="var(--emboss-dark)" transform="translate(0.8 0.8)" aria-hidden="true">{art}</g>
      <g fill="none" stroke={color} strokeLinecap="round" opacity={0.92}>{art}</g>
      <motion.text
        fill={color}
        style={{ font: "500 7.6px var(--font-data)", letterSpacing: "1.6px" }}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: animate ? 0.7 : 0 }}
      >
        <textPath href={`#rim-${uid}`} startOffset="0" textLength="568" lengthAdjust="spacing">
          {rim.repeat(2)}
        </textPath>
      </motion.text>
    </motion.svg>
  );
}
