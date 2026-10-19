# Unforged — Market & technical research

_Compiled 2026-10-19. Facts are linked; anything marked **ESTIMATE** or **UNVERIFIED** is not established._

## 1. Problem evidence
| Fact | Source |
|---|---|
| FBI: ~$893M adjusted 2025 US losses from 22,364 complaints with an AI nexus ($632M investment-related) | FBI IC3 via https://deepstrike.io/blog/deepfake-statistics-2025 |
| Entrust 2026 (1B+ verification events): deepfakes ≈ 1 in 5 biometric fraud attempts; deepfaked selfies +58% in 2025 | https://deepstrike.io/blog/deepfake-statistics-2025 |
| Insurers face AI-altered and fully synthetic claim photos | SAS, May 2026: https://www.sas.com/en_us/news/press-releases/2026/may/synthetic-images-ai-insurance-fraud.html · Debevoise, Jan 2026: https://www.debevoise.com/insights/publications/2026/01/use-of-ai-generated-images-for-fake-insurance |
| C2PA metadata is signed, not encrypted. It can expose camera serials and GPS; field journalists "may face physical danger" if identity, location or equipment leak | SMPTE 2025: https://summit.smpte.org/2025/session/3347598/ · WITNESS: https://blog.witness.org/2022/01/potentially-systematic-provenance-and-authenticity-infrastructure/ |
| Tension between verification and protecting vulnerable creators is unresolved in C2PA deployments | World Privacy Forum summary via https://www.longtermwiki.com/source/f98ad3ca8d4f80d2 |

## 2. Regulation (tailwinds)
| Rule | What it requires | Date | Source |
|---|---|---|---|
| EU AI Act Art. 50 | Machine-readable marking of synthetic media; deepfake disclosure by deployers | applies 2 Aug 2026 | https://www.traverssmith.com/knowledge/knowledge-container/is-it-a-bot-eu-ai-act-transparency-rules-take-effect-2-august-2026/ · https://www.paulweiss.com/insights/client-memos/eu-finalises-transparency-rules-for-ai-generated-content |
| India IT Rules amendment 2026 ("synthetically generated information") | Platforms must label SGI prominently and embed provenance metadata where technically feasible | in force 20 Feb 2026 | https://ministryofcyberaffairs.com/news/deepfake-laws-how-india-eu-china-and-the-us-manage-synthetic-media-ac264a7a-4b2d-432d-a9d3-88a8285949d6 |

Implication: platforms and publishers need to tell **real** from **synthetic**. Labelling fakes is half of it; positively proving real capture is the other half.

## 3. Hardware & standards landscape
| Fact | Source |
|---|---|
| Pixel 10 signs captures with C2PA at Assurance Level 2; keys in StrongBox (Titan M2); Android Key Attestation; per-image certificates; Google avoided account-linked certs for privacy | https://security.googleblog.com/2025/09/pixel-android-trusted-images-c2pa-content-credentials.html |
| ~17 cameras (Leica, Sony, Canon, Nikon) sign at capture in 2026; Canon newsroom service (May 2026); Nikon Z6 III C2PA suspended after a signing vulnerability | https://www.lumethic.com/en/articles/cameras-with-c2pa-content-credentials · https://attesttrail.com/blog/c2pa-cameras-support |
| Content Authenticity Initiative: 6,000+ members; Google "About this image" reads C2PA | https://contentauthenticity.org/blog/the-state-of-content-authenticity-in-2026 · https://www.softwareseni.com/c2pa-adoption-in-2026-hardware-platforms-and-verification-reality/ |
| Apple C2PA status: **UNVERIFIED** (sources conflict) | https://editorsweblog.org/2026/04/12/c2pa-adoption-tracker-platforms-content-credentials-2026 |
| The "screenshot / re-encode" problem is unsolved: provenance is stripped when media is re-shared | same tracker; https://www.irccl.in/post/can-you-still-believe-what-you-see-rethinking-deepfake-regulation-after-article-50-of-the-eu-ai-act |

