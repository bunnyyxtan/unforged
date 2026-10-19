// Guilloche rosettes (the interlaced line patterns of banknote security
// printing), derived deterministically from a 32-byte fingerprint. Each band
// is a family of closed polar curves r(θ) = R + a·sin(k₁θ + iδ) + b·sin(k₂θ − iδ)
// whose phases shift per line, producing the familiar woven lattice.

export type Band = { paths: string[] };

function polarPath(r: (t: number) => number, steps = 540): string {
  let d = "";
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2;
    const rad = r(t);
    const x = (Math.cos(t) * rad).toFixed(2);
    const y = (Math.sin(t) * rad).toFixed(2);
    d += (s === 0 ? "M" : "L") + x + " " + y;
  }
  return d + "Z";
}

function band(bytes: Uint8Array, offset: number, radius: number, depth: number, lines: number, steps = 540): Band {
  const b = (i: number) => bytes[(offset + i) % bytes.length];
  const k1 = 14 + (b(0) % 18);        // 14..31 outer lobes
  const k2 = 3 + (b(1) % 9);          // 3..11 slow wave
  const a = depth * (0.55 + (b(2) / 255) * 0.25);
  const c = depth * (0.25 + (b(3) / 255) * 0.2);
  const delta = (Math.PI * 2) / lines / (1.6 + (b(4) / 255));
  const phase = (b(5) / 255) * Math.PI * 2;
  const paths = Array.from({ length: lines }, (_, i) =>
    polarPath((t) => radius + a * Math.sin(k1 * t + phase + i * delta) + c * Math.sin(k2 * t - i * delta), steps),
  );
  return { paths };
}

/** Two woven bands plus a fine centre rosette, all from the fingerprint. */
export function guilloche(fp: Uint8Array, steps = 540) {
  return {
    outer: band(fp, 0, 66, 9, 12, steps),
    inner: band(fp, 8, 38, 7, 10, steps),
    core: band(fp, 16, 16, 5, 7, steps),
  };
}

/** The brand mark is the seal of this fixed fingerprint (the landing specimen photo). */
export const LOGO_FP = Uint8Array.from("fb3b7962cb058b56f6eb68aab4003a7f8effbdc987c67c0606950d063dddb289".match(/../g)!, (h) => parseInt(h, 16));

/** A stable placeholder pattern before a real fingerprint exists. */
export const SPECIMEN = new Uint8Array(Array.from({ length: 32 }, (_, i) => (i * 73 + 41) % 256));
