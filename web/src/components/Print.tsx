import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/** A photograph presented as a print on film stock, with crop marks. */
export function Film({ src, alt, frame, children, width, height }: { src: string; alt: string; frame: string; children?: ReactNode; width: number; height: number }) {
  return (
    <figure className="film" style={{ margin: 0 }}>
      <span className="cropmarks" aria-hidden="true"><i /><i /><i /><i /></span>
      <div style={{ position: "relative" }}>
        <img src={src} alt={alt} width={width} height={height} loading="eager" decoding="async" />
        {children}
      </div>
      <span className="edge" aria-hidden="true">
        <span>UNFORGED 400</span>
        <span>{frame}</span>
      </span>
    </figure>
  );
}

/** Text that gets a redaction bar slid over it when it scrolls into view. */
export function Redacted({ children, delay = 0, label }: { children: ReactNode; delay?: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className="redacted">
      <span aria-hidden="true">{children}</span>
      <span className="sr-only">{label}</span>
      <motion.span
        className="bar"
        aria-hidden="true"
        initial={{ scaleX: reduce ? 1 : 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </span>
  );
}

/** Content that settles into place once, the first time it is seen. */
export function Reveal({ children, delay = 0, y = 14, as = "div", className }: { children: ReactNode; delay?: number; y?: number; as?: "div" | "section" | "li"; className?: string }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </M>
  );
}
