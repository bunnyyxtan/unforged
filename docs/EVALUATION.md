# Unforged — Buildathon evaluation evidence

This file maps the repository to the official judging rubric. **Target** describes the standard we are building toward. **Current evidence** names only artifacts that exist in this repository or a linked CI run. Planned work is never counted as delivered.

## Score strategy

| Criterion | Weight | 100-point target | Current evidence | Remaining gate |
|---|---:|---|---|---|
| Engineering & Implementation | 40 | Compiling Compact contract, meaningful private state, explicit dual-ledger boundary, complete end-to-end integration and reproducible setup | Compact 0.35 contract; private witnesses; anonymous Merkle membership; in-circuit P-256 WebAuthn; k-of-n anonymous approver enrollment with nullifiers; enroll/approve/revoke/seal; generated runtime used by React app; CI compile | Public ledger-9 deployment and independent indexer verification when supported |
| Quality Assurance & Reliability | 15 | Happy path and every refusal tested with realistic crypto; deterministic CI; operational errors represented honestly | 34 simulator tests; real P-256 vectors; approver indistinguishability; ten-case browser Threat Lab; typecheck and build in CI | Network integration suite, persistence/recovery tests, performance measurements and external security review |
| Product & Vision | 15 | Clear global problem, Midnight-native advantage, credible scope and staged expansion | Source-safe evidence thesis; C2PA privacy-layer strategy; defined personas, assurance ladder, release gates and multi-wave roadmap | Customer interviews, design partners and measured demand |
| User Experience & Design | 15 | Intuitive end-to-end workflow connected to the contract, responsive and accessible | Unified evidence-operations shell; staged passkey/test enrollment; capture; measured sealing; Evidence Desk case workflow; eight-row security report with L0–L5 ladder; relay release log; draft C2PA assertion export; threat console; aggregate pool controls; dark/paper themes | Complete newsroom case workflow, formal accessibility audit, full breakpoint matrix and production usability testing |
| Communication | 10 | Concise deck and video showing problem, proof, failure paths, limits and roadmap | Deck PDF, deck outline, README architecture and evidence map | Record final video against clean build; update deck with current screenshots and measured timings |
| Business Development & Viability | 5 | Specific buyer, urgent workflow, pricing hypothesis, adoption path and defensible platform expansion | Beachhead, buyer map, business model, competitive position, pilot plan and success metrics | Partner conversations, LOI or pilot agreement and validated pricing |

## Engineering evidence

### Contract

- [`contract/src/unforged.compact`](../contract/src/unforged.compact)
- [`contract/src/witnesses.ts`](../contract/src/witnesses.ts)
- Compact 0.35.0 with `--feature-zkir-v3`
- `@midnight-ntwrk/compact-runtime` 0.20.0
- Historic Merkle membership for opaque credential commitments
- P-256 signature verification inside the circuit
- Domain-separated commitments and challenges
- Admin authorization held as a private witness
- Revocation invalidates old roots for future seals
- Explicit minimum pool size and time-window checks

### Dual-ledger understanding

The public ledger stores commitments, pool size, epoch and seal facts. Private witnesses hold credential material, signatures and membership paths. The complete disclosure inventory is maintained in [Architecture § Privacy boundary](ARCHITECTURE.md#privacy-boundary). Adding a disclosure requires updating that table in the same change.

### Product integration

The React application imports generated contract code and executes the same circuits represented in the tests. The UI distinguishes local runtime execution from a public Midnight transaction.

The live browser journey was exercised on commit `475abca`: enroll an evaluation credential, generate a camera-free test frame, seal it through the compiled contract runtime, open Verification, and resolve the original bytes to a sealed result. The workspace reported eight pool credentials after enrollment and preserved the explicit local-runtime boundary throughout.

## QA evidence

The suite follows three rules:

1. each circuit has a successful path;
2. each refusal code has a dedicated test;
3. signature tests use real keys and real WebAuthn-shaped assertions.

Current contract refusal families:

| Boundary | Expected result |
|---|---|
| Non-admin enrollment or revocation | `NOT_ADMIN` |
| Credential outside the pool | `NOT_ENROLLED` |
| Signature transplanted to another fingerprint | `BAD_SIGNATURE` |
| Duplicate fingerprint | `ALREADY_SEALED` |
| Missing user verification | WebAuthn refusal |
| Wrong origin or RP binding | `BAD_SIGNATURE` |
| Stale stated time | `BAD_TIME` |
| Post-revocation membership | `NOT_ENROLLED` |
| Pool below anonymity threshold | `POOL_TOO_SMALL` |
| Owner enrolls without approvers | `APPROVAL_REQUIRED` |
| One approver approves twice | `ALREADY_APPROVED` |
| Secret outside the approver set | `NOT_APPROVER` |
| Approval on a pool without a threshold | `NO_APPROVAL_POLICY` |

The browser Threat Lab labels changed-file lookup separately from the nine contract-circuit exercises. An unmet prerequisite is reported as incomplete, never as a passed refusal.

## Product demonstration

The strongest judge path is a single high-stakes story:

1. enroll a credential into the Independent Press Pool;
2. create a test capture on a computer without a camera;
3. approve and seal the exact bytes;
4. verify the original and inspect the public/private boundary;
5. open the case in the Desk, complete the checklist, approve and publish;
6. change one pixel and observe `NO_SEAL`;
7. run all ten scenarios, including owner bypass and double approval;
8. show the relay batch and that the record identifies the pool while withholding the credential;
9. state the browser and local-network limitations before showing the production roadmap.

## Wave 2 interface evidence

| Area | Delivered evidence |
|---|---|
| Information architecture | Persistent workflow rail: Capture → Verification → Assurance → Trust pool |
| Enrollment | Recommended passkey route and clearly subordinate L0 evaluation credential route |
| Evidence review | Separate input and output zones, exact-file pipeline, established/unresolved boundary and local review export |
| Evidence review | Desk cases with evidence matrix, checklist-gated approval, hold reasons, decision log and publication package |
| Source privacy operations | Relay release log: batches of three, shuffled order, hour-window capture time |
| Interoperability | Draft `org.unforged.authorization` C2PA assertion; offline CLI verifier with fixture |
| Adversarial proof | Ten threat files with run state, method, protected boundary, consequence and observed code |
| Administration | Aggregate pool metrics, anonymity floor, opaque commitments and guarded revocation |
| Visual system | Responsive full-width canvas, structured metrics/tables, darkroom and paper themes, reduced-motion handling |

Verification completed locally and in CI:

- production web build passed;
- contract simulator suite passed 34/34;
- [CI run 39230865320](https://github.com/bunnyyxtan/unforgedds/actions/runs/39230865320) compiled the threshold contract and passed all tests on commit `4b2f98b`.

## Submission checklist

- [ ] Public GitHub repository
- [x] Apache-2.0 license
- [x] `midnightntwrk` GitHub topic
- [ ] CI badge green on submitted commit
- [x] Compact source and generated-code workflow documented
- [ ] README setup succeeds from a clean checkout
- [x] Slide deck matches the submitted product
- [ ] Video uses the submitted commit and shows real interactions
- [ ] AKINDO progress statement names work completed in this Wave
- [ ] Contract address and explorer links included only when a real deployment exists
- [ ] Known limitations stated in the app, README, deck and video

## Definition of a 100-point submission

A perfect target means the judges can reproduce the engineering, understand every privacy boundary, complete the product flow without assistance, observe meaningful refusals, follow a realistic adoption plan and distinguish shipped evidence from future ambition. Documentation supports that result; passing code, a functional product, a clear demonstration and credible external validation must complete it.
