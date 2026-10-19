// Real passkeys (navigator.credentials) and software passkeys for simulated
// reporters. The strict WebAuthn profile and DER parsing are adapted from
// midnightntwrk/passport (contract/src/wallet/webauthn.ts), Apache-2.0.

import { p256 } from "@noble/curves/nist.js";
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
import type { DeviceSecret, P256Point, P256Signature, PreparedAssertion, WebAuthnPolicy } from "../../../contract/src/witnesses";
import { base64url, bigintFrom, equal, fromBase64url, random, utf8 } from "./bytes";

/** The WebAuthn profile fixes the origin length at compile time; we ship one contract per length. */
export const ORIGIN_LENGTHS = [21, 28, 31] as const; // 21: http://localhost:5173 · 31: https://unforged-web.vercel.app · 28: https://evidence.example.org (tests)
export const supportedOrigin = (origin: string) => (ORIGIN_LENGTHS as readonly number[]).includes(utf8(origin).length);

export function policyFor(rpId: string, origin: string): WebAuthnPolicy {
  if (!supportedOrigin(origin)) {
    throw new Error(`Real passkeys are not enabled for "${origin}" yet.`);
  }
  return { rp_id_hash: nobleSha256(utf8(rpId)), origin: utf8(origin) };
}

export function expectedClientData(challenge: Uint8Array, origin: string): Uint8Array {
  return utf8(JSON.stringify({ type: "webauthn.get", challenge: base64url(challenge), origin, crossOrigin: false }));
}

/** Strict DER → (r, s). High-S is valid ES256 and is kept. */
export function parseES256(der: Uint8Array): P256Signature {
  if (der.length < 8 || der.length > 72 || der[0] !== 0x30 || der[1] !== der.length - 2) throw new Error("invalid ES256 signature");
  let o = 2;
  const read = () => {
    if (der[o++] !== 2) throw new Error("invalid ES256 integer");
    const len = der[o++];
    const v = bigintFrom(der.slice(o, o + len));
    o += len;
    if (v === 0n || v >= p256.Point.CURVE().n) throw new Error("ES256 scalar out of range");
    return v;
  };
  const r = read();
  const s = read();
  if (o !== der.length) throw new Error("trailing ES256 bytes");
  return { r, s };
}

// ---------------------------------------------------------------- real passkey

export type StoredCredential = { credentialId: string; x: string; y: string; salt: string; rpId: string; origin: string };

export async function createPasskey(label: string): Promise<StoredCredential> {
  const rpId = location.hostname;
  const origin = location.origin;
  policyFor(rpId, origin);
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: random(32),
      rp: { id: rpId, name: "Unforged" },
      user: { id: random(32), name: label, displayName: label },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256 = P-256, what secure chips sign with
      authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey creation was cancelled.");
  const response = credential.response as AuthenticatorAttestationResponse;
  const spki = response.getPublicKey();
  if (response.getPublicKeyAlgorithm() !== -7 || !spki) throw new Error("This authenticator did not create a P-256 (ES256) key.");
  const key = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const hex = (b64: string) => Array.from(fromBase64url(b64), (v) => v.toString(16).padStart(2, "0")).join("");
  const salt = random(32);
  return {
    credentialId: base64url(new Uint8Array(credential.rawId)),
    x: hex(jwk.x!),
    y: hex(jwk.y!),
    salt: Array.from(salt, (v) => v.toString(16).padStart(2, "0")).join(""),
    rpId,
    origin,
  };
}

export function deviceFromStored(c: StoredCredential): DeviceSecret {
  return {
    pk: { x: BigInt("0x" + c.x), y: BigInt("0x" + c.y), identity: false },
    salt: Uint8Array.from(c.salt.match(/../g)!, (h) => parseInt(h, 16)),
    policy: policyFor(c.rpId, c.origin),
  };
}

/** Ask the secure chip to sign the seal challenge (biometric prompt). */
export async function realAssertion(c: StoredCredential, challenge: Uint8Array): Promise<PreparedAssertion> {
  // Some browsers occasionally add extra clientDataJSON members; the circuit only
  // accepts the strict profile, so we ask again (rare).
  for (let attempt = 0; attempt < 3; attempt++) {
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(challenge),
        rpId: c.rpId,
        userVerification: "required",
        allowCredentials: [{ type: "public-key", id: fromBase64url(c.credentialId) as Uint8Array<ArrayBuffer> }],
      },
    })) as PublicKeyCredential | null;
    if (!credential) throw new Error("Sealing was cancelled.");
    const r = credential.response as AuthenticatorAssertionResponse;
    const clientData = new Uint8Array(r.clientDataJSON);
    if (!equal(clientData, expectedClientData(challenge, c.origin))) continue;
    const authenticatorData = new Uint8Array(r.authenticatorData);
    if (authenticatorData.length !== 37) throw new Error("Authenticator returned extension data; not supported.");
    return { challenge, authenticatorData, signature: parseES256(new Uint8Array(r.signature)) };
  }
  throw new Error("The browser kept changing the signed data format. Please try again.");
}

// ------------------------------------------------------------ software passkey

/** A simulated reporter's phone: same bytes a real secure chip would sign. */
export class SoftPasskey {
  readonly secret = p256.utils.randomSecretKey();
  readonly salt = random(32);
  constructor(readonly rpId: string, readonly origin: string) {}

  get pk(): P256Point {
    const { x, y } = p256.Point.fromBytes(p256.getPublicKey(this.secret, false)).toAffine();
    return { x, y, identity: false };
  }

  device(): DeviceSecret {
    return { pk: this.pk, salt: this.salt, policy: policyFor(this.rpId, this.origin) };
  }

  /** Options let the attack lab forge the classic mistakes; the circuit catches each. */
  assert(challenge: Uint8Array, o: { signFor?: Uint8Array; flags?: number; origin?: string } = {}): PreparedAssertion {
    const authenticatorData = new Uint8Array([...nobleSha256(utf8(this.rpId)), o.flags ?? 0x05, 0, 0, 0, 0]);
    const clientData = expectedClientData(o.signFor ?? challenge, o.origin ?? this.origin);
    const message = new Uint8Array([...authenticatorData, ...nobleSha256(clientData)]);
    const sig = p256.Signature.fromBytes(p256.sign(message, this.secret, { lowS: false }), "compact");
    return { challenge, authenticatorData, signature: { r: sig.r, s: sig.s } };
  }
}
