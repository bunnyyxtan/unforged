# Unforged — Design system & UX

## Brand idea: "security print"
Unforged is about things that can't be forged, so its visual language comes from the oldest anti-forgery craft: banknotes, passports and notary seals. The product should feel like a **serious press tool**: calm, editorial, precise. The one authored moment per screen is **the seal**.

**Voice:** plain, short, never crypto. Say "seal", "enrolled phone", "pool", "fingerprint". Never say wallet, token, gas or blockchain in primary UI (only in "Check it yourself").

| Instead of | Say |
|---|---|
| Generate ZK proof | Prove pool membership |
| Transaction submitted | Recorded |
| Wallet / key pair | This device's secure chip |
| Merkle tree membership | One of 8 enrolled phones |
| Hash | Fingerprint |

## Visual system
Tokens live in `web/src/styles/tokens.css` in three layers (primitive → semantic → component). Components use semantic tokens only.

**Color.** Warm newsprint paper and ink. **Cyanotype blue** (the historical photographic blueprint process) is the action color. **Carmine** is reserved for the seal and nothing else. Status colors (moss, amber, rust) always pair with an icon and text. The dark theme is a remapped darkroom, not an inversion, and it's set before first paint.

**Type.** Chosen for journalism, not by default.
- **Newsreader** (Production Type's editorial serif for news): display, headlines, page headings.
- **Schibsted Grotesk** (named for the Norwegian publisher Schibsted): all interface and body text.
- **IBM Plex Mono**: fingerprints, Seal IDs, refusal codes. Tabular figures are scoped to data only (they change punctuation spacing in body text).

**Signature motif: the guilloche seal.** Every seal is a guilloche rosette (the woven line pattern of banknote printing) generated from the photo's SHA-256 (`web/src/lib/guilloche.ts`), so no two seals look alike. It is embossed (highlight up-left, shadow down-right) like a notary seal, with the Seal ID set around the rim.

**Supporting motifs.** Photos are presented as prints on film stock with crop marks. Identifying metadata is covered by redaction bars. Tables are typeset like newspaper results tables. Cards are used sparingly: grouping comes from spacing and hairlines first.

**Motion (`motion` library).** Motion explains change, never decorates:
- the seal draws its line work and settles once, when a seal is made;
- redaction bars slide over identifying fields as they scroll into view;
- the hero fingerprint types out the photo's real hash;
- screens cross-fade briefly, and the active rail item glides between tabs.

Durations follow 120 ms (micro) / 200 ms (transitions) / 340 ms+ (reveals), with ease-out. Every animation has a reduced-motion alternative (instant bars, static seal, no travel). Sealing stages report **real measured durations**; no artificial delay is ever added.

## Core screens
1. **Landing:** headline "Prove it's real. Keep who took it secret." · live counter (seals, pools) · two CTAs: *Verify a photo* / *Enroll a phone*.
2. **Verify:** a full-bleed drop zone ("Drop a photo to check its seal") → result card:
   - **Sealed.** guilloche seal + 3 ticks (captured on an enrolled phone · approved by a person · unchanged) + time + pool size.
   - **No seal found.** neutral, explains it isn't proof of fake.
   - **Pool changed since.** amber note under a seal when phones were removed after it was made (epoch). It never says which phone, because nobody can know.
   - Tabs: *What the world sees* | *What stays private* | *Check it yourself* (contract, query, CLI).
3. **Enroll (mobile):** invite → one-sentence promise → "Use Face ID to turn this phone into a press camera" → waiting/approved state with pool size ring.
4. **Capture (mobile):** dark viewfinder with a safelight glow, single shutter → preview → "Seal this photo" (biometric) → developing timeline → stamp → share sheet.
5. **Seal page `/s/:id`:** shareable public page with image (if shared), seal, facts, verify-it-yourself.
6. **Desk:** pool overview (size ring, safety threshold, seals/day sparkline), invites (QR), approvals, revoke, sponsorship balance. **No per-device activity view, by design**, with a note explaining why.
7. **Ledger split view (demo + education):** two columns. Left "On Midnight": fingerprint, time, root, pool size. Right "Never leaves the phone": key, signature, which phone, GPS. Items animate into their column during a seal.

## Onboarding flows
**Reporter (target < 3 min invite → first seal)**
1. Tap invite → *"Your photos get a seal. Nobody learns it was you."* [Continue]
2. *"Turn this phone into a press camera."* [Use Face ID] → passkey created (UV required)
3. *"Waiting for {Pool}'s approval"*, with the pool-size ring and what's private
4. Approved → guided first shot (coach marks on the shutter)
5. First seal → the seal draws itself → *"Here's what anyone can check, and what nobody can"* sheet

**Pool admin**
1. Create pool (name, safety threshold) → 2. Fees sponsored, no setup → 3. Invite via QR or link → 4. Approve devices → 5. Share the pool's public verify page

**Verifier**
Zero onboarding. Drop a file and get the answer. "Check it yourself" for experts.

## Error & edge states (copy)
| State | Copy |
|---|---|
| Not enrolled | "This phone isn't in a pool yet. Ask your editor for an invite." |
| Biometric cancelled | "Not sealed. Your phone needs your face or fingerprint to seal." |
| Already sealed | "This exact photo is already sealed." + link to the seal |
| Pool too small | "This pool has 6 phones. Sealing starts at 20 to keep you hidden." |
| Offline | "Signed and saved. We'll finish sealing when you're back online." |
| Revoked | "This phone was removed from the pool. Seals can't be made from it." |

## Accessibility
WCAG 2.2 AA contrast in both themes; states always icon + word + color; full keyboard support for Verify and Desk; screen-reader labels on seals ("Sealed, 19 October 2026, 14:02, pool of 412 phones"); motion reduced on request.
