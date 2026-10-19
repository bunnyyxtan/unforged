import { useSyncExternalStore } from "react";
import type { DeviceSecret } from "../../contract/src/witnesses";
import { random, sealId, sha256, toHex } from "./engine/bytes";
import {
  createPasskey,
  deviceFromStored,
  realAssertion,
  SoftPasskey,
  supportedOrigin,
  type StoredCredential,
} from "./engine/passkey";
import { Pool, refusalCode } from "./engine/pool";

export const MIN_POOL = 5;
/** Enrollment policy: k of these approvers must each approve a credential. */
export const APPROVERS = ["Standards editor", "Security lead", "Photo desk chief"];
export const THRESHOLD = 2;
// Simulated phones use this page's origin when a contract variant exists for it.
const SIM_ORIGIN = typeof location !== "undefined" && supportedOrigin(location.origin) ? location.origin : "http://localhost:5173";
const SIM_RP = new URL(SIM_ORIGIN).hostname;
const STORAGE_KEY = "unforged:passkey:v1";

export type Reporter = { name: string; key: SoftPasskey; index: number; revoked: boolean; commitment: string };

export type Me = {
  mode: "passkey" | "simulated";
  device: DeviceSecret;
  index: number;
  commitment: string;
  stored?: StoredCredential;
  soft?: SoftPasskey;
};

/** Assurance ladder (docs/ARCHITECTURE.md). Wave 2 clients reach L0 or L1. */
export type Level = "L0" | "L1";
export const LEVELS: { id: string; name: string; basis: string }[] = [
  { id: "L0", name: "Software credential", basis: "Test key generated in the browser" },
  { id: "L1", name: "WebAuthn approval", basis: "Platform passkey with user presence and verification" },
  { id: "L2", name: "Device-bound key", basis: "Non-exportable hardware key" },
  { id: "L3", name: "Attested application", basis: "Hardware and app integrity attestation" },
  { id: "L4", name: "C2PA capture credential", basis: "Signed manifest from supported capture hardware" },
  { id: "L5", name: "Sensor and trusted time", basis: "Sensor evidence, trusted time and controlled edits" },
];

export type SealRecord = {
  times?: StageTimes;
  level: Level;
  caseId: string;
  id: string;
  fp: Uint8Array;
  url: string;
  bytes: Uint8Array;
  takenAt: number;
  epoch: bigint;
  byYou: boolean; // known only on this device, never on chain
  title: string;
  batch?: number;
  privateInputs: { label: string; value: string }[];
};

export type VerifyResult =
  | { kind: "sealed"; fp: Uint8Array; id: string; takenAt: number; epoch: bigint; poolSize: number; removedSince: number; record?: SealRecord }
  | { kind: "none"; fp: Uint8Array };

// ------------------------------------------------------------- evidence desk

export type CaseStatus = "new" | "review" | "approved" | "held" | "published";
export const CHECKS = [
  "Visual inspection for manipulation beyond the exact-file scope",
  "Date and place corroborated by an independent source",
  "Context and caption confirmed",
  "Contributor safety reviewed before publication",
] as const;

export type EvidenceCase = {
  id: string;
  sealId: string;
  title: string;
  receivedAt: number;
  status: CaseStatus;
  checks: boolean[];
  note?: string;
  log: { at: number; actor: string; text: string }[];
};

type State = {
  ready: boolean;
  error?: string;
  pool?: Pool;
  reporters: Reporter[];
  me?: Me;
  seals: SealRecord[];
  cases: EvidenceCase[];
  batches: RelayBatch[];
  version: number;
};

// ------------------------------------------------------------- relay

/** Submissions per batch and the capture-time precision the relay publishes. */
export const RELAY_BATCH = 3;
export const RELAY_WINDOW = 3600;

export type RelayBatch = {
  no: number;
  releasedAt: number;
  waitedMs: number;
  /** Order the relay submitted to the contract (shuffled), by seal ID. */
  order: { id: string; source: "capture" | "pool" }[];
  window: number;
};

