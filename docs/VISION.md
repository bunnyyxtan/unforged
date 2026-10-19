# Unforged — Vision

> **Prove it's real. Keep who took it secret.**

## Mission
Make reality provable without making people traceable.

## The problem, in one paragraph
Generative AI made a fake photo free. The industry's answer, signed capture (C2PA "Content Credentials", now shipping in Google's Pixel 10, Leica, Sony, Canon and Nikon cameras, with 6,000+ Content Authenticity Initiative members), proves an image is authentic by attaching signed metadata. That metadata can expose who took the photo, which device, and where. Researchers and press-freedom groups have flagged it as a physical danger for the people whose photos matter most: reporters in conflict zones, protesters, whistleblowers, citizen journalists. Today you choose between **authentic and traceable** or **anonymous and unverifiable**.

## What Unforged is
A **seal** for human-captured media:
1. A phone's secure chip signs the photo the moment it's taken, approved with the owner's face or fingerprint.
2. A zero-knowledge proof shows the signature came from **one of the enrolled devices in a trusted pool**, without revealing which one.
3. The proof is checked and recorded on **Midnight**, a public blockchain built for selective disclosure. No company has to be trusted, and nobody can quietly edit the record.
4. Anyone can verify a photo in a second: **Sealed · captured 19 Oct 2026, 14:02 · Independent Press Pool (412 devices) · photographer hidden.**

## Why now
- **Fakes are mainstream.** The FBI counted ~$893M in 2025 US losses from complaints with an AI nexus. Deepfakes are ~1 in 5 biometric fraud attempts (Entrust 2026). Insurers report AI-altered claim photos (SAS, May 2026).
- **Regulation demands provenance.** EU AI Act Article 50 transparency duties apply from **2 Aug 2026**. India's IT Rules amendment on "synthetically generated information" took effect **20 Feb 2026** and asks platforms to embed provenance metadata where feasible.
- **Hardware signing exists.** Phones and cameras now ship secure-chip signing (Pixel 10 C2PA Assurance Level 2, StrongBox / Secure Enclave, passkeys).
- **Private verification just became possible.** Midnight's Compact 0.35 / ledger 9 added in-circuit **P-256 ECDSA verification**, the curve those secure chips and passkeys use. That lets the chip's signature be checked *inside* a private proof. Midnight's founder publicly floated a "ZK proof a photo was taken by a real Apple phone" (Sep 2026).

## Who it's for (in the order we'll serve them)
1. **People who can't afford to be identified:** stringers, fixers, citizen journalists, human-rights documenters.
2. **The desks that publish them:** fact-checkers, newsrooms, wire photo desks, OSINT teams.
3. **Anyone who needs real photos without collecting more personal data:** insurers (claims), marketplaces (listings), platforms (labelling under the EU AI Act / India IT Rules).

## Principles
- **Privacy by construction, not by policy.** If we don't need to know something, the system makes it impossible for us to know it.
- **Verification is a public good.** Checking a seal is free, forever, for anyone.
- **No crypto in the user's face.** No wallets, seed phrases or tokens. Face ID and a camera.
- **Honest claims.** A seal says exactly what was proven and nothing more. Every limit is written down.
- **Bigger pools, safer people.** Like Tor, anonymity grows with the crowd, so pools are designed to be shared across organisations.

## Where this goes (5 years)
- **Year 1:** the seal for at-risk journalism. Design partners in fact-checking and press freedom. PWA capture, then native apps with hardware attestation.
- **Year 2:** a C2PA bridge. Any C2PA-signed photo (Pixel, Leica, Sony…) can be converted into an **anonymous** seal, plus selective disclosure ("taken in Kharkiv oblast, 19 Oct", not GPS to the metre).
- **Year 3:** platform and insurer APIs. A "Sealed" badge in feeds and claims systems, where verifying costs a fraction of a cent.
- **Year 5:** the default trust layer for human-captured media: video, audio, documents, sensor data. Anyone can prove "a real person captured this, unedited" without becoming a target.

## What we will never do
- Sell, log or correlate who sealed what.
- Put identifying data on-chain.
- Claim a seal proves the *scene* is true. It proves the *capture* is real and untouched. Context still needs journalism.
