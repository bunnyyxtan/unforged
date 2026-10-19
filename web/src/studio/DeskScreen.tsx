import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Icon } from "../components/Icon";
import { Seal } from "../components/Seal";
import { c2paAssertion, downloadJson, reportRows, type Evidence } from "../lib/evidence";
import { href } from "../lib/route";
import { CHECKS, decide, toggleCheck, useStore, type CaseStatus, type EvidenceCase, type SealRecord } from "../store";
import { Ladder, Report } from "./EvidenceReport";
import { PageHead } from "./Studio";
import { toast } from "./toast";

const STATUS: Record<CaseStatus, { label: string; chip: string }> = {
  new: { label: "New", chip: "chip" },
  review: { label: "In review", chip: "chip chip-warn" },
  approved: { label: "Approved", chip: "chip chip-ok" },
  held: { label: "Held", chip: "chip chip-danger" },
  published: { label: "Published", chip: "chip chip-seal" },
};

const HOLD_REASONS = ["Needs an independent second source", "Contributor safety concern", "Possible manipulation or staging", "Context unclear"];

const time = (ms: number) => new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function DeskScreen() {
  const s = useStore();
  const [selected, setSelected] = useState<string>();
  const current = s.cases.find((c) => c.id === selected) ?? s.cases[0];
  const count = (st: CaseStatus[]) => s.cases.filter((c) => st.includes(c.status)).length;

  return (
    <>
      <PageHead
        eyebrow="EVIDENCE OPERATIONS / 02"
        title="Evidence desk"
        purpose="Every sealed submission arrives as a case. Review what cryptography established, record the human judgment, and publish a package readers can verify. Contributors stay withheld from the desk."
      />
      <dl className="desk-metrics">
        <div><dt>Open</dt><dd>{String(count(["new", "review"])).padStart(2, "0")}</dd></div>
        <div><dt>Held</dt><dd>{String(count(["held"])).padStart(2, "0")}</dd></div>
        <div><dt>Approved</dt><dd>{String(count(["approved"])).padStart(2, "0")}</dd></div>
        <div><dt>Published</dt><dd>{String(count(["published"])).padStart(2, "0")}</dd></div>
        <div><dt>Contributor identity</dt><dd className="desk-withheld"><Icon name="lock" size={16} /> Withheld</dd></div>
      </dl>

      {s.cases.length === 0 ? (
        <div className="desk-empty">
          <Icon name="desk" size={28} />
          <h2 className="title">No submissions yet</h2>
          <p className="meta">Sealed captures arrive here automatically.</p>
          <a className="btn btn-primary" href={href({ page: "studio", tab: "seal" })}>Capture and seal <Icon name="arrow" size={18} /></a>
        </div>
      ) : (
        <div className="desk">
          <nav className="desk-queue" aria-label="Case queue">
            <span className="label">CASE QUEUE · {s.cases.length}</span>
            <ul>
              {s.cases.map((c) => {
                const rec = s.seals.find((r) => r.id === c.sealId);
                return (
                  <li key={c.id}>
                    <button aria-current={current?.id === c.id ? "true" : undefined} onClick={() => setSelected(c.id)}>
                      {rec && <img src={rec.url} alt="" />}
                      <span className="desk-queue-copy">
                        <span className="data">{c.id} · {rec?.level}</span>
                        <strong>{c.title}</strong>
                        <span className="meta">Received {time(c.receivedAt)}</span>
                      </span>
                      <span className={STATUS[c.status].chip}>{STATUS[c.status].label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {current && <CaseFile key={current.id} c={current} />}
        </div>
      )}
    </>
  );
}

function CaseFile({ c }: { c: EvidenceCase }) {
  const s = useStore();
  const reduce = useReducedMotion();
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState(HOLD_REASONS[0]);
  const rec = s.seals.find((r) => r.id === c.sealId) as SealRecord;
  const pool = s.pool!;
  const onLedger = pool.lookup(rec.fp);
  const l = pool.ledger;
  const evidence: Evidence = {
    id: rec.id,
    fp: rec.fp,
    takenAt: Number(onLedger?.takenAt ?? rec.takenAt),
    epoch: onLedger?.epoch ?? rec.epoch,
    poolSize: Number(l.deviceCount),
    removedSince: Number(l.epoch - (onLedger?.epoch ?? rec.epoch)),
    poolAddress: pool.address,
    level: rec.level,
    batch: rec.batch,
    case: c,
  };
  const rows = reportRows(evidence);
  const done = c.checks.filter(Boolean).length;
  const complete = done === CHECKS.length;
  const closed = c.status === "published";
  const columns: { title: string; claims: string[] }[] = [
    { title: "Established", claims: ["Established"] },
    { title: "Asserted", claims: ["Asserted"] },
    { title: "Human-reviewed", claims: ["Reviewed"] },
    { title: "Unresolved", claims: ["Unresolved", "Unavailable"] },
  ];

  function publish() {
    decide(c.id, "published");
    toast(`${c.id} published with a verification package`);
  }

  return (
    <motion.article className="case" aria-labelledby="case-title" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <header className="case-head">
        <div>
          <span className="label">{c.id} · SEAL {rec.id}</span>
          <h2 id="case-title" className="heading">{c.title}</h2>
        </div>
        <span className={STATUS[c.status].chip}>{STATUS[c.status].label}</span>
      </header>

      <div className="case-media">
        <figure className="case-figure">
          <img src={rec.url} alt={`Submitted evidence for ${c.id}`} />
          <figcaption className="meta">{rec.byYou ? "Captured on this device" : "Sample submission · simulated pool credential"}</figcaption>
        </figure>
        <div className="case-seal">
          <Seal fp={rec.fp} id={rec.id} size={112} />
          <dl className="case-facts">
            <div><dt>Contributor</dt><dd><Icon name="lock" size={14} /> Withheld · pool member</dd></div>
            <div><dt>Pool</dt><dd>Independent Press Pool · {evidence.poolSize} credentials</dd></div>
            <div><dt>Policy epoch</dt><dd className="data">{String(evidence.epoch)}</dd></div>
          </dl>
          <Ladder level={rec.level} />
        </div>
      </div>

      {evidence.removedSince > 0 && (
        <div className="status status-warn">
          <Icon name="info" />
          <p><strong>The pool changed after this seal.</strong>{evidence.removedSince} credential{evidence.removedSince > 1 ? "s were" : " was"} revoked since. This seal stays valid; check whether the incident affects the submission.</p>
        </div>
      )}

      <section aria-labelledby="matrix-title" className="case-section">
        <h3 id="matrix-title" className="label">EVIDENCE MATRIX</h3>
        <div className="matrix">
          {columns.map((col) => {
            const items = rows.filter((r) => col.claims.includes(r.claim));
            const reviewed = col.title === "Human-reviewed" ? CHECKS.filter((_, i) => c.checks[i]) : [];
            return (
              <div key={col.title} className={`matrix-col matrix-${col.title.toLowerCase().replace(/[^a-z]/g, "")}`}>
                <span className="matrix-title">{col.title}</span>
                {items.map((r) => <p key={r.label}><strong>{r.label}</strong>{r.value}</p>)}
                {reviewed.map((label) => <p key={label}><strong>Checklist</strong>{label}</p>)}
                {items.length + reviewed.length === 0 && <p className="meta">Nothing yet</p>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="case-work">
        <section aria-labelledby="checks-title" className="case-section">
          <h3 id="checks-title" className="label">EDITORIAL CHECKLIST · {done}/{CHECKS.length}</h3>
          <ul className="checklist">
            {CHECKS.map((label, i) => (
              <li key={label}>
                <label>
                  <input type="checkbox" checked={c.checks[i]} disabled={closed} onChange={() => toggleCheck(c.id, i)} />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="case-actions">
            {c.status !== "approved" && !closed && (
              <button className="btn btn-primary" disabled={!complete} onClick={() => decide(c.id, "approved")}>
                <Icon name="check" size={18} /> Approve
              </button>
            )}
            {c.status === "approved" && (
              <button className="btn btn-primary" onClick={publish}><Icon name="upload" size={18} /> Publish with proof</button>
            )}
            {!closed && c.status !== "held" && !holding && (
              <button className="btn btn-secondary" onClick={() => setHolding(true)}>Hold</button>
            )}
            {c.status === "held" && <button className="btn btn-secondary" onClick={() => decide(c.id, "review", "Hold released")}>Release hold</button>}
          </div>
          {!complete && !closed && <p className="meta" style={{ margin: 0 }}>Approval unlocks when every check is complete. The seal alone never approves a story.</p>}
          {holding && (
            <div className="hold-form">
              <label className="label" htmlFor="hold-reason">HOLD REASON</label>
              <select id="hold-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                {HOLD_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <div className="cluster">
                <button className="btn btn-danger btn-sm" onClick={() => { decide(c.id, "held", reason); setHolding(false); }}>Hold case</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setHolding(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="log-title" className="case-section">
          <h3 id="log-title" className="label">DECISION LOG</h3>
          <ol className="decision-log">
            {[...c.log].reverse().map((e, i) => (
              <li key={i}><span className="data">{time(e.at)}</span><span><strong>{e.actor}</strong>{e.text}</span></li>
            ))}
          </ol>
        </section>
      </div>

      <AnimatePresence initial={false}>
        {closed && (
          <motion.section className="case-section package" aria-labelledby="package-title" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="package-head">
              <div><span className="label">PUBLICATION PACKAGE</span><h3 id="package-title" className="title">What readers can verify</h3></div>
              <div className="cluster">
                <button className="btn btn-secondary btn-sm" onClick={() => downloadJson(`${rec.id}-c2pa-assertion.json`, c2paAssertion(evidence))}>
                  <Icon name="download" size={16} /> C2PA assertion (draft)
                </button>
                <a className="btn btn-quiet btn-sm" href={href({ page: "studio", tab: "verify" })} onClick={() => sessionStorage.setItem("unforged:verify", rec.id)}>
                  Open public check <Icon name="arrow" size={16} />
                </a>
              </div>
            </div>
            <Report evidence={evidence} />
          </motion.section>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
