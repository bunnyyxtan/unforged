import { useState } from "react";
import { Icon } from "../components/Icon";
import { PoolRing } from "../components/PoolRing";
import { APPROVERS, MIN_POOL, revokeReporter, THRESHOLD, useStore } from "../store";
import { PageHead } from "./Studio";
import { toast } from "./toast";

export function PoolScreen() {
  const s = useStore();
  const [confirm, setConfirm] = useState<number>();
  const [busy, setBusy] = useState<number>();
  const l = s.pool!.ledger;
  const phones = Number(l.deviceCount);
  const atFloor = phones <= MIN_POOL;
  const pending = Number(l.approvals.size());

  async function remove(index: number, name: string) {
    setBusy(index);
    try {
      await revokeReporter(index);
      toast(`${name} removed from the pool`);
    } finally {
      setBusy(undefined);
      setConfirm(undefined);
    }
  }

  return (
    <>
      <PageHead eyebrow="FOR TEAMS" title="Members" purpose="This is the trusted group that can seal photos. You can see how many members there are and remove one. You never see who sealed what." />
      <div className="pool-console">
        <section className="pool-command" aria-label="Pool summary">
          <div className="pool-identity">
            <PoolRing size={phones} min={MIN_POOL} px={136} />
            <div><span className="label">POOL STATUS</span><h2>Operational</h2><p>{phones} active credentials can issue seals without exposing which one signed.</p></div>
          </div>
          <dl className="pool-stat-grid">
            <div><dt>Credentials</dt><dd>{phones.toString().padStart(2, "0")}</dd><span>minimum {MIN_POOL}</span></div>
            <div><dt>Seals issued</dt><dd>{String(l.sealCount).padStart(2, "0")}</dd><span>current browser</span></div>
            <div><dt>Policy epoch</dt><dd>{String(l.epoch).padStart(2, "0")}</dd><span>revocation state</span></div>
          </dl>
          <div className="pool-policy"><Icon name="lock" size={18} /><div><span className="label">ENROLLMENT POLICY · ENFORCED IN CIRCUIT</span><strong>{THRESHOLD} of {APPROVERS.length} anonymous approvals</strong><p>{APPROVERS.join(", ")}. Each approval proves approver membership and spends a nullifier; the record never shows which approvers approved. {pending > 0 ? `${pending} credential${pending > 1 ? "s" : ""} awaiting approval.` : "No credentials awaiting approval."} The owner key alone cannot enroll.</p></div></div>
        </section>

        <section aria-labelledby="devices-title" className="device-registry">
          <div className="registry-head"><div><span className="label">CREDENTIAL REGISTRY</span><h2 id="devices-title" className="title">Enrolled devices</h2></div><span className="chip chip-ok"><span className="dot" />{phones} active</span></div>
          <div className="device-table-wrap">
          <table className="device-table">
            <thead><tr><th scope="col">Admin's label</th><th scope="col" className="col-commit">Local commitment</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {s.me && (
                <tr>
                  <td><span className="you">You</span> <span className="meta">({s.me.mode === "passkey" ? "passkey" : "simulated"})</span></td>
                  <td className="col-commit data">{s.me.commitment.slice(0, 18)}…</td>
                  <td><span className="chip chip-ok"><span className="dot" />Active</span></td>
                  <td />
                </tr>
              )}
              {s.reporters.map((r) => (
                <tr key={r.index} className={r.revoked ? "removed" : ""}>
                  <td>{r.name}</td>
                  <td className="col-commit data">{r.commitment.slice(0, 18)}…</td>
                  <td>{r.revoked ? <span className="chip">Removed</span> : <span className="chip chip-ok"><span className="dot" />Active</span>}</td>
                  <td>
                    {!r.revoked && confirm !== r.index && (
                      <button className="btn btn-quiet btn-sm" disabled={atFloor || busy !== undefined} onClick={() => setConfirm(r.index)}>Remove</button>
                    )}
                    {!r.revoked && confirm === r.index && (
                      <span className="cluster" style={{ justifyContent: "flex-end", "--gap": "6px" } as React.CSSProperties}>
                        <button className="btn btn-danger btn-sm" onClick={() => void remove(r.index, r.name)} aria-busy={busy === r.index}>
                          {busy === r.index ? <><span className="spinner" /> Removing</> : `Remove ${r.name}`}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(undefined)}>Cancel</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {atFloor && <p className="meta" style={{ margin: 0 }}>Removal is paused: the pool is at its anonymity floor of {MIN_POOL} phones. Removing more would stop everyone from sealing.</p>}
          {confirm !== undefined && <p className="meta" style={{ margin: 0 }}>Removing a phone can't be undone in this demo. Its earlier seals stay valid; new seals from it will fail.</p>}
        </section>

        <div className="pool-privacy">
          <Icon name="lock" />
          <div><span className="label">PRIVACY BOUNDARY</span><h3>Identity is governed; authorship stays private.</h3><p>The registry stores opaque credential commitments. A seal contains no signer-to-file link, location, or hardware identifier. Approvers may know whom they approved, while the relay reduces timing and ordering signals.</p></div>
        </div>
      </div>
    </>
  );
}
