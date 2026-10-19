# Unforged — Product requirements

| | |
|---|---|
| Status | v0.3 — Wave 2 foundation and global platform direction |
| Date | 19 October 2026 |
| Owner | bunnyy |
| Related | [Vision](VISION.md) · [Architecture](ARCHITECTURE.md) · [Threat model](THREAT-MODEL.md) · [Design](DESIGN.md) · [Business](BUSINESS.md) · [Roadmap](ROADMAP.md) |

## 1. Product definition

Unforged is privacy-preserving trust infrastructure for digital evidence. It proves that an exact asset was approved by an authorized credential in an organizational pool without publishing which contributor or device approved it.

The production platform combines:

- hardware-backed capture and C2PA provenance;
- private authorization and policy proofs on Midnight;
- editorial evidence cases and review decisions;
- independent public verification;
- trust-pool administration, revocation and incident response;
- privacy-preserving relay and submission infrastructure.

## 2. Problem

Newsrooms and evidence organizations need provenance, but signer identity, device information, location and activity can endanger contributors. Public signatures create durable identity graphs. Centralized verification services can observe the signer-to-asset relationship. Existing workflows also blur cryptographic facts with human judgments about scene truth and context.

Unforged creates a narrow, independently verifiable authorization claim while keeping the signer private.

## 3. Current assurance and release gates

| Capability | Wave 2 evidence | Production requirement |
|---|---|---|
| Private pool membership | Compiled Compact contract and local runtime | Public deployment and independent indexer reads |
| Credential approval | Real P-256 WebAuthn profile with UP+UV | Device-bound key and supported recovery policy |
| File integrity | Exact SHA-256 byte match | C2PA hard binding, external manifest and soft-binding recovery |
| Camera origin | Not established by browser capture | Native capture with hardware/application attestation |
| Signer privacy in record | Signer omitted and ledger indistinguishability tested | Relay, batching, coarse timing and operational privacy audit |
| Revocation | Contract epoch reset and local admin flow | Threshold administration, durable audit and incident process |
| Editorial workflow | Local verification and review JSON | Persistent cases, roles, approvals, retention and integrations |
| Reliability | Deterministic simulator and CI | Queue recovery, network tests, monitoring, backup and SLOs |

## 4. Goals

### Wave 2

- G1. Demonstrate anonymous credential membership and P-256 WebAuthn verification in one Compact seal circuit.
- G2. Let a judge complete enroll → capture → seal → verify without crypto vocabulary.
- G3. Make public and private fields visible at the decision point.
- G4. Demonstrate every refusal through tests and a browser Threat Lab.
- G5. State local-runtime, camera-origin and operational privacy limits consistently.

### Product

- G6. Contributor invite to first protected capture in under three minutes.
- G7. Verification result in under three seconds, excluding external-network delay.
- G8. No wallet, seed phrase or token handling for contributors.
- G9. C2PA-compatible provenance and edit history.
- G10. Source privacy resilient to contract, network, timing and administrative correlation.
- G11. Independent verification without uploading media to Unforged.
- G12. Enterprise reliability, self-hosting and incident response.

## 5. Non-goals

- Declaring that a depicted scene is true or correctly contextualized.
- Pixel-based “AI detection” as a source of truth.
- Claiming browser WebAuthn proves camera sensor origin.
- Publishing contributor identity or per-device activity.
- Replacing C2PA with a proprietary provenance format.
- Requiring contributors to understand blockchain mechanics.

## 6. Personas

| Persona | Need | Primary fear |
|---|---|---|
| Asha, field contributor | Submit credible evidence and remain safe | Being identified from provenance or network metadata |
| Daniel, photo editor | Make fast, bounded publication decisions | Publishing manipulated or misrepresented media |
| Meera, verifier | Reproduce evidence checks independently | Relying on an opaque vendor result |
| Sam, security administrator | Manage eligibility, incidents and cost | Creating a source-activity database |
| Reader or partner | Understand provenance at a glance | Mistaking a badge for scene truth |
| Developer/OEM | Integrate capture and verification | Proprietary lock-in and unstable semantics |

## 7. Product surfaces

### Capture

Invite, device enrollment, policy status, camera, offline queue, sealing progress, evidence receipt and secure sharing.

