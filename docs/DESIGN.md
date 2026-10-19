# Unforged — Product design system

## Experience principle

Unforged is an evidence workspace, not a marketing page with buttons. Every surface must help a person make one bounded decision: enroll, capture, approve, verify, publish, revoke or investigate.

The visual language is **security print**: editorial grids, newsprint and darkroom surfaces, precise rules, film-stock framing, redaction, guilloche line work and disciplined data typography. It should feel calm, serious and operational.

## Interaction principles

1. **Decision before explanation.** Show status, consequence and next action before background text.
2. **Evidence has structure.** Use summaries, tables, timelines, comparison columns and progressive disclosure.
3. **One primary action.** Secondary actions remain visually subordinate.
4. **Claims have boundaries.** Established, asserted, unresolved and unavailable are distinct states.
5. **Space communicates hierarchy.** Large empty regions are intentional only when supporting a focal object; workspaces use the available canvas.
6. **Motion explains state.** Movement shows enrollment, sealing, disclosure and refusal. No decorative loops.
7. **Privacy appears in the workflow.** Users see what is published and withheld before committing an action.

## Brand system

### Color

- Warm newsprint paper and ink for the light theme.
- Darkroom charcoal, not pure black, for the dark theme.
- Cyanotype blue for primary actions and active navigation.
- Carmine exclusively for the guilloche seal and high-value provenance marks.
- Moss, amber and rust for success, caution and failure, always paired with icon and text.

### Typography

- Satoshi for display and interface text.
- Geist Mono for fingerprints, seal IDs, refusal codes, timestamps and case numbers.
- Body copy uses a maximum readable measure of approximately 62 characters.
- Workspaces prefer short labels and values over explanatory paragraphs.
- Tabular numerals are scoped to metrics and evidence.

### Signature assets

The guilloche seal is deterministically generated from SHA-256. It is a verification identity, not decoration. A photograph appears as film stock with crop marks. Redaction bars represent intentionally withheld fields.

## Spatial system

### Global rails

| Surface | Desktop content behavior |
|---|---|
| Marketing | Centered max width 1,440 px; 32–64 px gutters; two-column hero uses the full rail |
| Workspace | Persistent 240–264 px navigation plus centered main canvas up to 1,440 px |
| Operational pages | 12-column grid with 24–32 px gaps |
| Reading pages | Text measure 58–68 characters inside a wider compositional rail |
| Mobile | 16–20 px gutters; bottom navigation; edge-to-edge camera where appropriate |

Alignment anchors must repeat across page title, primary work area, tables, status strips and footers. Avoid placing a narrow card cluster at the left of a large empty canvas.

### Density

- Marketing sections may use 96–144 px vertical rhythm.
- Workspace page headers use 24–32 px separation from the work area.
- Operational rows use 44–64 px heights.
- Metrics use shared baselines and consistent label positions.
- Cards are reserved for contained decisions or media; spacing and rules group most content.

## Workspace shell

The desktop shell contains:

1. a 64 px command bar with product, environment, pool health, theme and exit;
2. a left navigation rail with workflow order and system scope;
3. a centered, wide main canvas;
4. contextual actions aligned to the page title;
5. no unused permanent right gutter at wide desktop sizes.

Navigation language:

- Capture
- Verification
- Assurance
- Trust pool

The environment badge must state `Local evaluation`, `Preprod` or `Mainnet`; it must never imply a network state indirectly.

### Wave 2 implementation record — 19 October 2026

The current React workspace implements the shell and four connected operational surfaces:

| Surface | Implemented composition | Evidence state |
|---|---|---|
| Capture | Credential-enrollment step rail, dominant passkey path, separate evaluation path, enrollment receipt and pool-readiness strip | Live local flow |
| Verification | Evidence intake, browser-local indicator, three-stage resolution pipeline, structured review output and bounded export | Live local flow |
| Desk | Case queue, case file with media and seal, assurance ladder, four-column evidence matrix, checklist-gated approval, hold reasons, decision log, publication package | Live local flow |
| Relay | Release log of shuffled batches, who-sees-what boundary, evaluation limits | Live local flow |
| Assurance | Suite metrics, indexed threat files, selected-case method and exact observed verdict | Ten runnable cases |
| Trust pool | Operational health, aggregate metrics, credential registry, guarded revocation and privacy boundary | Live local flow |

The desktop canvas uses a 256 px workflow rail and scales to a 1560 px maximum content width. At the reviewed 1265×710 viewport, the layout uses the available horizontal space without a permanent empty right column. Darkroom and paper themes preserve the same hierarchy.

## Core workflows

### Enrollment

Goal: understand promise, assurance level and next action in under ten seconds.

Desktop composition:

- compact workflow step rail;
- large primary passkey decision;
- three concise evidence properties: system approval, private commitment, contract check;
- simulated mode presented as an evaluation utility, not an equal production choice;
- pool readiness strip with size, floor and published claim.

No card contains more than one short paragraph. Technical caveats live in an expandable assurance note.

