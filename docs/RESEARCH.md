# Unforged — Market and technical research

Last reviewed: 19 October 2026. Sources are labeled by strength. Product claims rely on primary standards, vendor documentation and repository evidence where possible. Market hypotheses require interviews.

## 1. Problem evidence

### Contributor risk

| Finding | Source quality | Source |
|---|---|---|
| CPJ counted 330 journalists imprisoned at the end of 2025; more than 300 had been imprisoned for five consecutive years | Primary NGO dataset | [CPJ 2025 prison census](https://cpj.org/special-reports/2025-journalist-jailings-remain-stubbornly-high-harsh-prison-conditions-pervasive/) |
| CPJ recorded 129 journalists and media workers killed in 2025, its highest annual total | Primary NGO report | [CPJ 2025 killings report](https://cpj.org/2026/02/record-number-of-journalists-killed-in-2025-israel-responsible-for-two-thirds-of-deaths/) |
| C2PA explicitly treats privacy, harms, human rights and creator control as design goals | Primary standard | [C2PA specification](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) |

These facts establish that source and contributor safety are serious. They do not prove that newsrooms will purchase Unforged; interviews and pilots must validate workflow and budget.

### Provenance pressure

C2PA describes provenance as a way to preserve source and edit history through cryptographically bound manifests. Its standard deliberately avoids deciding whether content is “good,” “bad,” or contextually true. That supports Unforged’s product language: verify narrow facts and leave scene truth to editorial review.

Primary references:

- [C2PA specifications](https://spec.c2pa.org/specifications/)
- [C2PA security considerations](https://spec.c2pa.org/specifications/specifications/1.4/security/Security_Considerations.html)
- [C2PA UX guidance](https://spec.c2pa.org/specifications/specifications/1.4/ux/UX_Recommendations.html)

## 2. Standards landscape

### C2PA

C2PA 2.x provides:

- signed manifests and claims;
- hard bindings to asset bytes;
- ingredient and edit history;
- trusted signer certificates and trust lists;
- timestamp and revocation information;
- external manifests;
- soft-binding mechanisms for recovery after metadata loss;
- guidance for security, privacy, harms and user experience.

The fundamental trust model is still associated with a signer credential. Unforged’s research question is whether organizational authority can be proved privately while preserving C2PA compatibility and understandable trust semantics.

### Identity

C2PA’s current recommendation directs human and organizational identity assertions toward CAWG profiles while its claim-signature mechanism focuses on generator products such as hardware, applications and services. Unforged must not invent an identity claim that conflicts with these profiles. See [C2PA Human and Organizational Identity Recommendation](https://spec.c2pa.org/specifications/specifications/2.4/identity/identity.html).

## 3. Hardware and vendor landscape

Sony’s Camera Authenticity Solution demonstrates an end-to-end commercial direction: hardware camera signatures, C2PA edit history, server time, image validation, reports and newsroom workflows. Sony also uses 3D depth information on supported equipment to strengthen real-scene evidence. [Sony Camera Authenticity Solution](https://authenticity.sony.net/camera/)

Implications:

- hardware capture assurance is becoming a real product category;
- camera-origin evidence is stronger than browser passkey approval;
- vendor-specific systems create an interoperability opportunity;
- Unforged must complement hardware evidence with private organization authorization;
- the verifier needs an assurance ladder rather than one universal “sealed” state.

Additional ecosystem claims from secondary trackers, such as exact supported-device counts, should be revalidated against each manufacturer before publication.

## 4. Midnight technical fit

| Requirement | Midnight capability | Current repository evidence |
|---|---|---|
| Hide credential and membership witness | Private witness data and Compact circuits | Key, salt, signature and Merkle path remain private |
| Publish narrow result | Explicit disclosures and public ledger state | Fingerprint, time and epoch only |
| Verify passkey curve | Compact 0.35 ZKIR v3 P-256 primitive | `secp256r1EcdsaVerify` used in compiled contract |
| Prove set membership | Historic Merkle tree | Enrolled commitment membership and revocation |
| Publicly inspect policy state | Ledger commitments, count and epoch | Local runtime now; public deployment pending compatible network |
| TypeScript product integration | Compact generated TypeScript/runtime | React app executes generated circuits |

Midnight’s current roadmap includes enterprise keys, verifiable-credential/selective-disclosure tooling and further proof capabilities. Roadmap items are dependencies, not shipped Unforged functionality. [Midnight roadmap](https://midnight.network/roadmap)

## 5. Competitive landscape

| Category | Representative direction | Strength | Unforged opportunity |
|---|---|---|---|
| Open provenance standard | C2PA / Content Credentials | Interoperability and industry adoption | Add private organizational authorization |
| Camera authenticity | Sony and other OEM capture programs | Hardware and sensor evidence | Vendor-neutral pool policy and source privacy |
| Centralized authenticity services | Managed validation/report vendors | Operational convenience | Independent verification and reduced operator knowledge |
| Public registries | Blockchain hash/signature records | Durable public data | Prevent signer activity graphs through ZK membership |
| Anonymous submission | Secure drop and whistleblower tools | Source confidentiality | Add public evidence authorization and provenance chain |
| Pixel classifiers | AI/deepfake detection | Broad input compatibility | Avoid probabilistic “truth”; prove workflow facts |

Unforged is strongest as connective infrastructure across C2PA, hardware and organizational policy. A standalone photo hash registry would be easy to copy and too fragile for global use.

## 6. Technical research questions

1. How should a Midnight authorization proof be referenced from a C2PA manifest without creating a proprietary validator dependency?
2. Can a pool or organization sign a C2PA claim after verifying a private proof without learning contributor identity or submission timing?
3. Which mobile attestation primitives provide device-bound assurance without introducing persistent public identifiers?
4. How much correlation remains after batching, relay and coarse time windows?
5. Can soft bindings recover provenance after platform re-encoding without enabling abusive global image tracking?
6. What is the practical proof latency and memory profile on field hardware?
7. How should old seals verify after credential and trust-root revocation?
8. Which disclosure mechanisms satisfy legal evidence workflows while preserving source safety?

## 7. Customer research plan

Interview groups:

- 5 photo/video editors;
- 5 newsroom security, standards or legal staff;
- 5 freelancers/stringers or representative safety advocates;
- 3 fact-checking/OSINT teams;
- 3 human-rights/election-evidence teams;
- 3 insurance/legal evidence operators after the journalism wedge is validated.

Questions:

1. How does media arrive today and where does verification fail?
2. Which metadata must remain private, from whom and for how long?
3. What evidence changes a publication decision?
4. What capture devices and editing tools are already used?
5. How is a lost or compromised device handled?
6. What integrations are required for adoption?
7. Who owns budget and procurement?
8. What would make a pilot unsafe or impossible?
9. What proof would justify an annual purchase?

## 8. Evidence standards

- **Verified:** primary source or reproduced repository evidence.
- **Supported:** multiple credible sources but not reproduced directly.
- **Hypothesis:** plausible product/business assumption requiring validation.
- **Unavailable:** capability cannot currently be tested or deployed.

Every deck statistic must preserve source, date, denominator and caveat. Vendor announcements prove market direction, not customer demand for Unforged.