### Evidence Desk

Submission inbox, assurance summary, provenance chain, editorial checklist, disclosure requests, decision log and publication package.

### Trust Pools

Organizations, pool policy, invites, approvals, threshold administration, credential lifecycle, anonymity health and aggregate operations.

### Verify

File/link/manifest input, result summary, assurance level, public/private boundary, provenance history, revocation state and independent instructions.

### Threat and Incident Console

Repeatable adversarial exercises, observed refusals, compromised-credential response, policy holds and audit evidence.

### Platform

Capture SDK, Verify API, CMS plugin, CLI, C2PA bridge, self-hosting controls and OEM integration.

## 8. Wave 2 user stories and acceptance criteria

### Enrollment

| ID | Story | Acceptance criteria |
|---|---|---|
| EN-1 | As a judge, I understand the privacy promise before enrollment | One screen explains what becomes public and what remains private |
| EN-2 | I enroll a real passkey | `userVerification: required`; no email, wallet or seed phrase |
| EN-3 | I can evaluate on hardware without a camera/passkey | Simulated credential is clearly labeled and executes the same contract path |
| EN-4 | I understand pool safety | Pool size and anonymity floor are visible before sealing |

### Capture and seal

| ID | Story | Acceptance criteria |
|---|---|---|
| CA-1 | I capture or generate an evaluation frame | Camera path is offered; test frame is explicitly labeled |
| CA-2 | I approve exact bytes | WebAuthn or test signer signs a domain-bound fingerprint challenge |
| CA-3 | I see real progress | Fingerprint, signature, proof and record stages show measured durations where available |
| CA-4 | I receive a bounded result | Result states exact-file approval and signer omission; no camera-origin claim |
| CA-5 | Failure is recoverable | Cancellation and every contract refusal explain what happened and next action |

### Verify

| ID | Story | Acceptance criteria |
|---|---|---|
| VE-1 | I verify without an account | Drop one file and receive sealed/no-seal result |
| VE-2 | I understand the result | Established facts and unresolved claims are shown side by side |
| VE-3 | No seal is neutral | Copy states that absence does not prove fabrication |
| VE-4 | I inspect privacy | Public record and withheld witness fields are separated |
| VE-5 | I preserve a review | Export names local runtime and unresolved claims; never claims public inclusion |

### Assurance

| ID | Story | Acceptance criteria |
|---|---|---|
| AS-1 | I challenge a security boundary | Each case names attempt, boundary, consequence and observed result |
| AS-2 | I run the suite | Ten cases run sequentially; prerequisites and holds are not counted as passes |
| AS-3 | I distinguish evidence types | Changed-file lookup is separate from nine Compact-circuit cases |

### Pool administration

| ID | Story | Acceptance criteria |
|---|---|---|
| PO-1 | I see aggregate pool state | Size, floor, seals and epoch are visible |
| PO-2 | I revoke a test credential | New seals fail; earlier seals remain valid under their recorded epoch |
| PO-3 | The interface resists deanonymization | No per-device seal history exists |
| PO-4 | Pool floor protects members | Revocation is held when it would violate the configured floor |

### Wave 2 implementation status — 19 October 2026

All acceptance criteria above are represented in the current local evaluation interface. The tested primary path is evaluation enrollment → generated test frame → domain-bound approval → Compact seal → exact-file verification. Capture, Verification, Assurance and Trust Pool share one evidence-operations shell and consistently label the runtime as local.

Added the same day as the first platform release: an Evidence Desk (case queue, evidence matrix, editorial checklist, hold reasons, decision log, publication package); an eight-row Verify security report with the L0–L5 ladder; a draft C2PA `org.unforged.authorization` assertion and offline CLI verifier; a local relay that batches, shuffles and coarsens capture time; and threshold enrollment, where k anonymous approvers must approve a credential inside the circuit.

The implementation remains pre-production. Public network inclusion, durable records, hardware camera attestation, independent relays over anonymizing transport, multi-user roles, monitoring and signed C2PA manifests remain gated to later phases.

## 9. Protocol requirements

