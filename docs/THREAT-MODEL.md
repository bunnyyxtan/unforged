# Unforged — Threat model

## Assets
1. **Source anonymity:** which device or person sealed which photo.
2. **Seal integrity:** a seal exists only for real captures on enrolled devices.
3. **Pool integrity:** only legitimate devices are enrolled; revoked devices can't seal.

## Adversaries
| ID | Adversary | Goal |
|---|---|---|
| A1 | State or militia actor | Identify the photographer of a sealed image |
| A2 | Forger | Get a seal on a fake or edited image |
| A3 | Malicious or compromised pool admin | Deanonymise members, or enroll fake devices |
| A4 | Chain / network observer | Correlate seals with devices via timing or IP |
| A5 | Thief | Use a stolen phone to seal fakes |

## Threats & mitigations
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| T1 | A1 reads the ledger to find the device | Only a commitment-tree root is disclosed; key, path and signature are witnesses | ✅ by design (tested) |
| T2 | A2 seals an edited image | The fingerprint is SHA-256 of the exact bytes and the signature is over a challenge derived from it. Changing one byte means no seal | ✅ (tested) |
| T3 | A2 runs a modified client that feeds an AI image to the passkey | **Open in Wave 2–3.** WebAuthn proves a human approved on an enrolled authenticator, not that the camera produced the pixels. Closed by native apps with App Attest / Android Key Attestation (attested app + camera pipeline) and later the C2PA bridge | ⚠ documented limit |
| T4 | A2 replays someone's signature for a different image | The challenge binds contract address + fingerprint; the fingerprint can be sealed once | ✅ (tested) |
| T5 | A5 uses a stolen phone | Biometric (UV flag) required per seal; admin revocation resets accepted roots | ✅ revocation tested; UV enforced in-circuit |
| T6 | Synced passkeys (iCloud Keychain / Google Password Manager) live on several of the user's devices | The seal proves "an enrolled passkey of this reporter + biometric", not "this exact phone". Device-bound keys come with native attestation | ⚠ documented |
| T7 | A remote proof server sees the witnesses (pk, path) | Wave 2–3: proof server run by the pool or self-hosted. Later: on-device proving (Midnight mobile SDK roadmap) or a TEE prover | ⚠ documented |
| T8 | A4 correlates submission time / IP with a reporter | Relay with batching and jitter; seal time recorded as a window, not the exact second | Wave 3 |
| T9 | A3 enrolls fake devices to seal fakes | Admin actions are public and auditable; multi-admin threshold enrollment (Wave 4); pools display their admins | ⚠ trust in pool admin |
| T10 | A3 deanonymises via a tiny pool | `minPoolSize` enforced in-circuit: sealing refused (`POOL_TOO_SMALL`) until the pool has ≥ N devices (default 20); pool size shown on every seal | ✅ (tested) |
| T11 | Image content identifies the photographer (reflections, location) | Out of scope for cryptography. In-app guidance and optional face/plate blurring before sealing (Wave 4) | ⚠ |
| T12 | A2 re-shares a real sealed image with misleading context | Out of scope. A seal proves capture, not context. Copy says so explicitly | — |

## Residual risk statement (shown in the app)
"A seal proves a real, unedited photo from an enrolled device in this pool, approved by a person. It does not prove what the photo means. Your anonymity is as strong as the pool is large."
