# Unforged — Vision

> **The trust layer for digital evidence, with minimum necessary disclosure.**

## Mission

Make digital evidence independently verifiable without turning provenance infrastructure into a directory of reporters, witnesses, employees, investigators or devices.

## The category

Unforged is privacy-preserving evidence infrastructure. It connects capture hardware, organizations, publishers and public verifiers through a shared rule:

> Prove that an asset passed an authorized workflow. Reveal only the evidence the recipient needs.

The initial product protects photographs contributed to newsrooms. The platform expands to video, audio, documents, insurance claims, human-rights evidence, scientific field records, marketplace listings and AI training-data provenance.

## The problem

Digital provenance has two incomplete defaults:

1. **Public identity:** a signature establishes a known device or signer but can expose a vulnerable contributor and create a durable activity graph.
2. **Centralized privacy:** a service hides the public identity but still sees the signer-to-asset relationship and can change, suppress or selectively report records.

Organizations need a third option: publicly verifiable authorization with private membership. An editor should be able to establish that one credential in an approved pool authorized an exact asset without the public record identifying the credential.

## Product promise

For every asset, Unforged answers four separate questions:

| Question | Product response |
|---|---|
| Did an authorized credential approve these bytes? | Proved by the Midnight contract |
| What capture or editing evidence accompanies the asset? | Represented through C2PA-compatible provenance |
| Is the credential still trusted under organization policy? | Evaluated against pool epoch, revocation and policy |
| What remains a human judgment? | Shown explicitly: scene truth, context, intent and source safety outside the record |

The product never collapses these questions into an “authentic” badge.

## Why Midnight is essential

Unforged depends on five Midnight properties working together:

- private witness state for credential keys, salts, signatures and membership paths;
- public contract state for commitments, policy, revocation epochs and seal records;
- programmable disclosure that publishes a narrow result rather than the underlying identity;
- TypeScript-aligned Compact development for product integration;
- a public verification layer that removes Unforged as the sole source of truth.

Without private smart-contract execution, the system must expose the credential, trust a centralized verifier, or create a separate cryptographic network. Midnight supplies the public/private boundary as infrastructure.

## Platform products

### Capture

Native and SDK-based capture using hardware-protected keys, application attestation, C2PA manifests, offline queues and organization policy.

### Desk

An evidence workspace for validation, contextual review, approval, disclosure requests, incident response and publication.

### Trust Pools

Private organizational authorization networks with threshold administration, temporary credentials, revocation, minimum anonymity and aggregate operations.

### Verify

Public web, API, SDK, CMS and browser integrations that explain assurance level, provenance history, policy and unresolved claims.

### Relay

Batched and privacy-preserving submission infrastructure designed to reduce IP, timing and proof-generation correlation.

### Platform

Capture SDK, Verify API, C2PA privacy bridge, policy engine, self-hosted enterprise edition and OEM integrations.

## C2PA strategy

C2PA is the interoperability layer for media provenance. Unforged does not replace it. Unforged contributes a private organizational-authorization proof that can travel with, or be referenced from, a C2PA manifest.

The intended production flow is:

1. supported hardware creates capture evidence;
2. the client creates or preserves a C2PA manifest;
3. Midnight proves private pool membership and organization policy;
4. a source-safe bridge binds the proof reference to the manifest;
5. editors and public validators inspect both provenance and private authorization;
6. soft bindings help recover provenance after metadata stripping or re-encoding.

## Beachhead and expansion

1. **Newsrooms and fact-checkers:** protect freelancers, stringers and sensitive contributors.
2. **Human-rights and election organizations:** preserve evidence while reducing witness exposure.
3. **Insurance and legal evidence:** prove authorized capture and chain of custody.
4. **Science and supply chains:** establish field origin and approved workflow.
5. **Platforms, camera makers and AI ecosystems:** embed private provenance verification at global volume.

## Five-year ambition

Unforged becomes the neutral trust layer used when an asset must be verified across organizational boundaries but the contributor, device or underlying data must remain private.

The network effect comes from interoperability and trust:

- more compatible capture devices increase supply;
- more organizational pools increase useful authorization;
- more publishers and platforms increase verification demand;
- more verifiers make evidence portable;
- shared standards reduce integration cost for every participant.

## Principles

1. **Prove narrowly.** Every result names exactly what was established.
2. **Collect less.** Data that is unnecessary for verification is excluded by construction.
3. **Interoperate.** Use C2PA and platform security primitives rather than inventing incompatible formats.
4. **Make refusal visible.** Failed proofs and policy boundaries are product behavior.
5. **Protect against operations, not only cryptography.** Network, timing, enrollment and administrator metadata belong in the threat model.
6. **Keep users out of crypto mechanics.** Contributors see approval, evidence and status; pools sponsor fees.
7. **Earn trust through evidence.** Compiles, tests, deployments, audits, pilots and measured reliability support every claim.

## Current boundary

Wave 2 proves the core primitive in a local Compact runtime: anonymous pool membership plus a real P-256 WebAuthn assertion bound to an exact file fingerprint. It does not establish camera sensor origin, public-network inclusion, durable anonymity against network observers or production organizational controls. Those are explicit release gates in the [PRD](PRD.md), [Threat model](THREAT-MODEL.md) and [Roadmap](ROADMAP.md).
