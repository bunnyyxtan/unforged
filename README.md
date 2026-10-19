# Unforged

> **Evidence without exposure.**

Unforged is a privacy-preserving trust layer for digital evidence. It lets an organization prove that an exact asset was approved by an authorized capture credential without publishing which contributor or device approved it.

[![CI](https://github.com/bunnyyxtan/unforgedds/actions/workflows/ci.yml/badge.svg)](https://github.com/bunnyyxtan/unforgedds/actions/workflows/ci.yml)
![Compact](https://img.shields.io/badge/Compact-0.35.0%20%C2%B7%20ZKIR%20v3-1f1f1f)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

## Why this needs Midnight

Public provenance systems expose signing keys and activity. Centralized verification services can correlate a contributor with every asset they submit. Unforged keeps the credential, signature, Merkle path and signer-to-file relationship private while publishing a narrow, independently checkable result.

The current Compact contract proves all of the following together:

1. the signer belongs to an enrolled organizational pool;
2. a real P-256 WebAuthn assertion approves this exact file fingerprint;
3. user presence and user verification flags are set;
4. the credential is valid in the current pool epoch;
5. the pool is large enough to satisfy its anonymity floor;
6. the fingerprint has not already been sealed;
7. the credential itself entered the pool only after k anonymous approvers each approved it.

A seal discloses only the fingerprint, stated time window and pool epoch. Enrollment discloses opaque commitments, an approval tally and per-credential nullifiers that never reveal which approvers approved. Midnight is the product boundary: verification remains public while authorization remains private.

## Wave 2 product

The repository contains a complete local evaluation workflow:

| Surface | Working behavior |
|---|---|
| **Capture** | Enroll a real passkey or a clearly labeled simulated credential (approved by 2 of 3 anonymous approvers), capture a camera frame, upload an existing photo (sealed byte for byte) or generate a test frame, and approve the exact bytes |
| **Desk** | Every seal opens an evidence case: established / asserted / human-reviewed / unresolved matrix, editorial checklist, hold reasons, decision log and a publication package |
| **Verify** | Drop an image, recompute SHA-256 locally and get an eight-row security report with the L0–L5 assurance ladder; export a local review or a draft C2PA `org.unforged.authorization` assertion |
| **Trust pool** | 2-of-3 anonymous approver policy enforced in circuit, aggregate pool state, revocation guarded by the anonymity floor |
| **Relay** | Submissions are batched in threes, shuffled and stamped to the hour before they reach the contract; the release log shows what each party can observe |
| **Assurance** | Ten adversarial scenarios; nine execute compiled Compact circuits and one checks changed-file fingerprint lookup |
| **Platform** | `npm run verify -- <file> <assertion.json>` checks a file against an exported assertion offline |

The browser runs the generated Compact contract through `@midnight-ntwrk/compact-runtime`. The Wave 2 build is a local ledger evaluation, not a public-network deployment or a camera-origin attestation.

The application is presented as one evidence-operations workspace rather than disconnected demos. Its desktop shell includes a persistent workflow rail and runtime scope; Capture uses staged credential onboarding, Verification separates evidence intake from review output, Assurance exposes observed failure paths, and Trust Pool presents aggregate policy state without per-device activity. Both darkroom and paper themes were exercised in the complete enrollment → test capture → seal → verify journey.

## Architecture

```text
capture client                         Midnight contract
──────────────                         ─────────────────
photo bytes ── SHA-256 ──────────────▶ fingerprint
passkey signs a domain-bound challenge
private key + salt + Merkle path ─────▶ prove enrolled membership
WebAuthn signature + auth data ───────▶ verify P-256, RP, origin, UP + UV
                                       enforce time, uniqueness, pool floor
                                       disclose fingerprint · time · epoch
```

The long-term product is a source-safe C2PA bridge connecting capture hardware, organizations, publishers and public verifiers. C2PA remains the interoperable provenance container; Unforged supplies private organizational authorization and minimum disclosure. See [Vision](docs/VISION.md) and [Architecture](docs/ARCHITECTURE.md).

## Contract

[`contract/src/unforged.compact`](contract/src/unforged.compact) targets Compact **0.35.0**, ZKIR v3 and ledger 9.

| Circuit | Authorization | Result |
|---|---|---|
| `enroll(deviceCommitment)` | Private admin secret | Adds an opaque credential commitment (only when the pool has no approval threshold) |
| `addApprover(approverCommitment)` | Private admin secret | Registers an opaque approver commitment |
| `approve(deviceCommitment)` | Private approver secret and Merkle path | Anonymous approval with a per-credential nullifier; the k-th approval enrolls the credential |
| `revoke(deviceIndex)` | Private admin secret | Removes a credential, increments epoch and invalidates old membership roots for future seals |
| `seal(fingerprint, takenAt)` | Private credential, salt, Merkle path and WebAuthn assertion | Verifies anonymous membership and P-256 approval of the exact fingerprint |

WebAuthn verification is adapted from [`midnightntwrk/passport`](https://github.com/midnightntwrk/passport) under Apache-2.0. The circuit reconstructs `clientDataJSON`, validates relying party and origin bindings, and checks UP and UV flags.

## Privacy boundary

| Public contract state | Private witness or client state |
|---|---|
| Opaque credential commitments | Credential public key and salt |
| Pool count and epoch | Which credential approved a file |
| File fingerprint | Merkle path and leaf index |
| Stated sealing time window | WebAuthn signature and authenticator data |
| Approval tally and nullifiers | Which approvers approved a credential |
| Seal existence | Contributor identity, location and device metadata |

Every `disclose()` is documented in [Architecture § Privacy boundary](docs/ARCHITECTURE.md#privacy-boundary).

## Quality evidence

- Compact compiles in CI with the pinned 0.35.0 toolchain and `--feature-zkir-v3`.
- **34 simulator tests** pass against generated code.
- Tests use real P-256 keys and WebAuthn-shaped assertions from `@noble/curves/p256`.
- Every circuit has a happy path and one test for each refusal code.
- Contract refusals cover unauthorized administration, owner bypass of the approval threshold, double approval, non-approvers, outsider membership, altered signatures, replay, missing user verification, wrong origin, stale time and revocation.
- Approver indistinguishability: the public record is identical whichever approvers approved a credential.
- The Threat Lab exposes failures as product evidence; prerequisites and runtime errors are never styled as successful refusals.
- Every commit passes the complete CI workflow: Compact compilation, contract tests, typecheck and production web build.

See [Evaluation evidence](docs/EVALUATION.md) and [Threat model](docs/THREAT-MODEL.md).

## Run locally

Requirements: Node 22.12 or newer. Node 24 is used in CI.

```bash
npm install
npm run dev -w web
```

Open `http://localhost:5173`.

```bash
# Windows: tests use generated code downloaded from CI
cd contract
npx vitest run

# Linux, macOS or WSL with Compact installed
compact update 0.35.0
cd contract
npm run compact
npm test

# Typecheck and production web build
cd ../web
npm run build
```

The Compact compiler is unavailable natively on Windows. CI uploads generated code as the `managed` artifact:

```bash
gh run download <run-id> -n managed -D contract/src/managed
```

### Deploy

The repository deploys to Vercel as a static site. `vercel.json` runs [`scripts/vercel-build.sh`](scripts/vercel-build.sh), which installs the pinned Compact 0.35.0 compiler on the Linux build image, compiles the contract and builds `web/dist`. Real passkeys need a contract variant compiled for the deployment origin's byte length (`node contract/scripts/variant.mjs <length>`); simulated credentials work on any origin.

## Current assurance level

| Claim | Wave 2 evidence | Production gate |
|---|---|---|
| Authorized credential approval | Compiled Compact circuit and local runtime | Public deployment and independent indexer reads |
| Exact-file integrity | SHA-256 byte match | Portable receipt plus C2PA hard and soft bindings |
| Camera origin | Not established by browser capture | Native capture with hardware and application attestation |
| Signer hidden from seal record | Tested ledger indistinguishability; local relay batching and hour-window time | Independent relays, anonymizing transport, operational controls and privacy audit |
| Enrollment authority | 2-of-3 anonymous approver threshold in circuit | Threshold revocation, approver rotation, recovery and durable audit log |
| Revocation | Contract and local pool workflow | Multi-admin policy, recovery, monitoring and durable audit log |

## Roadmap

- **Wave 2 — first platform release:** private membership, in-circuit WebAuthn P-256, threshold anonymous enrollment, revocation, Evidence Desk, security-report verification, local relay, draft C2PA assertion, offline verifier and adversarial suite.
- **Wave 3 — operational system:** real ledger-9 proofs, public deployment when supported, independent verification, persistent evidence cases, relay, sponsored fees, C2PA adapter and 1–3 design partners.
- **Commercial pilot:** native Android capture, hardware attestation, newsroom CMS integration, security review, first paid annual contract.
- **Platform:** Capture SDK, Verify API, source-safe C2PA bridge, self-hosted enterprise deployment and OEM integrations.

Read the [Roadmap](docs/ROADMAP.md), [PRD](docs/PRD.md), [Business model](docs/BUSINESS.md), [Research](docs/RESEARCH.md), [Design system](docs/DESIGN.md), [Threat model](docs/THREAT-MODEL.md) and [Evaluation evidence](docs/EVALUATION.md).

## Repository

```text
contract/            Compact contract, witnesses and simulator tests
web/                 React workspace: capture, desk, verification, assurance, pool, relay
tools/               Offline verifier for the draft authorization assertion
scripts/             Deployment build (Vercel)
docs/                Product, architecture, security, design and business evidence
.github/workflows/   Reproducible Compact compile, test and web-build checks
```

## License

[Apache License 2.0](LICENSE). Built for the Midnight Buildathon.
