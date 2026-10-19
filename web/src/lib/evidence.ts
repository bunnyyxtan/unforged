import { base64url, toHex } from "../engine/bytes";
import { CHECKS, LEVELS, MIN_POOL, type EvidenceCase, type Level } from "../store";

/** Claim labels from docs/DESIGN.md → Content system. */
export type Claim = "Established" | "Asserted" | "Reviewed" | "Unresolved" | "Unavailable";

export type Evidence = {
  id: string;
  fp: Uint8Array;
  takenAt: number;
  epoch: bigint;
  poolSize: number;
  removedSince: number;
  poolAddress: string;
  level?: Level;
  case?: EvidenceCase;
};

export type ReportRow = { label: string; value: string; claim: Claim; note: string };

const levelName = (l?: Level) => LEVELS.find((x) => x.id === l);

/** The verifier's security report: every row states how it is known. */
export function reportRows(e: Evidence): ReportRow[] {
  const level = levelName(e.level);
  const reviewed = e.case && (e.case.status === "approved" || e.case.status === "published");
  return [
    {
      label: "Capture assurance",
      value: level ? `${level.id} · ${level.name}` : "Not stated",
      claim: level ? "Asserted" : "Unavailable",
      note: level ? "Stated by the capture client; the circuit verifies the signature, not the hardware class." : "No capture-client record accompanies this file.",
    },
    {
      label: "Organization authority",
      value: `Verified privately · 1 of ${e.poolSize} credentials`,
      claim: "Established",
      note: "Anonymous Merkle membership proved inside the seal circuit.",
    },
    { label: "File integrity", value: "Exact original", claim: "Established", note: "SHA-256 of these bytes equals the sealed fingerprint." },
    { label: "Editing history", value: "No C2PA manifest attached", claim: "Unavailable", note: "Edits after sealing produce a different fingerprint and no seal." },
    {
      label: "Credential status",
      value: e.removedSince > 0 ? `Active at seal · pool changed ${e.removedSince}× since` : "Active at seal · pool unchanged",
      claim: "Established",
      note: `Accepted under pool epoch ${e.epoch}. Revocation stops future seals; earlier seals stay valid.`,
    },
    {
      label: "Capture time",
      value: new Date(e.takenAt * 1000).toISOString().replace(".000", ""),
      claim: "Established",
      note: "Bounded by ledger time: no later than sealing, no earlier than 24 h before.",
    },
    { label: "Source identity", value: "Withheld", claim: "Established", note: "No key, signature, path or contributor field exists in the seal record." },
    {
      label: "Scene truth",
      value: reviewed ? `Editorial review complete · ${e.case!.id}` : "Requires editorial review",
      claim: reviewed ? "Reviewed" : "Unresolved",
      note: reviewed ? "A desk editor completed the review checklist. This is a human judgment." : "Cryptography cannot establish what a photo depicts or means.",
    },
  ];
}

/**
 * Draft C2PA assertion carrying the private-authorization result.
 * Not a signed C2PA manifest: it is the payload a manifest would embed.
 */
export function c2paAssertion(e: Evidence) {
  const c = e.case;
  return {
    label: "org.unforged.authorization.v0",
    profile: "DRAFT · local evaluation · not embedded in or signed as a C2PA claim",
    data: {
      binding: { alg: "sha256", hash: base64url(e.fp), hex: toHex(e.fp), scope: "exact asset bytes (hard binding)" },
      authorization: {
        network: "midnight-local · ledger 9 runtime",
        contract: e.poolAddress,
        circuit: "seal",
        pool: "Independent Press Pool",
        policyEpoch: String(e.epoch),
        anonymityFloor: MIN_POOL,
        poolSizeAtVerification: e.poolSize,
        result: "member-of-pool, signer withheld",
      },
      assurance: e.level
        ? { level: e.level, basis: levelName(e.level)!.basis, claim: "asserted by capture client" }
        : { level: null, claim: "not stated" },
      time: { stated: new Date(e.takenAt * 1000).toISOString(), bound: "ledger time window 86400 s" },
      signer: { disclosure: "withheld" },
      editorial: c
        ? {
            case: c.id,
            status: c.status,
            checks: CHECKS.map((label, i) => ({ label, complete: c.checks[i] })),
            decisions: c.log.filter((l) => l.actor === "Desk editor").map((l) => ({ at: new Date(l.at).toISOString(), text: l.text })),
          }
        : null,
      notEstablished: ["camera sensor origin", "scene truth or context", "public-chain inclusion", "network or timing anonymity"],
    },
  };
}

export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
