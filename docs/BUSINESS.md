# Unforged — Business model and go-to-market

## Company thesis

Unforged is the privacy-preserving authorization layer for digital evidence. It enables organizations to prove that an asset came through an approved capture or evidence workflow while withholding the contributor or device identity from the public record.

The company begins with high-risk journalism, where identity exposure has immediate consequences, and expands through a reusable platform for insurance, legal evidence, human-rights documentation, science, marketplaces and AI-data provenance.

## Beachhead customer

### Primary buyer

Newsroom security, standards, investigations or photo-desk leadership at organizations that receive media from freelancers, stringers or sensitive sources.

### Primary users

- contributors capturing evidence;
- editors and fact-checkers validating it;
- security administrators managing authorization pools;
- readers and partner organizations verifying published assets.

### Job to be done

“Let us verify that a contribution came through an authorized workflow without exposing the contributor through the provenance record.”

### Urgent triggers

- manipulated or AI-generated evidence reaches an editorial desk;
- a source requires anonymity;
- a credential or device is stolen;
- a publisher needs to explain provenance publicly;
- an organization needs a consistent evidence policy across devices and regions.

## Product packaging

| Product | Buyer value | Commercial form |
|---|---|---|
| Capture | Hardware-backed, policy-compliant evidence intake | Mobile app and SDK license |
| Desk | Faster, consistent evidence review and publication | Enterprise SaaS or self-hosted deployment |
| Trust Pools | Private authorization, revocation and policy | Protected-contributor / organization plan |
| Verify | Independent public and internal validation | Web, API, CMS and platform SDK |
| Relay | Reduced network and timing correlation | Managed privacy infrastructure or self-hosted service |
| C2PA Bridge | Interoperability between hardware provenance and private authorization | Enterprise/OEM integration |

## Revenue model

1. **Enterprise subscription:** annual contract by organization size, regions, protected contributors and workflow modules.
2. **Verification API:** metered by verified assets or request volume with privacy-safe caching.
3. **Capture and CMS SDK:** annual developer license and support agreement.
4. **Self-hosted enterprise:** deployment, updates, support and security-response subscription.
5. **OEM/platform licensing:** per-device, per-tenant or negotiated platform agreement.
6. **Assurance services:** onboarding, policy design, threat modeling, interoperability testing and incident exercises.

Illustrative pricing hypotheses for interviews, not validated offers:

| Segment | Hypothesis |
|---|---|
| Small newsroom or NGO | US$1,000–3,000/month |
| National publisher or investigation organization | US$25,000–150,000/year |
| Global publisher, platform or sovereign deployment | Six- to seven-figure annual agreement |
| Verification API | Volume tiers by asset or API request |
| OEM | Negotiated integration and per-device/platform license |

Newsroom SaaS establishes credibility and workflow depth. Platform, API and OEM distribution create the scale required for a very large company.

## Market expansion

| Stage | Use case | Shared primitive |
|---|---|---|
| 1 | News and fact-checking | Authorized capture with source protection |
| 2 | Human rights and election evidence | Witness-safe chain of custody |
| 3 | Insurance and legal evidence | Approved capture and tamper-evident review |
| 4 | Science, environment and supply chains | Private field authority and provenance |
| 5 | Marketplaces and brand protection | Authorized listing/media origin |
| 6 | AI training and generated-media ecosystems | Dataset and model-workflow authorization |
| 7 | Cameras, phones and platforms | Embedded private provenance infrastructure |

## Go-to-market

### Design-partner motion

1. Interview 15–20 photo editors, digital-forensics leads, newsroom security staff and field contributors.
2. Select 3–5 organizations with sensitive-source workflows and a technical champion.
3. Map one existing intake and verification process end to end.
4. Run a controlled pilot with synthetic or low-risk media before handling real sensitive evidence.
5. Measure review time, failed submissions, proof time, support burden and policy fit.
6. Convert at least one pilot into a paid annual agreement.

### Distribution

- newsroom CMS and digital-asset-management integrations;
- fact-checking and OSINT tooling partnerships;
- C2PA and Content Authenticity Initiative participation;
- camera and phone OEM integration experiments;
- open verifier and test vectors that build ecosystem trust;
- security research, threat exercises and transparent incident reporting.

## Pilot success criteria

| Metric | First commercial-year target |
|---|---:|
| Design partners | 3–5 |
| Protected contributors | 50–100 |
| Real captures processed | 10,000 |
| CMS/DAM integrations | 2 |
| Paid annual contracts | ≥1 |
| Median invite-to-first-seal | <3 minutes |
| Verification p95 | <3 seconds excluding external-network delays |
| Proof success rate | >99% after supported-device filtering |
| Critical privacy/security findings unresolved | 0 before production handling |

Targets are hypotheses until measured in pilots.

## Unit economics

Primary variable costs are proof generation, relay execution, indexer access, encrypted evidence storage, support and incident response. DUST sponsorship should keep contributors out of token mechanics; actual NIGHT/DUST capital requirements must be measured on a real deployment.

Target model:

- annual enterprise contracts cover fixed security and integration cost;
- verification reads are highly cacheable without storing user files;
- organizations may self-host sensitive media and proving infrastructure;
- gross-margin targets are set only after measured proof and support costs.

The prior 80% margin target remains a hypothesis, not a current result.

## Competitive position

| Category | Strength | Gap Unforged targets |
|---|---|---|
| C2PA / Content Credentials | Global provenance format and ecosystem | Organization authorization can expose or depend on signer credentials |
| Camera OEM authenticity services | Strong hardware and sensor evidence | Vendor/device silos and limited private cross-organization authorization |
| Centralized verification vendors | Fast integrations and managed workflow | Service can observe or control signer-to-asset relationships |
| Public blockchain registries | Durable public records | Transparent keys and activity graphs |
| Anonymous upload systems | Source protection | Weak public proof of organizational authorization and asset history |

Unforged wins by integrating these layers: C2PA interoperability, hardware evidence, private organizational authorization, public verification and operational source protection.

## Moat

1. Applied cryptography and Midnight contract expertise.
2. Hardware, WebAuthn and C2PA interoperability.
3. Trust-pool and policy infrastructure embedded in organizational workflows.
4. Public verification network and developer integrations.
5. Security evidence, audits and incident history.
6. Standards relationships and OEM/platform partnerships.
7. Anonymity network effect: larger compatible pools improve the privacy set available to contributors.

## Key risks

| Risk | Response |
|---|---|
| Hardware and platform vendors implement private authorization themselves | Become the interoperable, vendor-neutral layer and integrate early |
| Newsrooms cannot change contributor workflows | Offer SDKs and CMS adapters; prove time savings in pilots |
| Privacy claims fail under operational correlation | Gate production on relay, policy, audit and red-team evidence |
| C2PA metadata stripping breaks verification | Support external manifests, soft bindings and recovery workflows |
| Midnight ledger/runtime availability delays deployment | Maintain pinned local ledger-9 integration and publish dependency status |
| Large proving requirements harm mobile UX | Measure early; use pool-controlled proving until on-device performance is acceptable |
| Long enterprise procurement | Begin with NGOs, fact-checkers and innovation/security teams; design for self-hosting |

## Financing milestones

- **Buildathon:** prove the cryptographic primitive and product story.
- **Pre-seed:** complete public deployment, native capture prototype, C2PA bridge and 3–5 design partnerships.
- **Seed:** convert pilots, pass independent security review, ship CMS/API integrations and establish repeatable enterprise sales.
- **Growth:** expand OEM/platform distribution and multiple evidence verticals while maintaining a common verification network.
