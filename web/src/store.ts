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

export type SealRecord = {
  id: string;
  fp: Uint8Array;
  url: string;
  bytes: Uint8Array;
  takenAt: number;
  epoch: bigint;
  byYou: boolean; // known only on this device, never on chain
  privateInputs: { label: string; value: string }[];
};

export type VerifyResult =
  | { kind: "sealed"; fp: Uint8Array; id: string; takenAt: number; epoch: bigint; poolSize: number; removedSince: number }
  | { kind: "none"; fp: Uint8Array };

type State = {
  ready: boolean;
  error?: string;
  pool?: Pool;
  reporters: Reporter[];
  me?: Me;
  seals: SealRecord[];
  version: number;
};

let state: State = { ready: false, reporters: [], seals: [], version: 0 };
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
    const pool = await Pool.deploy(MIN_POOL, new TextEncoder().encode(SIM_ORIGIN).length);
    const reporters: Reporter[] = [];
    const names = ["Kharkiv desk", "Gaza stringer", "Lagos fixer", "Manipur reporter", "Caracas photo", "Dhaka citizen", "Tbilisi student"];
    for (const name of names) {
      const key = new SoftPasskey(SIM_RP, SIM_ORIGIN);
      const index = await pool.enroll(key.device());
      reporters.push({ name, key, index, revoked: false, commitment: toHex(pool.commitmentOf(key.device())) });
    }
    set({ ready: true, pool, reporters });
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && realPasskeysAvailable()) await enrollMe(JSON.parse(saved) as StoredCredential);
  } catch (e) {
    set({ ready: true, error: (e as Error).message });
  }
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

export function forgetPasskey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** Seal a captured photo. `onStep` reports progress for the timeline. */
export async function sealPhoto(bytes: Uint8Array, url: string, onStep: (i: number) => void): Promise<SealRecord> {
  const pool = state.pool!;
  const me = state.me!;
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  onStep(0);
  const fp = await sha256(bytes);
  await pause(450);
  onStep(1);
  const challenge = pool.challengeFor(fp);
  const assertion = me.mode === "passkey" ? await realAssertion(me.stored!, challenge) : me.soft!.assert(challenge);
  if (me.mode === "simulated") await pause(500);
  onStep(2);
  await pause(250);
  const takenAt = pool.now() - 1;
  await pool.seal(me.device, assertion, fp, takenAt);
  onStep(3);
  await pause(450);
  const record: SealRecord = {
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
  set({ seals: [record, ...state.seals] });
  onStep(4);
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
