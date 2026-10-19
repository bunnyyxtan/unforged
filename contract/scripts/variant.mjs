// WebAuthn's origin length is a compile-time parameter of the Passport module.
// Generate one contract per deployment origin length, e.g.
//   21: http://localhost:5173        31: https://unforged-web.vercel.app
// Usage: node scripts/variant.mjs 28   → src/unforged28.compact (git-ignored)
import { readFileSync, writeFileSync } from "node:fs";

const n = Number(process.argv[2]);
if (!Number.isInteger(n) || n < 8) throw new Error("usage: node scripts/variant.mjs <originLength>");

const src = readFileSync(new URL("../src/unforged.compact", import.meta.url), "utf8");
if (!src.includes("import WebAuthn<21>;")) throw new Error("expected `import WebAuthn<21>;` in unforged.compact");

const out = `// GENERATED from unforged.compact by scripts/variant.mjs (origin length ${n}). Do not edit.\n` +
  src.replace("import WebAuthn<21>;", `import WebAuthn<${n}>;`);
writeFileSync(new URL(`../src/unforged${n}.compact`, import.meta.url), out);
console.log(`wrote src/unforged${n}.compact`);
