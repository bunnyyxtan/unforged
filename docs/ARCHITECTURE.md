# Unforged — Architecture

## System overview
```
 ┌──────────────── Reporter's phone ────────────────┐        ┌──────── Midnight (ledger 9) ────────┐
 │ Capture app (PWA → native)                        │        │ unforged.compact (one per pool)      │
 │  1. camera → image bytes → strip EXIF → SHA-256   │        │  public:                             │
 │  2. challenge = H(domain, contract, fingerprint)  │        │   devices  HistoricMerkleTree<16>    │
 │  3. WebAuthn get() → secure chip signs (P-256)    │  proof │   seals    Map<fingerprint, Seal>    │
 │  4. witnesses: pk, salt, Merkle path, authData,   │ ─────▶ │   admin    commitment                │
 │     signature  (never leave the device*)          │        │   policy   rp_id_hash                │
 │  5. prove `seal(fingerprint)` → submit            │        │  circuits: enroll · revoke · seal    │
 └───────────────────────────────────────────────────┘        └──────────────────────────────────────┘
                                                                         ▲ indexer reads
 ┌──────── Verify (public web, no account) ───────┐                      │
 │ drop file → SHA-256 → seals.lookup(fingerprint)  ────────────────────┘
 │ → SEALED / NO SEAL + pool size + time + epoch     │
 └──────────────────────────────────────────────────┘
 * Wave 2–3: proving via a proof server. Remote proving sees witnesses, so see THREAT-MODEL T7.
```

## Contract: `unforged.compact` (Compact 0.35.0, `--feature-zkir-v3`, ledger 9)

### Public ledger state
| Field | Type | Purpose |
|---|---|---|
| `admin` | `Bytes<32>` | H("unforged:admin:v1", adminSecret). Gates enroll/revoke |
| `rpIdHash` | `Bytes<32>` | WebAuthn relying-party hash the passkeys must be bound to |
| `devices` | `HistoricMerkleTree<16, Bytes<32>>` | Device commitments (≤ 65,536 per pool). Historic roots let proofs survive concurrent enrollments |
| `deviceCount` | `Counter` | Pool size shown on every seal |
| `seals` | `Map<Bytes<32>, Seal>` | fingerprint → { sealedAfter, rootEpoch } |
| `epoch` | `Counter` | Incremented on revocation; history reset |

### Circuits
| Circuit | Who | Proves | Discloses |
|---|---|---|---|
| `constructor(rpIdHash)` | deployer | admin = H(adminSecret) | admin commitment, rpIdHash |
| `enroll(deviceCommitment)` | admin | knowledge of adminSecret | the new commitment (opaque) |
| `revoke(index)` | admin | knowledge of adminSecret | leaf index cleared; epoch++ ; root history reset |
| `seal(fingerprint, takenAt)` | anyone with an enrolled device | (1) pool has ≥ `minPoolSize` devices, (2) witness pk + salt + policy hash to a leaf, (3) Merkle path → a root in `devices` history, (4) WebAuthn P-256 assertion over challenge = H("unforged:seal:v1", self, fingerprint) with UP+UV, (5) fingerprint not yet sealed, (6) takenAt ≤ block time < takenAt + 24 h | fingerprint, takenAt, the root used (shared by all members, so it doesn't identify) |

WebAuthn verification reuses the profiled module from [midnightntwrk/passport](https://github.com/midnightntwrk/passport) (`contract/contracts/webauthn.compact`, Apache-2.0, attributed in source). It rebuilds clientDataJSON in-circuit from the challenge and a fixed origin, checks rpIdHash and flags, and verifies P-256 over SHA-256(authenticatorData ‖ SHA-256(clientDataJSON)).

### Privacy boundary
| Data | Lives in | Visible to |
|---|---|---|
| Image pixels | Reporter's device, wherever they share it | Whoever they share with |
| Fingerprint (SHA-256 of file) | Public ledger | Everyone |
| Seal time window | Public ledger | Everyone |
| Pool & pool size | Public ledger | Everyone |
| Device public key, salt | Witness (prover only) | Reporter's device (+ prover, Wave 2–3) |
| Merkle path / leaf index | Witness | Reporter's device |
| WebAuthn signature, authenticatorData | Witness | Reporter's device |
| Which device sealed which photo | **Nowhere** | Nobody (beyond the pool-size anonymity set) |
| Admin secret | Admin's device | Admin |

Every `disclose()` in the contract must appear in this table. CI review rule: see AGENTS.md.

## Off-chain components
| Component | Stack | Notes |
|---|---|---|
| `contract/` | Compact 0.35, compact-runtime 0.20.0, vitest | Simulator tests with real P-256 vectors (`@noble/curves`) |
| `web/` | Vite + React + TypeScript | Capture, Verify, Desk, ledger view. WebAuthn via `navigator.credentials`. SHA-256 via WebCrypto |
| Prover | Midnight proof server 9.x (ledger 9) | ~220–290 MB keys per P-256 verify circuit. Mobile proving is on Midnight's roadmap |
| Relay (Wave 3) | Small stateless service | Batches and jitters submissions; no logs |
| Fees | Sponsored DUST | Reporters never hold tokens |

## Networks & toolchain
| Stage | Network | Toolchain |
|---|---|---|
| Wave 2 | compact-runtime simulator (in Node and in-browser) | Compact 0.35.0 + zkir v3, compiled in GitHub Actions |
| Wave 3 | Local ledger-9 network (node 2.1.0-rc, indexer 4.4.0-rc, proof server 9.0.0-rc.8) → Preprod after the ledger-9 fork | midnight-js 5.0.0-rc.x |
| Later | Mainnet after the fork | stable releases |

## Key design decisions
See MEMORY.md → Decisions. Highlights:
- **Merkle membership instead of a public device set.** Passport's account model discloses the device entry; we must not.
- **One contract per pool.** Simple isolation, and Midnight now lets contracts deploy contracts, so the Desk can spawn pools.
- **Fingerprint = SHA-256 of the exact file.** Re-encoding breaks it by design; edit-tolerant seals come from VerITAS-style proofs (roadmap).
