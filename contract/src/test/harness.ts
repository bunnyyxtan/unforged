// SPDX-License-Identifier: Apache-2.0
//
// Test harness: an in-memory Unforged pool on the compact-runtime simulator,
// plus a software passkey that produces byte-exact WebAuthn assertions
// (the same bytes a phone's secure chip signs).

import {
  createCircuitContext,
  createConstructorContext,
  type StateValue,
} from "@midnight-ntwrk/compact-runtime";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as Unforged21 from "../managed/unforged/contract/index.js";
import { pureCircuits, type Ledger } from "../managed/unforged/contract/index.js";

/** A compiled contract module; variants differ only in the WebAuthn origin length. */
export type ContractModule = typeof Unforged21;
import {
  witnesses,
  type DeviceSecret,
  type UnforgedPrivateState,
  type WebAuthnPolicy,
} from "../witnesses.js";

export const RP_ID = "localhost";
export const ORIGIN = "http://localhost:5173"; // 21 bytes, matches WebAuthn<21>
export const NOW = 1_800_000_000; // simulated block time, seconds

const utf8 = (s: string) => new TextEncoder().encode(s);
const b64url = (b: Uint8Array) => Buffer.from(b).toString("base64url");
export const bytes = (n: number, fill: number) => new Uint8Array(n).fill(fill);
export const fingerprint = (photo: string) => sha256(utf8(photo));

export function policy(rpId = RP_ID, origin = ORIGIN): WebAuthnPolicy {
  return { rp_id_hash: sha256(utf8(rpId)), origin: utf8(origin) };
}

export type AssertionOverrides = {
  origin?: string;
  rpId?: string;
  flags?: number;
  type?: string;
  signWith?: Uint8Array; // a different private key
};

/** A software authenticator: P-256 key + WebAuthn assertion encoding. */
export class Passkey {
  readonly secret = p256.utils.randomSecretKey();
  readonly salt = crypto.getRandomValues(new Uint8Array(32));

  get pk() {
    const { x, y } = p256.Point.fromBytes(p256.getPublicKey(this.secret, false)).toAffine();
    return { x, y, identity: false };
  }

  device(pol: WebAuthnPolicy = policy()): DeviceSecret {
    return { pk: this.pk, salt: this.salt, policy: pol };
  }

  commitment(pol: WebAuthnPolicy = policy()): Uint8Array {
    return pureCircuits.deviceCommitment(this.pk, this.salt, pol);
  }

  /** authenticatorData || SHA-256(clientDataJSON), signed with ES256 (as a passkey does). */
  assert(challenge: Uint8Array, o: AssertionOverrides = {}) {
    const authenticatorData = new Uint8Array([...sha256(utf8(o.rpId ?? RP_ID)), o.flags ?? 0x05, 0, 0, 0, 0]);
    const clientDataJSON = utf8(
      `{"type":"${o.type ?? "webauthn.get"}","challenge":"${b64url(challenge)}","origin":"${o.origin ?? ORIGIN}","crossOrigin":false}`,
    );
    const message = new Uint8Array([...authenticatorData, ...sha256(clientDataJSON)]);
    const sig = p256.Signature.fromBytes(p256.sign(message, o.signWith ?? this.secret, { lowS: false }), "compact");
    return { challenge, authenticatorData, signature: { r: sig.r, s: sig.s } };
  }
}

/** One Unforged pool (one contract instance) on the simulator. */
export class Pool {
  state!: StateValue;
  privateState: UnforgedPrivateState;
  time = NOW;
  private readonly contract: InstanceType<ContractModule["Contract"]>;
  private readonly coinPk = { bytes: bytes(32, 7) };

  private constructor(readonly address: string, readonly adminSecret: Uint8Array, w = witnesses, private readonly mod: ContractModule = Unforged21) {
    this.contract = new mod.Contract<UnforgedPrivateState>(w as never);
    this.privateState = { adminSecret };
  }

  static async deploy(opts: { minPoolSize?: bigint; address?: string; adminSecret?: Uint8Array; witnesses?: typeof witnesses; module?: ContractModule } = {}) {
    const pool = new Pool(opts.address ?? "11".repeat(32), opts.adminSecret ?? bytes(32, 1), opts.witnesses, opts.module);
    const init = await pool.contract.initialState(
      createConstructorContext(pool.privateState, pool.coinPk as never),
      opts.minPoolSize ?? 2n,
    );
    pool.state = (init.currentContractState as any).data as StateValue;
    return pool;
  }

  get ledger(): Ledger {
    return this.mod.ledger(this.state);
  }

  get addressBytes() {
    return Uint8Array.from(Buffer.from(this.address, "hex"));
  }

  challengeFor(fp: Uint8Array) {
    return pureCircuits.sealChallenge({ bytes: this.addressBytes }, fp);
  }

  async call(circuit: "enroll" | "revoke" | "seal", ...args: unknown[]) {
    const ctx = createCircuitContext<UnforgedPrivateState>({
      circuitId: circuit,
      contractAddress: this.address,
      coinPublicKeyOrZswapState: this.coinPk,
      contractState: this.state,
      privateState: this.privateState,
      time: this.time,
    } as never);
    const r = await (this.contract.impureCircuits as any)[circuit](ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
    return r.result;
  }

  enroll(commitment: Uint8Array, asAdmin = this.adminSecret) {
    this.privateState = { adminSecret: asAdmin };
    return this.call("enroll", commitment);
  }

  revoke(index: bigint, asAdmin = this.adminSecret) {
    this.privateState = { adminSecret: asAdmin };
    return this.call("revoke", index);
  }

  /** The full reporter flow: passkey signs the pool+photo challenge, then the seal circuit runs. */
  seal(key: Passkey, fp: Uint8Array, opts: { takenAt?: number; assertion?: ReturnType<Passkey["assert"]>; overrides?: AssertionOverrides; policy?: WebAuthnPolicy } = {}) {
    const assertion = opts.assertion ?? key.assert(this.challengeFor(fp), opts.overrides);
    this.privateState = { device: key.device(opts.policy), assertion };
    return this.call("seal", fp, BigInt(opts.takenAt ?? this.time - 60));
  }
}
