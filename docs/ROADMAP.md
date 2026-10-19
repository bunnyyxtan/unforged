# Unforged — Roadmap

The roadmap advances through evidence gates. Dates define build windows; capabilities count only when code, tests and review evidence exist.

## Wave plan

| Phase | Window | Deliverables | Exit evidence |
|---|---|---|---|
| **Wave 2 — Private authorization primitive** | Through 19 Oct 2026 | Compact enroll/revoke/seal; anonymous Merkle membership; in-circuit WebAuthn P-256; local React workflow; eight-case Threat Lab; product, security and business documentation | CI compiles; 26 tests pass; judge completes enroll → seal → verify → attacks; limits visible |
| **Wave 3 — Operational evidence system** | 27 Oct–16 Nov 2026 | Real ledger-9 proofs; public deployment when supported; independent indexer verification; persistence; sponsored fees; relay prototype; C2PA adapter; Evidence Desk foundation; partner discovery | Reproducible transaction evidence; measured proof/verify times; 1–3 design partners or documented interviews |
| **Controlled pilot** | Q1–Q2 2027 | Native Android capture; device/app attestation; threshold administration; CMS/DAM integration; encrypted cases; incident runbooks; external security review | Real low-risk use, zero unresolved critical findings, paid-pilot path |
| **Commercial v1** | H2 2027 | iOS, self-hosting, Verify API/SDK, soft-binding recovery, SLOs, support and billing | First annual contracts, repeatable deployment and renewal signal |
| **Platform expansion** | 2028+ | OEM capture integration, video/audio, legal/insurance policy packs, global verification network | Multi-vertical revenue and platform distribution |

## Wave 2 completion checklist

- [x] Compact 0.35.0 contract with private witnesses.
- [x] P-256 WebAuthn verification inside the seal circuit.
- [x] Anonymous HistoricMerkleTree membership.
- [x] Enrollment, revocation, time, uniqueness and anonymity-floor controls.
- [x] Real P-256 simulator fixtures and refusal tests.
- [x] Browser capture/test frame, seal, verify, Threat Lab and pool administration.
- [x] Local review export with explicit assurance boundaries.
- [x] CI compilation, tests, typecheck and production web build.
- [ ] Final submission video recorded from submitted commit.
- [ ] Deck updated with final interface and measured local timings.
- [ ] GitHub repository public with `midnightntwrk` topic.

## Wave 3 workstreams

### Network and protocol

- Deploy against compatible ledger-9 infrastructure.
- Publish contract address, transactions, blocks and independent verifier commands.
- Add network integration tests and durable receipt format.
- Measure proof size, time, failure and sponsorship cost.

### Product

- Persistent evidence cases and session recovery.
- Evidence Desk queue, review matrix and decision log.
- Public seal pages and independent verifier.
- Organization, role and approval model.

### Privacy and security

- Stateless relay with batching and timing controls.
- Multi-admin policy design.
- Witness exposure analysis for prover choices.
- Metadata minimization and C2PA threat review.
- External review plan and responsible-disclosure policy.

### Market

- 15–20 structured interviews.
- 3–5 candidate design partners.
- One mapped workflow and pilot plan.
- Pricing and procurement interviews.

## Platform milestones

| Milestone | Capability | Gate |
|---|---|---|
| Native assurance L2/L3 | Device-bound hardware key and verified application | Attestation tests and device matrix |
| Source-safe C2PA bridge | Provenance plus private organization authorization | Interoperability tests and standards review |
| Operational anonymity | Relay, batching, coarse windows and audit | Correlation red team |
| Enterprise administration | Threshold roles, recovery, retention and audit | Security review and recovery exercise |
| Independent verification | Web, CLI, API and CMS SDK | Cross-implementation test vectors |
| Commercial reliability | SLOs, backups, incident response and support | Pilot reliability report |

## Dependencies

| Dependency | Owner | Fallback / decision |
|---|---|---|
| Ledger 9 on public Midnight environments | Midnight | Run and document local ledger-9 proofs; never label them public |
| Mobile/on-device proving performance | Midnight and Unforged | Use organization-controlled prover with explicit witness-risk model |
| Directed disclosure/viewing keys | Midnight roadmap | Keep disclosure outside the contract until capability is production-ready |
| Device attestation APIs | Apple/Google/OEMs | Publish supported-device assurance matrix |
| C2PA profile acceptance | Standards ecosystem | Start with interoperable custom assertion/reference and public test vectors |

## Stop/go criteria

The company should pause market expansion if any of these remain unresolved:

- hardware capture cannot provide a truthful assurance improvement;
- network metadata makes source correlation practical;
- editors cannot understand the claim boundary;
- proof cost or latency prevents field use;
- no design partner identifies an urgent workflow;
- C2PA interoperability requires proprietary validation.
