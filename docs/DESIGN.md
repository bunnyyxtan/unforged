# Unforged — Design system & UX

## Brand idea: "the darkroom and the seal"
Unforged is where photography's oldest ritual (the darkroom, the editor's stamp) meets cryptography. The product should feel like a **serious press tool**: calm, precise, typographic. The single moment of delight is **the seal stamping down**.

**Voice:** plain, short, never crypto. Say "seal", "enrolled phone", "pool", "fingerprint". Never say wallet, token, gas, blockchain (except in "Check it yourself"), ZK or proof in primary UI.

| Instead of | Say |
|---|---|
| Generate ZK proof | Sealing… |
| Transaction submitted | Recorded |
| Wallet / key pair | This phone |
| Merkle tree membership | One of 412 enrolled phones |
| Hash | Fingerprint |

## Visual system
**Color tokens**
| Token | Light ("Paper") | Dark ("Darkroom") | Use |
|---|---|---|---|
| `--bg` | `#F4F1EA` warm paper | `#0E0D0C` darkroom black | page |
| `--surface` | `#FFFFFF` | `#171513` | cards |
| `--ink` | `#121110` | `#EDE8DE` | text |
| `--muted` | `#6B6560` | `#9A938A` | secondary text |
| `--seal` | `#D93A1F` vermilion | `#FF5A36` | the seal, primary action |
| `--sealed` | `#0F6B4F` | `#3FC79A` | verified state (always paired with icon + word) |
| `--warn` | `#B26B00` | `#F2A93B` | revoked / caution |
| `--line` | `#E2DDD3` | `#2A2724` | hairlines |
| `--safelight` | — | `#5A0F0B` | darkroom red glow behind the camera |

**Typography** (Google Fonts)
- Display: **Instrument Serif**: headlines, seal verdicts ("Sealed.")
- UI: **Inter**: everything else; tabular numbers on
- Data: **JetBrains Mono**: Seal IDs, fingerprints, addresses

**Shape & motion**
- 2px hairlines, 14px radius cards, generous whitespace; editorial 12-column grid on desktop.
- **The Seal stamp:** a circular vermilion stamp with the Seal ID around the rim. On success it drops from scale 1.4 → 1 with a slight rotate (−8°) and a 120ms ink-spread. Haptic tap on phones. Respects `prefers-reduced-motion` (fades instead).
- **Fingerprint glyph:** each image's SHA-256 rendered as a unique 32-segment radial glyph (each byte = segment length), shown on the seal and in lists. A visual identity for every photo.
- **Sealing progress:** a five-step vertical timeline that fills like a developing print (grey → full contrast), not a spinner.

## Core screens
1. **Landing:** headline "Prove it's real. Keep who took it secret." · live counter (seals, pools) · two CTAs: *Verify a photo* / *Enroll a phone*.
2. **Verify:** a full-bleed drop zone ("Drop a photo to check its seal") → result card:
   - **Sealed.** stamp + 3 ticks (captured on an enrolled phone · approved by a person · unchanged) + time + pool size.
   - **No seal found.** neutral, explains it isn't proof of fake.
   - **Pool changed since.** amber note under a seal when phones were removed after it was made (epoch). It never says which phone, because nobody can know.
   - Tabs: *What the world sees* | *What stays private* | *Check it yourself* (contract, query, CLI).
3. **Enroll (mobile):** invite → one-sentence promise → "Use Face ID to turn this phone into a press camera" → waiting/approved state with pool size ring.
4. **Capture (mobile):** dark viewfinder with a safelight glow, single shutter → preview → "Seal this photo" (biometric) → developing timeline → stamp → share sheet.
5. **Seal page `/s/:id`:** shareable public page with image (if shared), stamp, facts, verify-it-yourself.
6. **Desk:** pool overview (size ring, safety threshold, seals/day sparkline), invites (QR), approvals, revoke, sponsorship balance. **No per-device activity view, by design**, with a note explaining why.
7. **Ledger split view (demo + education):** two columns. Left "On Midnight": fingerprint, time, root, pool size. Right "Never leaves the phone": key, signature, which phone, GPS. Items animate into their column during a seal.

## Onboarding flows
**Reporter (target < 3 min invite → first seal)**
1. Tap invite → *"Your photos get a seal. Nobody learns it was you."* [Continue]
2. *"Turn this phone into a press camera."* [Use Face ID] → passkey created (UV required)
3. *"Waiting for {Pool}'s approval"*, with the pool-size ring and what's private
4. Approved → guided first shot (coach marks on the shutter)
5. First seal → stamp moment → *"Here's what anyone can check, and what nobody can"* sheet

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
WCAG 2.2 AA contrast in both themes; states always icon + word + color; full keyboard support for Verify and Desk; screen-reader labels on stamps ("Sealed, 19 October 2026, 14:02, pool of 412 phones"); motion reduced on request.
