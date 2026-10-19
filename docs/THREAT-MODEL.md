# Unforged — Threat model

## Security objective

An authorized organization should be able to verify that an eligible credential approved a specific asset while a public observer cannot identify the credential from the seal record. The system must communicate the limits of that claim and resist correlation through contract state, capture software, networks and administration.

## Assets

- Contributor identity and organizational relationship.
- Signer-to-asset relationship.
- Credential private key, salt, commitment index and membership path.
- Original media, unpublished evidence and sensitive metadata.
- Pool administrator authority.
- Integrity and availability of seal and revocation records.
- Editorial decisions and disclosure records.

## Adversaries

| ID | Adversary | Capability |
|---|---|---|
| A1 | Public ledger observer | Reads all state and correlates fingerprints, timestamps and pool changes |
| A2 | Malicious submitter | Controls a browser/client, file bytes and software signer |
| A3 | Network observer | Sees IP addresses, timing, traffic size and infrastructure endpoints |
| A4 | Compromised pool operator | Sees enrollment and organizational systems and may collude with verifiers |
| A5 | Device thief or malware | Controls a device or client after enrollment |
| A6 | Malicious verifier/editor | Uploads probes, pressures disclosure or misstates assurance |
| A7 | Infrastructure attacker | Targets relay, prover, indexer, storage or deployment pipeline |
| A8 | Supply-chain attacker | Compromises dependencies, generated code, CI or signing artifacts |

## Threat register

| ID | Threat | Current mitigation | Residual risk / release gate | Status |
|---|---|---|---|---|
| T1 | Ledger reveals which credential sealed an asset | Contract discloses only opaque commitments and membership result; key, salt, path and signature remain witnesses | Timing and small-pool correlation remain | Implemented and tested |
| T2 | Altered bytes inherit a seal | SHA-256 exact-byte binding and signature challenge | Re-encoding produces no match even when content is visually related; C2PA/soft binding needed | Implemented and tested |
| T3 | Modified client seals generated or imported content as camera capture | UI restricts intended flow and labels browser assurance | Browser WebAuthn does not attest sensor origin; native application and hardware attestation required | Open production blocker |
| T4 | Signature is transplanted to another asset or pool | Domain-bound challenge includes contract context and fingerprint | Verify final compiled profile and deployment configuration | Implemented and tested |
| T5 | Duplicate or replay creates conflicting provenance | Fingerprint uniqueness enforced by contract | Derivative files require provenance-chain handling | Implemented and tested |
| T6 | Stolen device continues sealing | User verification required; admin can revoke and reset accepted roots | Biometrics/PIN can be coerced or compromised; incident latency matters | Contract path tested |
| T7 | Synced passkey is treated as one physical camera | UI and docs call it an enrolled credential | Device-bound native keys and attestation required for device claims | Open production blocker |
| T8 | Remote prover learns credential witnesses | Wave 2 proves locally in simulator | Pool-controlled/self-hosted proving, witness minimization and on-device proving required | Open design gate |
| T9 | IP and timing reveal the contributor | No public network submission in Wave 2; local relay batches three submissions, shuffles order and publishes capture time to the hour | Relay, batching, jitter, coarse windows, no logs and correlation testing required | Open production blocker |
| T10 | Enrollment admin maps every contributor and later correlates activity | Public seal omits member identifier; no per-device activity UI | Organizational separation of duties, threshold administration and privacy audit required | Partially mitigated |
| T11 | Small pool makes anonymity meaningless | Contract enforces minimum pool size | Pool composition and external context still reduce anonymity | Implemented; threshold needs partner validation |
| T12 | Malicious admin enrolls unauthorized credentials | k-of-n anonymous approver threshold enforced in circuit; owner cannot bypass (`APPROVAL_REQUIRED`); per-credential nullifiers stop double approval (`ALREADY_APPROVED`) | Multi-admin approvals, auditable enrollment policy and recovery required | Single-admin Wave 2 limitation |
| T13 | Revocation history invalidates legitimate old seals | Seal stores epoch/root context; prior seals remain readable | Public verifier and retention policy must preserve historical verification | Implemented locally |
| T14 | Media metadata exposes source despite private seal | Product does not publish GPS/device identity | Browser capture and downloads need verified stripping policy; C2PA assertions require review | Open production blocker |
| T15 | Verifier presents “sealed” as scene truth | UI separates established facts and unresolved claims | Training, API semantics and third-party embeds can still overstate | Product control implemented; governance needed |
| T16 | Uploaded verification probes identify private assets | Current verifier processes local files in-browser | Hosted API must avoid retaining fingerprints/files and add abuse controls | Local flow safe by design |
| T17 | Relay/prover/indexer outage loses evidence | Local build has no durable queue | Encrypted offline queue, idempotent jobs, retries, backup and recovery tests | Open reliability blocker |
| T18 | Dependency or CI compromise changes proof behavior | Versions pinned; CI compiles and tests; code open for review | Lockfile review, provenance, signed releases, dependency policy and independent audit | Partial |
| T19 | C2PA metadata is stripped or asset is re-encoded | Exact-file lookup fails safely | External manifests, soft bindings and optional watermarking required | Planned |
| T20 | Coercion forces contributor disclosure or approval | Public record omits identity | Duress design, legal policy and operational response require expert review | Research |

## Abuse cases shown in the product

The Threat Lab exercises ten reviewable scenarios:

1. one decoded pixel changes and exact-file lookup returns `NO_SEAL`;
2. an unregistered signer receives `NOT_ENROLLED`;
3. a signature moved to another fingerprint receives `BAD_SIGNATURE`;
4. a duplicate fingerprint receives `ALREADY_SEALED`;
5. a stale timestamp receives `BAD_TIME`;
6. missing user verification is refused;
7. a look-alike origin fails WebAuthn binding;
8. the pool owner enrolling without approvers receives `APPROVAL_REQUIRED`;
9. one approver approving the same credential twice receives `ALREADY_APPROVED`;
10. a revoked credential cannot use old membership.

The changed-file case is a file lookup, not a Compact refusal. A held revocation at the anonymity floor is reported as a policy hold, not a security pass.

## Production security gates

Unforged cannot claim production source protection until all of the following are complete:

- public-network proof and independent indexer verification;
- native capture with hardware and application attestation;
- source-safe C2PA profile and metadata review;
- relay and correlation-resistance testing;
- threshold administration and recovery;
- encrypted persistent storage with retention controls;
- privacy-preserving observability and incident response;
- external cryptographic and application security review;
- representative adversarial pilot with journalists or investigators;
- documented key loss, device seizure and coercion procedures.

## Security test policy

- Use real P-256 keys and WebAuthn-shaped assertions.
- Test every refusal code directly.
- Keep private/public ledger indistinguishability checks.
- Treat error and unavailable states separately from refusals.
- Add a regression test for every confirmed security defect.
- Preserve exact toolchain versions and generated-code provenance.
- Never weaken the anonymity floor to make a demo pass.

## Residual-risk statement

The current build proves approval of exact bytes by an enrolled credential inside a local Compact runtime. It does not prove camera sensor origin, scene truth, public-network inclusion or anonymity against network and enrollment correlation. A seal is one evidence signal inside a broader editorial and operational process.
