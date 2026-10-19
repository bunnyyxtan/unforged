import { useState } from "react";
import { PoolRing } from "../components/PoolRing";
import { MIN_POOL, revokeReporter, useStore } from "../store";

export function PoolDesk() {
  const s = useStore();
  const [busy, setBusy] = useState<number>();
  const l = s.pool?.ledger;
  const size = Number(l?.deviceCount ?? 0);

  async function revoke(index: number) {
    setBusy(index);
    try { await revokeReporter(index); } finally { setBusy(undefined); }
  }

  return (
    <div className="grid two">
      <div className="card">
        <div className="eyebrow">Desk · pool admin view</div>
        <h2>Independent Press Pool</h2>
        <div className="row" style={{ gap: 22, margin: "12px 0" }}>
          <PoolRing size={size} min={MIN_POOL} px={120} />
          <dl className="kv" style={{ margin: 0 }}>
            <div><dt>Enrolled phones</dt><dd><b>{size}</b> (minimum {MIN_POOL} to seal)</dd></div>
            <div><dt>Seals recorded</dt><dd><b>{String(l?.sealCount ?? 0n)}</b></dd></div>
            <div><dt>Epoch (revocations)</dt><dd><b>{String(l?.epoch ?? 0n)}</b></dd></div>
            <div><dt>Network fees</dt><dd>Sponsored by the pool (reporters never hold tokens)</dd></div>
          </dl>
        </div>
        <p className="notice">
          As admin you can enroll and remove phones. You <b>cannot</b> see which phone made which seal. That record doesn't exist anywhere, not even here.
        </p>
      </div>

      <div className="card">
        <div className="eyebrow">Enrolled devices (as stored on Midnight)</div>
        <ul className="devices">
          {s.me && (
            <li>
              <span className="you">You</span>
              <span className="mono">{s.me.commitment.slice(0, 22)}…</span>
              <span className="muted" style={{ fontSize: 12 }}>{s.me.mode === "passkey" ? "real passkey" : "simulated"}</span>
            </li>
          )}
          {s.reporters.map((r) => (
            <li key={r.index} className={r.revoked ? "revoked" : ""}>
              <span className="muted" style={{ fontSize: 12, minWidth: 92 }}>{r.name}</span>
              <span className="mono">{r.commitment.slice(0, 22)}…</span>
              {r.revoked ? (
                <span className="badge bad">removed</span>
              ) : (
                <button className="btn ghost small" disabled={busy !== undefined || size <= MIN_POOL} onClick={() => revoke(r.index)}>
                  {busy === r.index ? "…" : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13 }}>
          Names are the admin's private notes. On chain each phone is only an opaque commitment: H(key, salt, policy).
        </p>
      </div>
    </div>
  );
}
