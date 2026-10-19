import { useState } from "react";
import { Icon } from "../components/Icon";
import { PoolRing } from "../components/PoolRing";
import { MIN_POOL, revokeReporter, useStore } from "../store";
import { PageHead } from "./Studio";
import { toast } from "./toast";

export function PoolScreen() {
  const s = useStore();
  const [confirm, setConfirm] = useState<number>();
  const [busy, setBusy] = useState<number>();
  const l = s.pool!.ledger;
  const phones = Number(l.deviceCount);
  const atFloor = phones <= MIN_POOL;

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
      <PageHead title="Independent Press Pool" purpose="A local source-pool evaluation. Admins can remove credentials; the seal registry does not disclose which credential approved a file. Production enrollment and access controls remain to be built." />
      <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
        <section className="panel pool-summary" aria-label="Pool summary">
          <PoolRing size={phones} min={MIN_POOL} px={132} />
          <dl className="kv">
            <div><dt>Enrolled phones</dt><dd><b>{phones}</b>, sealing allowed from {MIN_POOL}</dd></div>
            <div><dt>Seals recorded</dt><dd><b>{String(l.sealCount)}</b></dd></div>
            <div><dt>Removals (epoch)</dt><dd><b>{String(l.epoch)}</b></dd></div>
            <div><dt>Network fees</dt><dd>Sponsored by the pool. Reporters never hold tokens.</dd></div>
          </dl>
        </section>

        <section aria-labelledby="devices-title" className="stack" style={{ "--gap": "12px" } as React.CSSProperties}>
          <h2 id="devices-title" className="title">Enrolled devices</h2>
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
          {atFloor && <p className="meta" style={{ margin: 0 }}>Removal is paused: the pool is at its anonymity floor of {MIN_POOL} phones. Removing more would stop everyone from sealing.</p>}
          {confirm !== undefined && <p className="meta" style={{ margin: 0 }}>Removing a phone can't be undone in this demo. Its earlier seals stay valid; new seals from it will fail.</p>}
        </section>

        <div className="status status-info">
          <Icon name="lock" />
          <p><strong>What this registry withholds</strong>The seal does not contain a signer-to-file link, location or hardware identifier. Admins can know enrollment identities, and timing or network data can still reveal a source without operational protections. The local ledger stores opaque credential commitments.</p>
        </div>
      </div>
    </>
  );
}
