#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
//
// Offline verifier for a draft org.unforged.authorization assertion.
//   node tools/unforged-verify.mjs <file> <assertion.json>
// Checks the exact-file binding and prints what the assertion claims and
// what it does not establish. It cannot query a ledger: Wave 2 seals live in
// a local runtime, so pool membership is reported as asserted, not re-proved.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const [file, assertionPath] = process.argv.slice(2);
if (!file || !assertionPath) {
  console.error("usage: node tools/unforged-verify.mjs <file> <assertion.json>");
  process.exit(2);
}

const a = JSON.parse(readFileSync(assertionPath, "utf8"));
if (a.label !== "org.unforged.authorization.v0") {
  console.error(`unsupported assertion label: ${a.label}`);
  process.exit(2);
}
const d = a.data;
const hex = createHash("sha256").update(readFileSync(file)).digest("hex");
const match = hex === d.binding.hex;

const rows = [
  ["File integrity", match ? "EXACT MATCH" : "NO MATCH", match ? "established" : "failed"],
  ["Fingerprint", hex, "computed"],
  ["Organization authority", `${d.authorization.pool} · ${d.authorization.result}`, "asserted (ledger not reachable offline)"],
  ["Policy epoch", d.authorization.policyEpoch, "asserted"],
  ["Capture assurance", d.assurance.level ?? "not stated", d.assurance.claim],
  ["Capture time", `${d.time.stated} (${d.time.precision ?? "1 s"})`, "asserted"],
  ["Source identity", d.signer.disclosure, "by construction"],
  ["Editorial case", d.editorial ? `${d.editorial.case} · ${d.editorial.status}` : "none", "asserted"],
];
const w = Math.max(...rows.map((r) => r[0].length));
console.log(`\nUnforged verify · ${a.profile}\n`);
for (const [k, v, how] of rows) console.log(`  ${k.padEnd(w)}  ${v}  [${how}]`);
console.log(`\n  Not established: ${d.notEstablished.join("; ")}\n`);
process.exit(match ? 0 : 1);
