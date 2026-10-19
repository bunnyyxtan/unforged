# Unforged — Roadmap

| Phase | Dates | Ships | Exit criteria |
|---|---|---|---|
| **Wave 2: Foundation** | → Oct 19, 2026 | `unforged.compact` (enroll, revoke, seal) on Compact 0.35 with anonymous membership + in-circuit WebAuthn P-256; simulator test suite with real P-256 vectors and every refusal; web demo (real passkey enroll, camera capture, seal, verify, ledger split view, attack panel); founding docs | CI green; tests cover T1, T2, T4, T5; demo runs in a browser with no install |
| **Wave 3: Real network & real users** | Oct 27 → Nov 16 | Local ledger-9 network with real proofs and a tx table → Preprod after the fork; mobile PWA capture; Desk v1 (pools, invites, approvals, revoke); sponsored fees; submission relay; pool safety threshold; proof-time measurements | 1–3 design partners sealing real photos; quote or LOI; measured proof times |
| **Wave 4: Hardware truth** | Dec 2026 – Q1 2027 | Native iOS (App Attest) and Android (Key Attestation) capture closing T3; device-bound keys; batch verify; "claim this seal" for paid attribution | A modified client can no longer seal non-camera pixels |
| **C2PA bridge** | Q1–Q2 2027 | Verify a C2PA credential (Pixel 10, Leica…) in-circuit and issue an anonymous seal; coarse-location disclosure ("taken in X region"); Midnight `discloseTo` / viewing keys for editors | Pixel 10 photo → anonymous seal end-to-end |
| **Platform & insurers** | 2027 | Verify API, badge SDK, insurer capture SDK, edit-tolerant seals (VerITAS-style crop/resize proofs), video | First paid enterprise contract |

## Dependencies we track
| Dependency | Owner | Impact if late |
|---|---|---|
| Ledger 9 on Preprod/Mainnet | Midnight | Wave 3 runs on a local ledger-9 network instead |
| Midnight mobile SDK / on-device proving | Midnight roadmap Q4 2026 | Keep the pool-run proof server longer (T7) |
| `discloseTo`, viewing keys | Midnight roadmap Q1 2027 | Editor-only disclosures wait |