let state: State = { ready: false, reporters: [], seals: [], cases: [], batches: [], version: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch, version: state.version + 1 };
  listeners.forEach((l) => l());
};

export function useStore() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}

export const realPasskeysAvailable = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  !!window.PublicKeyCredential &&
  supportedOrigin(location.origin);

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

let booting: Promise<void> | undefined;
export const bootstrap = () => (booting ??= deployDemoPool());

/** Deploy the demo pool and enroll seven simulated reporters. */
async function deployDemoPool() {
  try {
    const pool = await Pool.deploy(MIN_POOL, new TextEncoder().encode(SIM_ORIGIN).length, THRESHOLD, APPROVERS.length);
    const reporters: Reporter[] = [];
    const names = Array.from({ length: 7 }, (_, i) => `Field contributor ${String(i + 1).padStart(2, "0")}`);
    for (const name of names) {
      const key = new SoftPasskey(SIM_RP, SIM_ORIGIN);
      const index = await pool.enroll(key.device());
      reporters.push({ name, key, index, revoked: false, commitment: toHex(pool.commitmentOf(key.device())) });
    }
    set({ pool, reporters });
    await seedSubmissions(pool, reporters);
    set({ ready: true });
  } catch (e) {
    set({ ready: true, error: (e as Error).message });
  }
}

type Pending = { device: DeviceSecret; assertion: Parameters<Pool["seal"]>[1]; fp: Uint8Array; source: "capture" | "pool"; queuedAt: number };

/**
 * Relay: holds submissions until a batch is full, shuffles them and submits
 * with capture time coarsened to the hour, so arrival order and exact time
 * no longer point at a contributor. In this evaluation runtime, simulated
 * pool members fill the batch with their own generated test frames.
 */
