// SPDX-License-Identifier: Apache-2.0
//
// Private state and witness implementations for unforged.compact.
// Everything here stays on the prover's device; the circuit only ever
// discloses the photo fingerprint, the capture time, Merkle roots and
// approval nullifiers.

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/unforged/contract/index.js";

export type P256Point = { x: bigint; y: bigint; identity: boolean };
export type P256Signature = { r: bigint; s: bigint };
export type WebAuthnPolicy = { rp_id_hash: Uint8Array; origin: Uint8Array };

/** An enrolled device as known to its owner. Never published. */
export type DeviceSecret = {
  pk: P256Point;
  salt: Uint8Array;
  policy: WebAuthnPolicy;
};

/** A passkey assertion prepared for one specific seal challenge. */
export type PreparedAssertion = {
  challenge: Uint8Array;
  authenticatorData: Uint8Array;
  signature: P256Signature;
};

export type UnforgedPrivateState = {
  adminSecret?: Uint8Array;
  approverSecret?: Uint8Array;
  device?: DeviceSecret;
  assertion?: PreparedAssertion;
};

type Ctx = WitnessContext<Ledger, UnforgedPrivateState>;

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing private input: ${what}`);
  return value;
}

function assertionFor({ privateState }: Ctx, challenge: Uint8Array): PreparedAssertion {
  const a = need(privateState.assertion, "passkey assertion");
  if (!sameBytes(a.challenge, challenge)) throw new Error("prepared assertion is for a different photo or pool");
  return a;
}

export const witnesses = {
  adminSecret: ({ privateState }: Ctx): [UnforgedPrivateState, Uint8Array] =>
    [privateState, need(privateState.adminSecret, "admin secret")],

  deviceKey: ({ privateState }: Ctx): [UnforgedPrivateState, P256Point] =>
    [privateState, need(privateState.device, "device").pk],

  deviceSalt: ({ privateState }: Ctx): [UnforgedPrivateState, Uint8Array] =>
    [privateState, need(privateState.device, "device").salt],

  devicePolicy: ({ privateState }: Ctx): [UnforgedPrivateState, WebAuthnPolicy] =>
    [privateState, need(privateState.device, "device").policy],

  // The path is computed from the public tree; only the prover sees which leaf it is.
  devicePath: ({ privateState, ledger }: Ctx, leaf: Uint8Array) => {
    const path = ledger.devices.findPathForLeaf(leaf);
    if (!path) throw new Error("NOT_ENROLLED");
    return [privateState, path] as const;
  },

  approverSecret: ({ privateState }: Ctx): [UnforgedPrivateState, Uint8Array] =>
    [privateState, need(privateState.approverSecret, "approver secret")],

  approverPath: ({ privateState, ledger }: Ctx, leaf: Uint8Array) => {
    const path = ledger.approvers.findPathForLeaf(leaf);
    if (!path) throw new Error("NOT_APPROVER");
    return [privateState, path] as const;
  },

  assertionData: (ctx: Ctx, challenge: Uint8Array): [UnforgedPrivateState, Uint8Array] =>
    [ctx.privateState, assertionFor(ctx, challenge).authenticatorData],

  assertionSignature: (ctx: Ctx, challenge: Uint8Array): [UnforgedPrivateState, P256Signature] =>
    [ctx.privateState, assertionFor(ctx, challenge).signature],
};
