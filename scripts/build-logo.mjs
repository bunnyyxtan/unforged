// Generates the static logo assets from the same guilloche code the app uses.
//   node --experimental-strip-types scripts/build-logo.mjs
// Writes web/public/favicon.svg and docs/deck/logo-stamp.svg.
import { writeFileSync } from "node:fs";
import { guilloche, LOGO_FP } from "../web/src/lib/guilloche.ts";

const g = guilloche(LOGO_FP);

// Keep every n-th vertex so the asset stays small; the curves are smooth enough to survive it.
function thin(d, n) {
  const pts = d.slice(1, -1).split("L");
  const keep = pts.filter((_, i) => i % n === 0);
  return "M" + keep.join("L") + "Z";
}

const paths = (n, w) =>
  [...g.outer.paths, ...g.inner.paths, ...g.core.paths].map((d) => `<path d="${thin(d, n)}" stroke-width="${w}"/>`).join("");

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-104 -104 208 208"><circle r="103" fill="#f7f3ea"/><g fill="none" stroke="#98202b" stroke-linecap="round" stroke-linejoin="round"><circle r="96" stroke-width="8"/>${paths(9, 3.4)}</g></svg>\n`;
writeFileSync(new URL("../web/public/favicon.svg", import.meta.url), favicon);

const stamp = `<g fill="none" stroke="#98202b" stroke-linecap="round" stroke-linejoin="round" transform="scale(.56)"><circle r="96" stroke-width="2"/>${paths(5, 0.9)}</g>`;
writeFileSync(new URL("../docs/deck/logo-stamp.svg", import.meta.url), stamp + "\n");
console.log("favicon", favicon.length, "bytes; stamp", stamp.length, "bytes");