### Capture

- darkroom viewfinder dominates the canvas;
- capture state and pool status sit on a top instrument rail;
- one shutter or seal action is visually dominant;
- proof stages appear as a compact operational timeline;
- the completed seal enters once, with measured stage durations;
- test frames carry an always-visible evaluation label.

### Verification

The verifier uses a two-part desk:

- intake and recent session assets on the left;
- evidence verdict on the right.

Result hierarchy:

1. verdict and assurance level;
2. exact facts established;
3. unresolved editorial questions;
4. revocation/epoch warning;
5. public, private and independent verification detail;
6. export action.

`No seal found` remains neutral and explains common causes. It never says “fake.”

### Assurance console

The Threat Lab is an incident-review console:

- suite summary metrics;
- indexed cases with live state;
- one selected case containing attempt, boundary and consequence;
- primary run action;
- observed result with exact code and evidence source;
- clear distinction among refused, accepted, held, unavailable and not run.

Long explanations move behind “Technical detail.” The default view is operational and scannable.

### Trust pool

- health summary shows size, anonymity floor, seals and epoch;
- aggregate activity only;
- enrolled credentials are administrative labels and truncated commitments;
- removal is an explicit two-step destructive action;
- earlier-seal behavior and floor consequence appear at confirmation;
- no per-device seal/activity history exists.

### Evidence Desk — Wave 2 foundation, Wave 3 multi-user

- case queue with assurance and urgency filters;
- case header with asset, contributor privacy state and publication status;
- provenance timeline;
- established/unresolved evidence matrix;
- reviewer checklist and decision log;
- controlled disclosure request;
- publication package and public verification link.

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| ≥1440 px | Full workspace canvas; multi-column evidence layouts; no excessive outer void |
| 1024–1439 px | Reduced gutters; two-column primary workflows |
| 720–1023 px | Navigation may collapse; secondary columns stack |
| <720 px | Bottom navigation; single-column tasks; full-width primary actions |
| Capture phone | Edge-to-edge viewfinder with safe-area-aware controls |

Content priority changes by viewport. Desktop should not imitate a stretched mobile layout.

## Motion

Use the installed `motion` library.

- 120 ms for press, hover and focus feedback.
- 180–220 ms for navigation and state transitions.
- 340–900 ms for one-time seal, redaction and evidence reveals.
- The guilloche draws once when a seal is created.
- Active navigation glides between destinations.
- Proof steps advance using measured completion.
- Refusal results enter without celebratory motion.
- Reduced-motion mode removes travel and path drawing.

No artificial delay is added to make cryptography look dramatic.

## Content system

### Voice

Plain, short and evidence-led. Prefer:

- seal;
- enrolled credential;
- pool;
- fingerprint;
- assurance level;
- local review;
- recorded;
- withheld.

Avoid user-facing terms such as witness stack, Merkle path, ZKIR, transaction payload or proving key unless the user opens technical detail.

### Claim labels

| Label | Meaning |
|---|---|
| Established | Directly checked by the current verifier |
| Asserted | Supplied by an organization or manifest and cryptographically bound |
| Unresolved | Requires editorial or external investigation |
| Unavailable | Could not be checked |
| Local evaluation | Result exists only in current runtime |

### Errors

| State | Copy direction |
|---|---|
| Not enrolled | Explain pool access and request path |
| Approval cancelled | Confirm nothing was recorded and offer retry |
| Already sealed | Link to existing record |
| Pool too small | Show current size and floor |
| Offline | Explain queued state and retry condition |
| Revoked | Explain loss of future authority and validity of prior seals |
| No seal | State absence neutrally and show checked fingerprint |
| Public network unavailable | Preserve local evidence and identify missing external check |

## Accessibility

- WCAG 2.2 AA target for both themes.
- Visible focus with no obscured focused control.
- Minimum 24×24 CSS px target; 44 px preferred for primary mobile actions.
- Semantic headings, landmarks, tables and status regions.
- Keyboard operation for drop zone, tabs, Threat Lab and pool actions.
- Status never relies on color alone.
- Seal image has a textual equivalent including ID, date and pool size.
- Motion respects `prefers-reduced-motion`.
- Touch interfaces respect safe areas and orientation changes.
- Error summaries and inline recovery action are both provided for forms.

## Design quality gates

Before a screen is complete:

- [x] One primary decision is visually obvious.
- [x] Wide screens use the available canvas intentionally.
- [x] Alignment anchors repeat across header and content.
- [x] Paragraphs have been converted to structured evidence where useful.
- [x] Empty, loading, error, success and unavailable states are rendered for the Wave 2 journey.
- [ ] Dark/light and 390/768/1440/1920 px layouts are inspected.
- [x] Keyboard semantics and reduced-motion branches are implemented; a formal accessibility audit remains.
- [x] Current assurance level is visible at the decision point.
- [x] Contract actions and displayed state agree in the tested local journey.
- [x] No placeholder metric or fabricated traction appears.