async function relaySubmit(item: Omit<Pending, "queuedAt" | "source">): Promise<{ batch: number; takenAt: number }> {
  const pool = state.pool!;
  const queue: Pending[] = [{ ...item, source: "capture", queuedAt: performance.now() }];
  const members = state.reporters.filter((r) => !r.revoked);
  while (queue.length < RELAY_BATCH && members.length) {
    const r = members[Math.floor(Math.random() * members.length)];
    const fp = await sha256(new TextEncoder().encode(`pool-traffic:${toHex(random(16))}`));
    queue.push({ device: r.key.device(), assertion: r.key.assert(pool.challengeFor(fp)), fp, source: "pool", queuedAt: performance.now() });
  }
  for (let i = queue.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  const takenAt = Math.floor(pool.now() / RELAY_WINDOW) * RELAY_WINDOW;
  for (const p of queue) await pool.seal(p.device, p.assertion, p.fp, takenAt);
  const no = state.batches.length + 1;
  const batch: RelayBatch = {
    no,
    releasedAt: Date.now(),
    waitedMs: performance.now() - Math.min(...queue.map((p) => p.queuedAt)),
    order: queue.map((p) => ({ id: sealId(p.fp), source: p.source })),
    window: RELAY_WINDOW,
  };
  set({ batches: [batch, ...state.batches] });
  return { batch: no, takenAt };
}

let caseNo = 1040;
function openCase(record: SealRecord, via: string) {
  const c: EvidenceCase = {
    id: record.caseId,
    sealId: record.id,
    title: record.title,
    receivedAt: Date.now(),
    status: "new",
    checks: CHECKS.map(() => false),
    log: [{ at: Date.now(), actor: "Intake", text: `Received ${record.id} via ${via}. Pool seal verified; contributor withheld.` }],
  };
  set({ seals: [record, ...state.seals], cases: [c, ...state.cases] });
}

/**
 * Sample submissions: two CC0 photographs sealed by simulated pool credentials
 * through the same compiled circuit, so the Desk opens with real cases.
 */
async function seedSubmissions(pool: Pool, reporters: Reporter[]) {
  const samples = [
    { file: "umbrella.jpg", title: "Street protest, umbrella line", by: reporters[0] },
    { file: "crossing.jpg", title: "Night crossing, central district", by: reporters[3] },
  ];
  for (const sample of samples) {
    try {
      const url = `${import.meta.env.BASE_URL}media/${sample.file}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const fp = await sha256(bytes);
      const takenAt = pool.now() - 1;
      await pool.seal(sample.by.key.device(), sample.by.key.assert(pool.challengeFor(fp)), fp, takenAt);
      openCase(
        { id: sealId(fp), caseId: `EC-${++caseNo}`, fp, url, bytes, takenAt, epoch: pool.ledger.epoch, byYou: false, level: "L0", title: sample.title, privateInputs: [] },
        "direct intake (sample, simulated credential)",
      );
    } catch {
      /* samples are optional; the workspace works without them */
    }
  }
}

export function toggleCheck(caseId: string, i: number) {
  set({
    cases: state.cases.map((c) => {
      if (c.id !== caseId) return c;
      const checks = c.checks.map((v, j) => (j === i ? !v : v));
      return {
        ...c,
        checks,
        status: c.status === "new" ? "review" : c.status,
        log: [...c.log, { at: Date.now(), actor: "Desk editor", text: `${checks[i] ? "Completed" : "Reopened"}: ${CHECKS[i]}` }],
      };
    }),
  });
}

const DECISION: Record<CaseStatus, string> = {
  new: "Returned to intake",
  review: "Opened for review",
  approved: "Approved for publication",
  held: "Held",
  published: "Published with public verification package",
};

export function decide(caseId: string, status: CaseStatus, note?: string) {
  set({
    cases: state.cases.map((c) =>
      c.id !== caseId ? c : { ...c, status, note, log: [...c.log, { at: Date.now(), actor: "Desk editor", text: note ? `${DECISION[status]}: ${note}` : DECISION[status] }] },
    ),
  });
}

/** Turn this device into an enrolled camera (real passkey when possible). */
export async function enrollMe(existing?: StoredCredential, simulated = false) {
  const pool = state.pool!;
  let me: Me;
  if (!simulated && (existing || realPasskeysAvailable())) {
    const stored = existing ?? (await createPasskey(`Unforged camera · ${new Date().toLocaleDateString()}`));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* private mode */ }
    const device = deviceFromStored(stored);
    const index = await pool.enroll(device);
    me = { mode: "passkey", device, index, stored, commitment: toHex(pool.commitmentOf(device)) };
  } else {
    const soft = new SoftPasskey(SIM_RP, SIM_ORIGIN);
    const index = await pool.enroll(soft.device());
    me = { mode: "simulated", device: soft.device(), index, soft, commitment: toHex(pool.commitmentOf(soft.device())) };
  }
  set({ me });
}

/** True when this browser already holds a passkey created by a previous sign-in. */
export function hasSavedPasskey(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

/**
 * Passkey sign-in. A returning user proves presence with their device (user verification
 * required) before the saved credential is used; a first-time user creates a passkey.
 */
export async function signInWithPasskey() {
  let stored: StoredCredential | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as StoredCredential;
  } catch { /* unreadable: treat as first sign-in */ }
  if (stored) await realAssertion(stored, random(32));
  await enrollMe(stored, false);
}

/** A temporary session with a software key. Ends when the tab closes. */
export async function continueAsGuest() {
  await enrollMe(undefined, true);
}

export function signOut() {
  set({ me: undefined });
}

export function forgetPasskey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export type StageTimes = { fingerprint: number; signature: number; proof: number };

/**
 * Seal a captured photo. Stages are reported as they really happen, with their
 * measured durations. No artificial waiting is added (UX.md: honest waiting).
 */
export async function sealPhoto(
  bytes: Uint8Array,
  url: string,
  onStage: (stage: number, times: Partial<StageTimes>) => void,
  title = "Field capture, this device",
): Promise<SealRecord> {
  const pool = state.pool!;
  const me = state.me!;
  const times: Partial<StageTimes> = {};
  const clock = () => performance.now();
  // Yield one frame so each stage is painted before CPU-bound work starts.
  // Background tabs pause rAF, so a short timeout guarantees progress.
  const frame = () =>
    new Promise((r) => {
      const t = setTimeout(r, 34);
      requestAnimationFrame(() => { clearTimeout(t); r(null); });
    });

  onStage(0, times);
  await frame();
  let t = clock();
  const fp = await sha256(bytes);
  times.fingerprint = clock() - t;

  onStage(1, times);
  await frame();
  t = clock();
  const challenge = pool.challengeFor(fp);
  const assertion = me.mode === "passkey" ? await realAssertion(me.stored!, challenge) : me.soft!.assert(challenge);
  times.signature = clock() - t;

  onStage(2, times);
  await frame();
  t = clock();
  const { batch, takenAt } = await relaySubmit({ device: me.device, assertion, fp });
  times.proof = clock() - t;
  const record: SealRecord = {
    times: times as StageTimes,
    level: me.mode === "passkey" ? "L1" : "L0",
    caseId: `EC-${++caseNo}`,
    title,
    batch,
    id: sealId(fp),
    fp,
    url,
    bytes,
    takenAt,
    epoch: pool.ledger.epoch,
    byYou: true,
    privateInputs: [
      { label: "Device public key (x)", value: short(me.device.pk.x.toString(16).padStart(64, "0")) },
      { label: "Device salt", value: short(toHex(me.device.salt)) },
      { label: "Which leaf in the pool tree", value: `#${me.index} of ${Number(pool.ledger.devices.firstFree())}` },
      { label: "Passkey signature (r)", value: short(assertion.signature.r.toString(16).padStart(64, "0")) },
      { label: "Authenticator data", value: short(toHex(assertion.authenticatorData)) },
    ],
  };
  openCase(record, `relay batch #${batch} from ${me.mode === "passkey" ? "a passkey capture client" : "an evaluation capture client"}`);
  onStage(3, times);
  return record;
}

export async function verifyBytes(bytes: Uint8Array): Promise<VerifyResult> {
  const pool = state.pool!;
  const fp = await sha256(bytes);
  const seal = pool.lookup(fp);
  if (!seal) return { kind: "none", fp };
  const l = pool.ledger;
  return {
    kind: "sealed",
    fp,
    id: sealId(fp),
    takenAt: Number(seal.takenAt),
    epoch: seal.epoch,
    poolSize: Number(l.deviceCount),
    removedSince: Number(l.epoch - seal.epoch),
    record: state.seals.find((r) => r.id === sealId(fp)),
  };
}

export async function revokeReporter(index: number) {
  await state.pool!.revoke(index);
  set({ reporters: state.reporters.map((r) => (r.index === index ? { ...r, revoked: true } : r)) });
}

// ------------------------------------------------------------- attack lab

export type AttackOutcome = { ok: boolean; code: string; note: string };

async function freshPhoto(label: string) {
  return sha256(new TextEncoder().encode(`${label}:${toHex(random(16))}`));
}

const refuse = async (run: () => Promise<unknown>, note: string): Promise<AttackOutcome> => {
  try {
    await run();
    return { ok: true, code: "ACCEPTED", note: "Unexpected: the contract accepted this." };
  } catch (e) {
    return { ok: false, code: refusalCode(e), note };
  }
};

const activeReporter = () => state.reporters.find((r) => !r.revoked)!;

export const attacks: Record<string, { title: string; story: string; run: () => Promise<AttackOutcome> }> = {
  outsider: {
    title: "A phone outside the pool",
    story: "An attacker's own phone tries to seal a fake.",
    run: async () => {
      const pool = state.pool!;
      const outsider = new SoftPasskey(SIM_RP, SIM_ORIGIN);
      const fp = await freshPhoto("fake");
      return refuse(() => pool.seal(outsider.device(), outsider.assert(pool.challengeFor(fp)), fp), "Not in the pool's Merkle tree, so no membership proof exists.");
    },
  },
  edited: {
    title: "Edit, then reuse the signature",
    story: "Someone edits a sealed-ready photo and replays the original passkey signature.",
    run: async () => {
      const pool = state.pool!;
      const r = activeReporter();
      const original = await freshPhoto("original");
      const edited = await freshPhoto("edited");
      const assertion = r.key.assert(pool.challengeFor(edited), { signFor: pool.challengeFor(original) });
      return refuse(() => pool.seal(r.key.device(), assertion, edited), "The chip signed a different fingerprint. P-256 check fails inside the circuit.");
    },
  },
  twice: {
    title: "Seal the same photo twice",
    story: "A second phone claims a photo that's already sealed.",
    run: async () => {
      const pool = state.pool!;
      const [a, b] = state.reporters.filter((x) => !x.revoked);
      const fp = await freshPhoto("dup");
      await pool.seal(a.key.device(), a.key.assert(pool.challengeFor(fp)), fp);
      set({});
      return refuse(() => pool.seal(b.key.device(), b.key.assert(pool.challengeFor(fp)), fp), "One photo, one seal. The first seal stands.");
    },
  },
  backdate: {
    title: "Backdate a photo",
    story: "Claim a photo was taken two days ago.",
    run: async () => {
      const pool = state.pool!;
      const r = activeReporter();
      const fp = await freshPhoto("old");
      return refuse(() => pool.seal(r.key.device(), r.key.assert(pool.challengeFor(fp)), fp, pool.now() - 2 * 86400), "Capture time must be within 24 h of sealing and never in the future.");
    },
  },
  nobio: {
    title: "Skip Face ID",
    story: "Malware signs without the user present and verified.",
    run: async () => {
      const pool = state.pool!;
      const r = activeReporter();
      const fp = await freshPhoto("nobio");
      return refuse(() => pool.seal(r.key.device(), r.key.assert(pool.challengeFor(fp), { flags: 0x01 }), fp), "The circuit requires the UV flag: a biometric or PIN approved this seal.");
    },
  },
  phishing: {
    title: "A phishing site",
    story: "A look-alike site tricks a reporter's passkey into signing.",
    run: async () => {
      const pool = state.pool!;
      const r = activeReporter();
      const fp = await freshPhoto("phish");
      return refuse(() => pool.seal(r.key.device(), r.key.assert(pool.challengeFor(fp), { origin: "https://unf0rged.xyz" }), fp), "The circuit rebuilds the signed origin; a different site produces a different message.");
    },
  },
  bypass: {
    title: "Owner bypasses the approvers",
    story: "The pool owner's key tries to add a credential without approvals.",
    run: async () => {
      const pool = state.pool!;
      const k = new SoftPasskey(SIM_RP, SIM_ORIGIN);
      return refuse(() => pool.ownerEnroll(pool.commitmentOf(k.device())), `Under the ${THRESHOLD}-of-${APPROVERS.length} policy the owner key alone cannot add a credential.`);
    },
  },
  doublevote: {
    title: "One approver votes twice",
    story: "A single approver tries to supply both required approvals.",
    run: async () => {
      const pool = state.pool!;
      const c = pool.commitmentOf(new SoftPasskey(SIM_RP, SIM_ORIGIN).device());
      await pool.approve(c, 0);
      set({});
      return refuse(() => pool.approve(c, 0), "The approval nullifier is already spent. Each approver counts once, and the record never shows which approver it was.");
    },
  },
  stolen: {
    title: "A stolen phone, after revocation",
    story: "The pool admin removes a stolen phone; the thief tries to seal.",
    run: async () => {
      const pool = state.pool!;
      const victim = [...state.reporters].reverse().find((x) => !x.revoked);
      if (!victim) return { ok: false, code: "NOT_ENROLLED", note: "All simulated phones already revoked." };
      await revokeReporter(victim.index);
      const fp = await freshPhoto("stolen");
      return refuse(() => pool.seal(victim.key.device(), victim.key.assert(pool.challengeFor(fp)), fp), `“${victim.name}” was revoked: accepted roots were reset, so its old membership no longer verifies.`);
    },
  },
};
