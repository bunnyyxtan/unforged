import { Icon } from "../components/Icon";
import { reportRows, type Claim, type Evidence } from "../lib/evidence";
import { LEVELS, type Level } from "../store";

const CLAIM_ICON: Record<Claim, "check" | "info" | "alert" | "x" | "verify"> = {
  Established: "check",
  Asserted: "info",
  Reviewed: "verify",
  Unresolved: "alert",
  Unavailable: "x",
};

/** Security report: value plus how it is known, for every row. */
export function Report({ evidence }: { evidence: Evidence }) {
  return (
    <dl className="report">
      {reportRows(evidence).map((r) => (
        <div key={r.label} className="report-row">
          <dt>{r.label}</dt>
          <dd>
            <strong>{r.value}</strong>
            <span className="meta">{r.note}</span>
          </dd>
          <span className={`claim claim-${r.claim.toLowerCase()}`}><Icon name={CLAIM_ICON[r.claim]} size={13} />{r.claim}</span>
        </div>
      ))}
    </dl>
  );
}

/** L0–L5 assurance ladder with the achieved level marked. */
export function Ladder({ level }: { level?: Level }) {
  const at = level ? LEVELS.findIndex((l) => l.id === level) : -1;
  return (
    <ol className="ladder" aria-label={level ? `Assurance level ${level} of L5` : "Assurance level not stated"}>
      {LEVELS.map((l, i) => (
        <li key={l.id} className={i < at ? "below" : i === at ? "at" : ""} aria-current={i === at ? "step" : undefined}>
          <span className="data">{l.id}</span>
          <span>{l.name}</span>
        </li>
      ))}
    </ol>
  );
}
