# Unforged — Product Requirements Document

| | |
|---|---|
| Status | v0.2, 2026-10-19 (Wave 2 browser foundation; production release gated) |
| Owner | bunnyy |
| Related | [VISION](VISION.md) · [BUSINESS](BUSINESS.md) · [ARCHITECTURE](ARCHITECTURE.md) · [THREAT-MODEL](THREAT-MODEL.md) · [DESIGN](DESIGN.md) · [ROADMAP](ROADMAP.md) |

## 1. Problem
Newsrooms need to examine image provenance without publishing a source directory. An exact-file seal can establish that a pool credential approved particular bytes, while private membership keeps the signer out of the public record. That alone cannot establish camera origin, scene truth or total source anonymity. Unforged's product is the full trust workflow: controlled enrollment, field capture, bounded editorial review, independent verification and incident response.

### Current assurance level and release gates
| Capability | Wave 2 browser build | Production requirement |
|---|---|---|
| Private pool membership + passkey check | Compiled Compact contract in local runtime | Real network proofs, deployment and independent indexer reads |
| File integrity | SHA-256 exact-byte match | Portable, independently verifiable receipt |
| Capture origin | Browser camera or generated test frame; client can be modified | Native app and device/camera attestation |
| Signer identity protection | Signer omitted from seal record | Relay/batching, enrollment access controls and timing analysis |
| Revocation | Local pool epoch reset | Multi-admin policy, audit log, recovery and monitoring |
| Editorial review | Verification desk and downloadable **local** JSON review | Case workflow, role-based access, evidence retention and integration |

The interface must state these boundaries where decisions are made. Do not use “real photo”, “camera-authenticated”, “anonymous to everyone”, or “on-chain” for the current browser result.

## 2. Goals & non-goals
**Goals**
- G1. A reporter seals a photo in **under 30 seconds** from shutter to "Sealed" (proof time permitting).
- G2. Anyone verifies a photo in **under 3 seconds**, with no account.
- G3. A public verifier cannot derive the signer from the seal record; measure and mitigate timing, network and enrollment correlations before production.
- G4. A seal requires an enrolled credential's verified approval of an exact fingerprint. Native capture attestation is a separate release gate.
- G5. **Zero crypto vocabulary** for reporters: no wallet, seed phrase or token.

**Non-goals (for now)**
- Judging whether a scene is *true* or *in context*. We prove capture, not truth.
- Detecting AI images by pixels. A browser passkey does not prove a real camera capture.
- Video and audio (Year 2).

