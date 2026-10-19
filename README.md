# Unforged

**Prove it's real. Keep who took it secret.**

Unforged seals photos at the moment of capture. A phone's secure-chip passkey signs the photo's fingerprint, and a zero-knowledge proof on [Midnight](https://midnight.network) shows the signature came from **one of the enrolled phones in a pool, without revealing which one**. Anyone can verify a sealed photo; nobody (not the newsroom, not Unforged, not a chain observer) can tell who took it.

[![CI](https://github.com/bunnyyxtan/unforged/actions/workflows/ci.yml/badge.svg)](https://github.com/bunnyyxtan/unforged/actions/workflows/ci.yml)
![Compact](https://img.shields.io/badge/Compact-0.35.0%20·%20ZKIR%20v3-1f1f1f)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

## Why
AI made fake photos free. Signed-capture standards (C2PA Content Credentials, shipping in Pixel 10, Leica, Sony, Canon, Nikon) prove authenticity, but their metadata can expose the photographer, their device and their location. That's a known physical danger for reporters, protesters and human-rights documenters. Today you choose **authentic and traceable** or **anonymous and unverifiable**. Unforged gives you both. → [Vision](docs/VISION.md) · [Research](docs/RESEARCH.md)

## How it works
```
 phone                                   Midnight (ledger 9)
 ─────                                   ───────────────────
 1. capture photo → SHA-256 fingerprint
 2. passkey (secure chip, Face ID)  ──▶  seal(fingerprint, takenAt)
    signs H(pool, fingerprint)             proves in zero knowledge:
 3. build proof with private inputs:        • signer ∈ enrolled devices (Merkle membership)
    key · salt · Merkle path ·              • valid WebAuthn P-256 signature over this photo
    signature · authenticator data          • user present + verified (biometric)
                                            • pool ≥ minimum size, time within window
                                          public result: fingerprint · time · pool epoch
```
The P-256 signature from the phone's secure chip is verified **inside** the circuit (`secp256r1EcdsaVerify`, new in Compact 0.35), so the device key never appears on chain. → [Architecture](docs/ARCHITECTURE.md)

## Privacy boundary
| Public on Midnight | Never leaves the phone |
|---|---|
| Photo fingerprint (SHA-256) | Which phone sealed it |
| Capture time | Device public key and salt |
| Pool size and epoch | Merkle path / leaf index |
| Opaque device commitments | Passkey signature and authenticator data |

## The contract
[`contract/src/unforged.compact`](contract/src/unforged.compact)

| Circuit | Who | What it guarantees |
|---|---|---|
| `enroll(commitment)` | pool admin | Adds an opaque device commitment to the pool's Merkle tree |
| `revoke(index)` | pool admin | Removes a device and resets accepted roots so it can't prove membership |
| `seal(fingerprint, takenAt)` | any enrolled phone | Anonymous membership + in-circuit WebAuthn P-256 verification, bound to this pool and this exact photo |

WebAuthn verification uses the profiled module from [midnightntwrk/passport](https://github.com/midnightntwrk/passport) (Apache-2.0), which rebuilds `clientDataJSON` in-circuit and checks RP, origin and UP+UV flags.

## The app
[`web/`](web): a Vite + React app that runs the **real compiled contract** on Midnight's compact-runtime inside the browser.

| Screen | What you can do |
|---|---|
| **Seal a photo** | Enroll your device with a real passkey (Face ID, Touch ID, Windows Hello, or a phone via QR), shoot with the camera, and watch the seal stamp down |
| **Verify** | Drop any photo: **Sealed** (three ticks, time, pool size, photographer hidden) or **No seal found**. Tabs show what the world sees, what stays private, and how to check it yourself |
| **Attack lab** | Run 8 attacks against the circuit (outsider, edited photo, replay, backdate, skip Face ID, phishing, stolen phone, one-pixel edit) and see each refusal code |
| **Pool desk** | The admin view: enroll and remove phones, but never see who sealed what |
| **How it works** | Your last seal split into "On Midnight" vs "Never leaves the phone" |

## Tests: the attacks that fail
26 simulator tests with **real P-256 passkey assertions** (byte-exact WebAuthn encoding), run in CI on every push.

| Attack | Result |
|---|---|
| Phone outside the pool tries to seal | `NOT_ENROLLED` |
| Outsider borrows an enrolled phone's Merkle path | `NOT_ENROLLED` |
| Edited photo reuses the original's signature | `BAD_SIGNATURE` |
| Signature replayed from another pool | `BAD_SIGNATURE` |
| Stolen public key without the chip's private key | `BAD_SIGNATURE` |
| Assertion from a phishing origin / other website | refused |
| Registration ceremony passed off as a seal | `BAD_SIGNATURE` |
| No biometric / PIN verification | refused (UV required) |
| Same photo sealed twice | `ALREADY_SEALED` |
| Capture time in the future / older than 24 h | `BAD_TIME` |
| Pool too small to hide anyone | `POOL_TOO_SMALL` |
| Revoked phone tries to seal | `NOT_ENROLLED` |
| Non-admin enrolls or revokes | `NOT_ADMIN` |

Plus an **anonymity test**: the entire public ledger is identical whichever enrolled phone sealed the photo.

## Run it
Requirements: Node ≥ 22, Compact toolchain **0.35.0** (Linux/macOS: `compact update 0.35.0`).
```bash
npm install
cd contract
npm run compact      # compiles unforged.compact (+ the 28-byte-origin variant) with --feature-zkir-v3
npm test
cd .. && npm run dev -w web   # http://localhost:5173: real passkeys work on this origin
```
The WebAuthn profile fixes the origin length at compile time, so `npm run compact` builds one variant per deployment origin: 21 bytes (`http://localhost:5173`) and 28 bytes (`https://bunnyyxtan.github.io`).
Windows / no compiler: every CI run uploads the generated code as the `managed` artifact.
```bash
gh run download <run-id> -n managed -D contract/src/managed && cd contract && npm test
```

## Status & roadmap
| | |
|---|---|
| ✅ | Contract: enroll · revoke · seal with anonymous membership and in-circuit WebAuthn P-256 |
| ✅ | Simulator test suite with real passkey assertions and every refusal path |
| ✅ | Web app: real passkey enrollment, camera capture, seal, verify, attack lab, pool desk, ledger view |
| ⏳ | Ledger-9 network deployment (P-256 needs ledger 9; Preprod/Mainnet after the fork) |
| 🔭 | Native capture with App Attest / Key Attestation, C2PA bridge, verify API |

Pitch deck: [docs/Unforged-Deck.pdf](docs/Unforged-Deck.pdf) · Full plan: [Roadmap](docs/ROADMAP.md) · [PRD](docs/PRD.md) · [Threat model](docs/THREAT-MODEL.md) · [Design](docs/DESIGN.md) · [Business](docs/BUSINESS.md)

## Honest limits
- A seal proves a **real, unedited capture by an enrolled device approved by a person**. It doesn't prove what the photo *means*.
- Web passkeys prove a human approved on an enrolled authenticator, not that the camera sensor produced the pixels. Native attestation closes this ([T3](docs/THREAT-MODEL.md)).
- Anonymity is only as strong as the pool is large; the contract enforces a minimum pool size.

## License
[Apache-2.0](LICENSE). Built for the Midnight Buildathon on AKINDO.
