# Unforged — Business model & go-to-market

_All prices are **hypotheses** to test with design partners, not validated numbers._

## Customers and what they buy
| Segment | Job to be done | Buys | Pays? |
|---|---|---|---|
| At-risk reporters, citizen journalists, human-rights documenters | Get photos believed without being identified | Capture app | **Never.** Funded by pools |
| Fact-checkers, newsrooms, wire photo desks | Trust incoming images fast; protect sources | Pool membership (devices) + Desk console | Yes |
| Press-freedom NGOs & foundations | Protect the people they support | Sponsor shared anonymity pools | Yes (grants) |
| Platforms & publishers (EU AI Act Art. 50, India IT Rules 2026) | Label real vs synthetic at scale | Verify API + "Sealed" badge SDK | Yes |
| Insurers, marketplaces, KYC providers | Real claim/listing/selfie photos without hoarding customer data | Capture SDK + per-seal pricing | Yes |

## Revenue model
1. **Verify is free forever.** The public good drives adoption; free API tier with rate limits.
2. **Pools (newsrooms, NGOs):** per enrolled device per month. Hypothesis **$8–15/device/month**, including seals and sponsored network fees. Independent journalists ride shared NGO-sponsored pools at no cost.
3. **Enterprise capture SDK (insurers, marketplaces, KYC):** per sealed capture. Hypothesis **$0.05–0.50/seal** plus platform fee, volume-tiered.
4. **Verify API at scale (platforms):** per 1,000 verifications above the free tier.

## Unit economics (structure; numbers to measure)
- **Network fees:** paid in DUST, which regenerates from NIGHT held by Unforged (Midnight's dual-token model). Fees become a predictable capital cost rather than per-transaction spend, and users never touch tokens.
- **Proving:** done on the user's device or a privacy-preserving prover. Measure proof time and size per seal in Wave 3.
- **Infra:** indexer reads, static hosting, push notifications. Low.
- **Target:** gross margin > 80% at pool pricing. **ESTIMATE**, validate in Wave 4.

## Moat
1. **Anonymity network effect.** A bigger pool gives every member more anonymity, so shared pools get more valuable with each organisation that joins. That's hard to copy once established.
2. **ZK + hardware attestation know-how** on Midnight: P-256 in-circuit, WebAuthn, then App Attest, Key Attestation, and a C2PA bridge.
3. **Trust brand** with press-freedom organisations, which is earned slowly.

## Go-to-market
| Phase | Who | How we reach them | Proof point |
|---|---|---|---|
| 1. Design partners (Wave 3) | Indian fact-checkers (IFCN signatories) and student/independent newsrooms | Direct outreach from India; the Feb 2026 IT Rules make provenance urgent | 1–3 partners seal real photos; a quote or LOI |
| 2. Credibility | Press-freedom orgs and journalism-safety trainers | Their digital-security trainings; open-source threat model | A shared pool sponsored by an NGO |
| 3. Newsrooms | Photo desks with stringer networks | Desk console + Verify badge | Paid pools |
| 4. Platforms & insurers | Compliance and fraud teams | Verify API, capture SDK, C2PA bridge | Per-seal revenue |

## Competition (summary; detail in RESEARCH.md §5)
Truepic, ProofMode, Numbers ProofSnap, OpenOrigins and native C2PA all **prove authenticity**. None hides the signer while staying publicly verifiable without trusting the vendor. We position as **the privacy layer for content credentials**, complementary to C2PA rather than a rival standard.

## Funding path
Midnight Buildathon grants → Midnight Build Club → Midnight Accelerator / investor network. In parallel: journalism-innovation and press-freedom grants for the free tier.

## Key risks
| Risk | Mitigation |
|---|---|
| Journalists don't value anonymity enough to switch apps | Validate in 5 desk interviews before building Desk features |
| Hardware makers add anonymity natively | Stay chain-verifiable and cross-vendor; the C2PA bridge turns any maker's credentials into anonymous seals |
| Ledger 9 delays on Mainnet | Run on a local ledger-9 network and Preprod when available; product UX doesn't depend on the date |
| Small pools leak identity | Show pool size in every seal; refuse to seal into pools below a safety threshold |