## 3. Personas
| Persona | Context | Needs | Fears |
|---|---|---|---|
| **Asha**, stringer (primary) | Freelances for 3 outlets from a protest-heavy region; Android mid-range phone; patchy network | Get paid and believed; never be identified from her photos | Police or militia tracing photos back to her phone |
| **Daniel**, photo desk editor | Wire agency; 400 incoming images/day | Know fast whether an image is real and untouched; protect stringers | Publishing a fake; burning a source |
| **Meera**, fact-checker | Indian IFCN fact-checking org; IT Rules 2026 pressure | Prove a viral image is (or isn't) a real capture | Being wrong in public |
| **Sam**, pool admin | Security lead at a newsroom or NGO | Enroll and revoke devices; see pool health; control costs | A stolen phone sealing fakes; admin access becoming a deanonymisation tool |
| **Reader** | Anyone with a link | One-glance answer | Jargon |

## 4. Core concepts (product language)
- **Seal**: a record that a pool credential approved a specific file fingerprint with a stated capture time. Shown as an embossed guilloche seal, unique to the file, with a short Seal ID (e.g. `UF-7K3Q-9D2M`).
- **Pool**: a set of enrolled devices that share anonymity. Seals say "a device in *Independent Press Pool* (412 devices)". Bigger pools are safer.
- **Enrolled credential**: a passkey commitment added to a pool; browser passkeys may sync across devices.
- **Fingerprint**: SHA-256 of the exact image file.

## 5. Surfaces
1. **Capture** (mobile-first PWA → native apps): enroll, shoot, seal, history.
2. **Verify** (public web): drop a file / paste a link / open a Seal ID → result.
3. **Desk** (org console): pools, invites, enrollment approvals, revocation, usage.
4. **Ledger view** (inside Verify): "What the world sees / What stays private", side by side.
5. **API / SDK** (later): verify endpoint, badge embed, capture SDK.

## 6. User stories & acceptance criteria

### 6.1 Onboarding: reporter (Capture)
| ID | Story | Acceptance criteria |
|---|---|---|
| ON-1 | As Asha, I open an invite link and understand what Unforged does in one screen | One screen, ≤ 25 words, with an illustration: "Your photos get a seal. Nobody learns it was you." |
| ON-2 | I turn my phone into an enrolled device with Face ID / fingerprint | A WebAuthn passkey is created with `userVerification: required`. No email, password or wallet. Done in ≤ 2 taps |
| ON-3 | I see I'm waiting for approval, or approved | Status shows pool name and pool size. Push/poll when approved |
| ON-4 | I take a guided first photo and see my first Seal | Tutorial overlay on the shutter; the Seal screen explains the three facts the seal proves |
| ON-5 | I learn exactly what is and isn't hidden | "What's private" sheet: device, identity, key, GPS hidden. Fingerprint, time, pool public. Linked from every seal |

### 6.2 Capture & seal
| ID | Story | Acceptance criteria |
|---|---|---|
| CA-1 | I shoot inside the app | Camera-only capture (no gallery import). EXIF/GPS stripped before fingerprinting by default |
| CA-2 | I approve the seal with biometrics | The WebAuthn assertion signs challenge = H(domain, pool, fingerprint). UP and UV flags required |
| CA-3 | I watch progress, not a spinner | Staged progress: Fingerprinting → Chip signature → Building proof → Recording → Sealed, each with a short plain-language line |
| CA-4 | I share the photo with its Seal ID | Share sheet with the image + `unforged.app/s/<id>` link + optional visible corner stamp |
| CA-5 | Offline capture is queued | Signature taken immediately; proof and submission retried when online; the seal records the signing time window |
| CA-6 | I can't seal a gallery image or an AI image | Not offered in UI. If forced via a modified client, see THREAT-MODEL T3 (closed by native attestation, roadmap) |

### 6.3 Verify
| ID | Story | Acceptance criteria |
|---|---|---|
| VE-1 | As Daniel I drop an image and get an answer | Result in < 3 s. States: **SEALED** / **NO SEAL FOUND**. A sealed result also shows the pool epoch; if phones were removed since, it says "N phones removed from this pool since". Which phone sealed is unknowable by design |
| VE-2 | I understand what a seal proves | Show exact-file match, pool credential approval and stated time, next to explicit camera-origin and scene-truth limits |
| VE-3 | "No seal" isn't read as "fake" | Copy: "No seal found. This doesn't mean it's fake, only that it wasn't sealed with Unforged, or the file was changed." |
| VE-4 | I verify without trusting Unforged | "Check it yourself" panel: contract address, indexer query and CLI one-liner |
| VE-5 | Batch verify | Desk: drop up to 100 files; table of results (Wave 4) |
| VE-6 | I preserve a review record | Download a JSON summary that names the local runtime, checked fingerprint, pool state and unresolved claims; never present it as a portable network receipt |

### 6.5 Assurance exercises
| ID | Story | Acceptance criteria |
|---|---|---|
| AS-1 | As a security lead, I inspect a threat scenario | One focused case shows attempted action, contract or lookup boundary, consequence and observed result |
| AS-2 | I run all relevant checks | Eight cases run sequentially; prerequisites and anonymity-floor holds are reported as such, not counted as refusals |
| AS-3 | I understand the evidence scope | File mutation is labeled as a fingerprint lookup; seven other cases execute the compiled Compact contract locally |

### 6.4 Desk (pool admin)
| ID | Story | Acceptance criteria |
|---|---|---|
| DE-1 | Create a pool | Name, safety threshold (min devices before sealing is allowed, default 20), sponsorship on |
| DE-2 | Invite reporters | Link / QR, single-use, expiring |
| DE-3 | Approve enrollment | Approve adds the device commitment to the pool tree. The admin sees a device nickname chosen by the reporter, never a hardware ID |
| DE-4 | Revoke a stolen device | One action. Seals made after revocation fail. Earlier seals stay valid and record the pool epoch they were made in |
| DE-5 | See activity without deanonymising | Aggregate counts only (seals/day). **No per-device activity** |

## 7. Functional requirements: protocol
| ID | Requirement |
|---|---|
| P-1 | Device commitment = H("unforged:device:v1", pk.x, pk.y, salt). Only the commitment is public |
| P-2 | Seal proof checks: (a) commitment ∈ pool tree (historic root accepted), (b) WebAuthn P-256 signature over challenge = H("unforged:seal:v1", contract, fingerprint), (c) UP+UV flags, (d) fingerprint not already sealed |
| P-3 | Public outputs of a seal: fingerprint, seal time window, tree root used. **Never** the key, salt, path, signature or authenticator data |
| P-4 | Revocation resets accepted roots, so post-revocation proofs must use the new root |
| P-5 | Only the pool admin (proven by an admin secret in a witness) can enroll or revoke |
| P-6 | Domain separators on every hash. Every `disclose()` is listed in ARCHITECTURE §Privacy boundary |

## 8. Non-functional requirements
- **Privacy:** no analytics that tie seals to devices or IPs. Submissions go through a relay with jittered delay (Wave 3).
- **Performance:** verify < 3 s; proof generation measured and shown (target < 60 s on a mid-range phone with a remote prover, < 20 s on laptop; **ESTIMATE**).
- **Accessibility:** WCAG 2.2 AA; seal states never conveyed by colour alone.
- **Reliability:** offline queue; idempotent submit (fingerprint uniqueness).
- **Openness:** contracts and verifier open source (Apache-2.0); anyone can run Verify.

## 9. Metrics
| Metric | Why |
|---|---|
| Time-to-first-seal (invite → first seal) | Onboarding quality. Target < 3 min |
| Seals per active device per week | Real use |
| Verify lookups per seal | Seals actually get checked |
| Pool size (median, min) | Anonymity health |
| Proof time p50/p95 | UX feasibility |

## 10. Scope by wave
| Wave | In scope |
|---|---|
| **2 (Oct 19)** | Contract: enroll / revoke / seal with anonymous membership + in-circuit WebAuthn P-256. Simulator tests with real P-256 vectors and all refusals. Web demo: enroll a real passkey, capture with camera, seal, verify, ledger split view, attack buttons. All founding docs |
| **3 (Nov 16)** | Real network (local ledger-9 → Preprod when forked), PWA capture on phones, Desk v1, sponsored fees, relay, 1–3 design partners, proof-time measurements |
| **4+** | Native iOS/Android with App Attest / Key Attestation, C2PA bridge, coarse-location disclosure, VerITAS-style edit proofs, Verify API + badge, insurer pilot |

## 11. Open questions
1. Minimum safe pool size? (Ask partners; default 20.)
2. Sealing with synced passkeys (iCloud Keychain) vs device-bound keys? See THREAT-MODEL T6.
3. Should reporters be able to *claim* a seal later (prove authorship to get paid)? Likely yes, Wave 4.