| ID | Requirement |
|---|---|
| P-1 | Device commitment is domain-separated over P-256 point and random salt |
| P-2 | Seal verifies current/historic accepted membership according to epoch policy |
| P-3 | Seal verifies a domain-bound P-256 WebAuthn assertion over the exact fingerprint |
| P-4 | User presence and user verification flags are mandatory |
| P-5 | Fingerprint uniqueness and a 24-hour stated-time window are enforced |
| P-6 | Pool must meet the anonymity floor |
| P-7 | Enrollment and revocation require the private admin witness |
| P-8 | Revocation resets accepted roots for future seals |
| P-9 | Every disclosure appears in Architecture § Privacy boundary |
| P-10 | Error codes remain stable UPPER_SNAKE identifiers mapped to product copy |

## 10. Production platform requirements

### Capture and provenance

- Native iOS and Android capture.
- Device-bound hardware key and app attestation.
- C2PA manifest creation, validation and preservation.
- Metadata minimization policy.
- External manifest and soft-binding recovery.
- Encrypted offline queue and secure deletion.
- Assurance level attached to every result.

### Privacy and policy

- Relay, batching and timing-correlation controls.
- Threshold pool administration.
- Role and assignment eligibility proofs.
- Organization-controlled retention.
- Disclosure requests with purpose, scope, approval and audit.
- No source-linked product analytics.

### Reliability

- Idempotent submission.
- Durable job stages and replay-safe retries.
- Multi-region verification reads.
- Backup and disaster recovery.
- Privacy-safe telemetry and SLOs.
- External security review and responsible disclosure.

### Integrations

- Verify API and JavaScript SDK.
- CMS/DAM plugin.
- CLI verifier.
- Webhook for case state, with no sensitive witness material.
- Self-hosted enterprise deployment.
- OEM capture SDK/profile.

## 11. UX requirements

- Each screen has one primary decision.
- Working content uses the available canvas with a 12-column desktop grid and aligned rails.
- Evidence is summarized before technical detail.
- Paragraphs are limited to explanation states; operations use tables, rows, metrics and progressive disclosure.
- All statuses combine text, icon and color.
- Full keyboard flow for enrollment, Verify, Threat Lab and Pool.
- WCAG 2.2 AA target.
- Reduced-motion behavior for every animation.
- Responsive capture for narrow phones and evidence workspaces for wide screens.
- Empty, loading, offline, error, success, stale and revoked states are designed explicitly.

## 12. Metrics

| Metric | Reason | Target status |
|---|---|---|
| Invite-to-first-seal | Onboarding quality | <3 minutes; unmeasured |
| Capture-to-seal time | Field usability | <30 seconds plus proving; unmeasured on network |
| Verification p50/p95 | Desk and public utility | <1s/<3s local target |
| Proof success and duration | Technical viability | Measure Wave 3 |
| Weekly seals per active contributor | Real adoption | Pilot metric |
| Verifications per published seal | Public utility | Pilot metric |
| Pool size and floor violations | Anonymity health | Required operational metric |
| Review time and override rate | Editorial value and trust | Pilot metric |
| Privacy/security incidents | Safety | Zero unresolved critical findings before production |
| Pilot-to-paid conversion | Business viability | At least one first-year contract |

## 13. Scope by phase

| Phase | In scope | Exit criteria |
|---|---|---|
| Wave 2 | Compact protocol, simulator tests, local end-to-end browser evaluation, threat exercises and complete evidence docs | CI green, clean judge walkthrough, all limits visible |
| Wave 3 | Real ledger-9 proofs, public deployment when compatible, independent indexer, persistence, relay, C2PA adapter, partner discovery | Reproducible transactions, measured performance, 1–3 design partners |
| Pilot | Native Android capture, hardware attestation, CMS integration, roles, incident controls and external review | Real controlled usage and paid-pilot path |
| Platform | iOS/OEM support, Verify API, self-hosting, soft binding, video/audio and multi-vertical policy | Repeatable enterprise deployment and platform distribution |

## 14. Open decisions

1. Minimum anonymity floor by use case and threat level.
2. Whether synced passkeys are permitted at L1 or excluded from production pools.
3. C2PA assertion/reference profile for private authorization proofs.
4. Prover ownership and witness-minimization design.
5. Coarse time-window policy that balances verification and correlation.
6. Data retention and legal response by deployment jurisdiction.
7. Duress behavior and whether it can be implemented without creating new risk.
