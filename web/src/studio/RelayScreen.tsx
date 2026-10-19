import { Icon } from "../components/Icon";
import { href } from "../lib/route";
import { RELAY_BATCH, RELAY_WINDOW, useStore } from "../store";
import { PageHead } from "./Studio";

const VIEWS = [
  { who: "Relay operator", sees: "When a finished submission arrived", never: "Contributor key, identity or which file is theirs after shuffling" },
  { who: "Public ledger", sees: "A batch of seals in shuffled order, each stamped with an hour window", never: "Arrival order, exact capture second or signer" },
  { who: "Evidence desk", sees: "The sealed file, its case and assurance level", never: "Which pool member submitted it" },
];

export function RelayScreen() {
  const s = useStore();
  const relayed = s.batches.reduce((n, b) => n + b.order.length, 0);
  const fromCapture = s.batches.reduce((n, b) => n + b.order.filter((o) => o.source === "capture").length, 0);
  const mine = new Set(s.seals.filter((r) => r.byYou).map((r) => r.id));

  return (
    <>
      <PageHead
        eyebrow="PRIVACY OPERATIONS / 06"
        title="Submission relay"
        purpose="Zero-knowledge hides the signer from the ledger; timing can still betray them. The relay batches submissions, shuffles their order and publishes capture time to the hour before anything reaches the contract."
      />
      <dl className="desk-metrics">
        <div><dt>Batches released</dt><dd>{String(s.batches.length).padStart(2, "0")}</dd></div>
        <div><dt>Submissions relayed</dt><dd>{String(relayed).padStart(2, "0")}</dd></div>
        <div><dt>Batch size</dt><dd>{RELAY_BATCH}</dd></div>
        <div><dt>Time precision</dt><dd>{RELAY_WINDOW / 3600} h</dd></div>
        <div><dt>From capture clients</dt><dd>{String(fromCapture).padStart(2, "0")}</dd></div>
      </dl>

      <div className="relay">
        <section className="relay-log" aria-labelledby="batches-title">
          <div className="registry-head"><div><span className="label">RELEASE LOG</span><h2 id="batches-title" className="title">Batches submitted to the contract</h2></div></div>
          {s.batches.length === 0 ? (
            <div className="desk-empty">
              <Icon name="relay" size={28} />
              <h3 className="title">No batches yet</h3>
              <p className="meta">Every capture sealed in this workspace travels through the relay.</p>
              <a className="btn btn-primary" href={href({ page: "studio", tab: "seal" })}>Capture and seal <Icon name="arrow" size={18} /></a>
            </div>
          ) : (
            <ol className="batches">
              {s.batches.map((b) => (
                <li key={b.no}>
                  <div className="batch-head">
                    <strong>Batch #{b.no}</strong>
                    <span className="meta">{new Date(b.releasedAt).toLocaleTimeString()} · held {Math.max(1, Math.round(b.waitedMs))} ms · window {new Date(Math.floor(b.releasedAt / 1000 / b.window) * b.window * 1000).toISOString().slice(11, 16)} UTC</span>
                  </div>
                  <ol className="batch-order">
                    {b.order.map((o, i) => (
                      <li key={o.id}>
                        <span className="data">{String(i + 1).padStart(2, "0")}</span>
                        <span className="data">{o.id}</span>
                        <span className={mine.has(o.id) ? "chip chip-seal" : "chip"}>{mine.has(o.id) ? "Your capture" : o.source === "capture" ? "Capture" : "Pool traffic"}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="relay-side">
          <section aria-labelledby="sees-title" className="case-section">
            <h2 id="sees-title" className="label">WHO SEES WHAT</h2>
            <dl className="relay-views">
              {VIEWS.map((v) => (
                <div key={v.who}>
                  <dt>{v.who}</dt>
                  <dd><span><Icon name="check" size={14} /> {v.sees}</span><span><Icon name="lock" size={14} /> {v.never}</span></dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="status status-info">
            <Icon name="info" />
            <p>
              <strong>Evaluation boundary</strong>
              Here the relay runs in this browser tab, and simulated pool members fill each batch at once. A production relay receives only finished proofs over an anonymizing transport, closes batches on size or timer, and runs as several independent operators.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
