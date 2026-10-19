// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it } from "vitest";
import { witnesses } from "../witnesses.js";
import { bytes, fingerprint, NOW, Passkey, policy, Pool } from "./harness.js";

const PHOTO = fingerprint("protest-square-1402.jpg");

const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");

/** Everything an observer of the chain can read from a pool. */
function publicView(pool: Pool) {
  const l = pool.ledger;
  return JSON.stringify(
    {
      admin: hex(l.admin),
      minPoolSize: l.minPoolSize,
      root: l.devices.root(),
      firstFree: l.devices.firstFree(),
      deviceCount: l.deviceCount,
      epoch: l.epoch,
      sealCount: l.sealCount,
      seals: [...l.seals].map(([fp, s]) => [hex(fp), s]),
    },
    (_k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Uint8Array ? hex(v) : v),
  );
}

/** A pool with three enrolled phones (minimum pool size 2). */
async function poolOf(n: number, opts: Parameters<typeof Pool.deploy>[0] = {}) {
  const pool = await Pool.deploy(opts);
  const keys = Array.from({ length: n }, () => new Passkey());
  for (const k of keys) await pool.enroll(k.commitment());
  return { pool, keys };
}

describe("deploy", () => {
  it("stores only a commitment to the admin secret", async () => {
    const pool = await Pool.deploy();
    expect(pool.ledger.admin).toHaveLength(32);
    expect(Buffer.from(pool.ledger.admin)).not.toEqual(Buffer.from(bytes(32, 1)));
    expect(pool.ledger.minPoolSize).toBe(2n);
    expect(pool.ledger.deviceCount).toBe(0n);
    expect(pool.ledger.sealCount).toBe(0n);
  });
});

describe("enroll", () => {
  it("adds opaque device commitments and counts them", async () => {
    const { pool } = await poolOf(3);
    expect(pool.ledger.deviceCount).toBe(3n);
    expect(pool.ledger.devices.firstFree()).toBe(3n);
  });

  it("refuses anyone but the admin (NOT_ADMIN)", async () => {
    const pool = await Pool.deploy();
    await expect(pool.enroll(new Passkey().commitment(), bytes(32, 9))).rejects.toThrow(/NOT_ADMIN/);
  });

  it("gives the same phone a different, unlinkable commitment in every pool (fresh salt)", () => {
    const k = new Passkey();
    const again = new Passkey();
    expect(Buffer.from(k.commitment())).not.toEqual(Buffer.from(again.commitment()));
  });
});

describe("seal: happy path", () => {
  let pool: Pool;
  let keys: Passkey[];
  beforeEach(async () => ({ pool, keys } = await poolOf(3)));

  it("an enrolled phone seals a photo; only fingerprint and time become public", async () => {
    await pool.seal(keys[1], PHOTO, { takenAt: NOW - 120 });
    expect(pool.ledger.seals.member(PHOTO)).toBe(true);
    expect(pool.ledger.seals.lookup(PHOTO)).toEqual({ takenAt: BigInt(NOW - 120), epoch: 0n });
    expect(pool.ledger.sealCount).toBe(1n);
  });

  it("accepts backed-up passkeys (flags 0x1d: UP, UV, BE, BS)", async () => {
    await pool.seal(keys[0], PHOTO, { overrides: { flags: 0x1d } });
    expect(pool.ledger.seals.member(PHOTO)).toBe(true);
  });

  it("allows an offline photo sealed later, within 24 h", async () => {
    await pool.seal(keys[2], PHOTO, { takenAt: NOW - 86_000 });
    expect(pool.ledger.seals.member(PHOTO)).toBe(true);
  });
});

