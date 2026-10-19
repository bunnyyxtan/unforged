export type Step = { title: string; detail: string };

export const SEAL_STEPS: Step[] = [
  { title: "Fingerprinting the photo", detail: "SHA-256 of the exact file. Change one pixel and it no longer matches." },
  { title: "Signing with your secure chip", detail: "Your face or fingerprint approves. The key never leaves the chip." },
  { title: "Proving you're one of the pool", detail: "Zero-knowledge: valid signature, enrolled phone, not which one." },
  { title: "Recording on Midnight", detail: "Only the fingerprint and time become public." },
  { title: "Sealed", detail: "Anyone can now verify this photo." },
];

/** A developing-print style progress list. `at` = index of the active step; steps.length = all done. */
export function Timeline({ at, steps = SEAL_STEPS }: { at: number; steps?: Step[] }) {
  return (
    <ol className="timeline" aria-live="polite">
      {steps.map((s, i) => (
        <li key={s.title} className={i < at ? "done" : i === at ? "active" : ""}>
          <span className="tick" aria-hidden="true" />
          <span>
            {s.title}
            <small>{s.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