## 4. Research frontier (we productise this)
| Work | Relevance |
|---|---|
| VerITAS (2024): zk-SNARKs proving only permitted edits (crop, resize) were applied to a signed 30MP photo | Roadmap: seals that survive allowed edits. https://eprint.iacr.org/2024/1066 |
| Anonymous multi-editor image provenance (eprint 2026/1914): signer's long-term key "propagates with the image" → one-time pseudonyms + zk-SNARKs | Confirms the signer-privacy gap. https://eprint.iacr.org/2026/1914.pdf |
| Soft redaction of provenance via ZKPs (arXiv 2608.07063): replace an assertion with a predicate proof, e.g. "taken in this country" | Roadmap: coarse location disclosure. https://arxiv.org/abs/2608.07063 |
| Christian Paquin (Mar 2026): ZK proofs over X.509 to hide identifying certificate fields, compatible with C2PA | Roadmap: C2PA bridge. https://christianpaquin.github.io/2026-03-13-privacy-for-c2pa-signers.html |

All of these are papers or prototypes. **No shipped product combines hardware-signed capture, signer anonymity and public verification.** That is the gap.

## 5. Competitors
| Product | What it does | Signer privacy | Public verification without the vendor |
|---|---|---|---|
| Truepic (Lens SDK) | Authenticated capture SDK for insurance, KYC, newsrooms | No (vendor-held identity) | No |
| ProofMode (Guardian Project) | Open-source capture app with signed proof bundles | Partial (PGP keys identify the device) | Partly |
| Numbers Protocol: ProofSnap, Capture Cam | C2PA + on-chain ERC-7053 records; journalism app (2026) | No: records are public on a transparent chain | Yes |
| OpenOrigins | Capture-time provenance + public verification portal | No | Portal-based |
| Genuine Capture, Photo Proof, Lens | Capture apps with signatures/watermarks/GPS | No (often add GPS) | No |
| Native C2PA (Pixel 10, Leica…) | Hardware-signed credentials | Partial (Pixel per-image certs; cert chain still reveals maker/model/app) | Yes, via the C2PA trust list |
| World "Human" (ETHGlobal 2026) | Photos by verified humans (World ID) | Person-level anonymity, not tied to capture hardware | Yes |

Sources: https://numbersprotocol.medium.com/unlocking-the-digital-media-provenance-introducing-capture-upload-with-numbers-protocol-cab5c0810bc2 · https://captureapp.xyz/products/camera/ · https://itbrief.co.uk/story/openorigins-app-aims-to-prove-photos-real-amid-deepfakes · https://apps.apple.com/us/app/-/id6466933349 · https://ethglobal.com/showcase/human-d88zt · https://blog.mean.ceo/digital-provenance-startup-statistics/

**Our wedge:** the only design where the chip-level signature is verified **inside a zero-knowledge proof**, so the verifier learns "one of N trusted devices" and never which one.

## 6. Midnight technical fit
| Capability | Status | Source |
|---|---|---|
| `secp256r1EcdsaVerify` (P-256) in Compact | Compact 0.35.0 with `--feature-zkir-v3`; ledger 9 (not yet on Mainnet/Preprod as of 2026-10-19) | https://github.com/midnightntwrk/compact/releases |
| WebAuthn assertion verified fully in-circuit (clientDataJSON rebuilt, UP+UV flags) | Reference module in Midnight Passport (Apache-2.0) | https://github.com/midnightntwrk/passport |
| P-256 verify cost | ~220–290 MB proving keys per verify circuit | midnightntwrk/midnight-examples `experimental/q3-ledger9` |
| HistoricMerkleTree + `merkleTreePathRoot` for anonymous membership | Stable | Compact stdlib, `examples/zerocash.compact` |
| App-sponsored fees (users never hold DUST) | Live (Gero Wallet sponsorship, Ura Labs Relay Club on Preprod) | https://www.thecoinrepublic.com/2026/10/02/midnight-price-gains-as-mainnet-upgrade-unlocks-new-building-possibilities/ |
| Midnight roadmap Q4 2026: enterprise keys (ed25519, P-256), Passport SDK, mobile SDK, proof verification inside contracts | Announced | https://midnight.network/roadmap |
| Midnight founder on the concept: "ZK proof a photo was taken by a real Apple phone" | X post, 2026-09-09 (via research summary; **verify link before quoting**) | https://x.com/i/status/2097803813264801929 |

## 7. Open questions to validate with users
1. Do fact-checkers and photo desks need *source anonymity*, or only authenticity? (Interview 5 desks.)
2. What minimum pool size do at-risk reporters consider safe?
3. Will a publisher display a third-party "Sealed" badge?
4. What will insurers pay per verified capture? (Pricing hypotheses in BUSINESS.md.)