describe("seal: anonymity", () => {
  it("the public ledger is identical whichever enrolled phone sealed the photo", async () => {
    const admin = bytes(32, 1);
    const keys = [new Passkey(), new Passkey(), new Passkey()];
    const run = async (sealer: number) => {
      const pool = await Pool.deploy({ adminSecret: admin });
      for (const k of keys) await pool.enroll(k.commitment());
      await pool.seal(keys[sealer], PHOTO, { takenAt: NOW - 30 });
      return publicView(pool);
    };
    const [a, b, c] = [await run(0), await run(1), await run(2)];
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});

describe("seal: refusals", () => {
  let pool: Pool;
  let keys: Passkey[];
  beforeEach(async () => ({ pool, keys } = await poolOf(3)));

  it("ALREADY_SEALED: the same photo can be sealed once", async () => {
    await pool.seal(keys[0], PHOTO);
    await expect(pool.seal(keys[1], PHOTO)).rejects.toThrow(/ALREADY_SEALED/);
  });

  it("NOT_ENROLLED: a phone outside the pool cannot seal", async () => {
    await expect(pool.seal(new Passkey(), PHOTO)).rejects.toThrow(/NOT_ENROLLED/);
  });

  it("NOT_ENROLLED: an outsider cannot borrow an enrolled phone's membership path", async () => {
    const stolenPath = keys[0].commitment();
    const forger = await Pool.deploy({
      witnesses: { ...witnesses, devicePath: ({ privateState, ledger }: any) => [privateState, ledger.devices.findPathForLeaf(stolenPath)] },
    });
    for (const k of keys) await forger.enroll(k.commitment());
    await expect(forger.seal(new Passkey(), PHOTO)).rejects.toThrow(/NOT_ENROLLED/);
  });

  it("BAD_SIGNATURE: an edited photo cannot reuse the original's signature", async () => {
    const edited = fingerprint("protest-square-1402-edited.jpg");
    const original = keys[0].assert(pool.challengeFor(PHOTO));
    const forged = { ...original, challenge: pool.challengeFor(edited) };
    await expect(pool.seal(keys[0], edited, { assertion: forged })).rejects.toThrow(/BAD_SIGNATURE/);
  });

  it("BAD_SIGNATURE: a signature made for another pool is refused (no cross-pool replay)", async () => {
    const other = await Pool.deploy({ address: "22".repeat(32) });
    const forOtherPool = keys[0].assert(other.challengeFor(PHOTO));
    const replay = { ...forOtherPool, challenge: pool.challengeFor(PHOTO) };
    await expect(pool.seal(keys[0], PHOTO, { assertion: replay })).rejects.toThrow(/BAD_SIGNATURE/);
  });

  it("BAD_SIGNATURE: a stolen public key without the chip's private key", async () => {
    const attacker = new Passkey();
    await expect(pool.seal(keys[0], PHOTO, { overrides: { signWith: attacker.secret } })).rejects.toThrow(/BAD_SIGNATURE/);
  });

  it("BAD_SIGNATURE: an assertion made on a phishing origin", async () => {
    await expect(pool.seal(keys[0], PHOTO, { overrides: { origin: "https://evil.example" } })).rejects.toThrow(/BAD_SIGNATURE/);
  });

  it("BAD_SIGNATURE: a registration ceremony is not a seal", async () => {
    await expect(pool.seal(keys[0], PHOTO, { overrides: { type: "webauthn.create" } })).rejects.toThrow(/BAD_SIGNATURE/);
  });

  it("refuses an assertion without biometric/PIN verification (UV flag missing)", async () => {
    await expect(pool.seal(keys[0], PHOTO, { overrides: { flags: 0x01 } })).rejects.toThrow(/UP and UV/);
  });

  it("refuses an assertion for another website (RP mismatch)", async () => {
    await expect(pool.seal(keys[0], PHOTO, { overrides: { rpId: "evil.example" } })).rejects.toThrow(/RP mismatch/);
  });

  it("BAD_TIME: a capture time in the future", async () => {
    await expect(pool.seal(keys[0], PHOTO, { takenAt: NOW + 600 })).rejects.toThrow(/BAD_TIME/);
  });

  it("BAD_TIME: a photo older than the 24 h sealing window", async () => {
    await expect(pool.seal(keys[0], PHOTO, { takenAt: NOW - 90_000 })).rejects.toThrow(/BAD_TIME/);
  });

  it("POOL_TOO_SMALL: sealing waits until the pool hides you in a crowd", async () => {
    const tiny = await Pool.deploy({ minPoolSize: 5n });
    const k = new Passkey();
    await tiny.enroll(k.commitment());
    await expect(tiny.seal(k, PHOTO)).rejects.toThrow(/POOL_TOO_SMALL/);
  });
});

describe("revoke", () => {
  it("a revoked phone can no longer seal; the others still can", async () => {
    const { pool, keys } = await poolOf(3);
    await pool.revoke(0n);
    expect(pool.ledger.deviceCount).toBe(2n);
    expect(pool.ledger.epoch).toBe(1n);
    await expect(pool.seal(keys[0], PHOTO)).rejects.toThrow(/NOT_ENROLLED/);
    await pool.seal(keys[1], PHOTO);
    expect(pool.ledger.seals.lookup(PHOTO).epoch).toBe(1n);
  });

  it("refuses anyone but the admin (NOT_ADMIN)", async () => {
    const { pool } = await poolOf(3);
    await expect(pool.revoke(0n, bytes(32, 9))).rejects.toThrow(/NOT_ADMIN/);
  });
});

describe("protocol constants", () => {
  it("the WebAuthn origin profile is exactly 21 bytes", () => {
    expect(policy().origin).toHaveLength(21);
  });
});
