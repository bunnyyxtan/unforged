import { Glyph } from "../components/Glyph";
import { toHex } from "../engine/bytes";
import { useStore } from "../store";

export function HowItWorks() {
  const s = useStore();
  const last = s.seals[0];
  return (
    <div className="grid" style={{ gap: 22 }}>
      <div className="split">
        <div>
          <div className="eyebrow">On Midnight: what the world sees</div>
          <h2 className="serif" style={{ fontSize: 30, margin: 0 }}>Public</h2>
          {last ? (
            <dl className="kv">
              <div><dt>Photo fingerprint</dt><dd className="mono row" style={{ gap: 8 }}><Glyph fp={last.fp} size={26} />{toHex(last.fp).slice(0, 32)}…</dd></div>
              <div><dt>Capture time</dt><dd>{new Date(last.takenAt * 1000).toISOString()}</dd></div>
              <div><dt>Pool epoch</dt><dd>{String(last.epoch)}</dd></div>
              <div><dt>Membership root</dt><dd>Shared by all {String(s.pool?.ledger.deviceCount)} phones. Identifies no one.</dd></div>
            </dl>
          ) : (
            <p className="muted">Seal a photo to fill this in with your own data.</p>
          )}
        </div>
        <div>
          <div className="eyebrow">Never leaves the phone</div>
          <h2 className="serif" style={{ fontSize: 30, margin: 0 }}>Private</h2>
          {last ? (
            <dl className="kv">
              {last.privateInputs.map((p) => (
                <div key={p.label}><dt>{p.label}</dt><dd className="mono">{p.value}</dd></div>
              ))}
            </dl>
          ) : (
            <p className="muted">Your device key, salt, Merkle path and passkey signature will appear here, from this browser only.</p>
          )}
        </div>
      </div>

      <div className="grid three">
        <div className="card">
          <div className="eyebrow">1 · Enroll</div>
          <h3>A passkey in the secure chip</h3>
          <p className="muted">The phone creates a P-256 passkey (Secure Enclave, StrongBox, TPM). The pool stores only H(key, salt, policy) in a Merkle tree.</p>
        </div>
        <div className="card">
          <div className="eyebrow">2 · Seal</div>
          <h3>Sign this photo, for this pool</h3>
          <p className="muted">The chip signs H(pool, SHA-256(photo)) after Face ID. The Compact circuit rebuilds the WebAuthn bytes and verifies P-256 <i>inside</i> the proof.</p>
        </div>
        <div className="card">
          <div className="eyebrow">3 · Verify</div>
          <h3>Anyone, in a second</h3>
          <p className="muted">Fingerprint the file and look it up. Sealed means a real capture on an enrolled phone, approved by a person, unchanged.</p>
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">Built on Midnight</div>
        <p style={{ margin: 0 }}>
          <b>unforged.compact</b> uses Compact 0.35's <span className="mono">secp256r1EcdsaVerify</span> (ZKIR v3, ledger 9), a <span className="mono">HistoricMerkleTree</span> for anonymous membership,
          and selective disclosure: only the fingerprint, time and epoch are ever <span className="mono">disclose()</span>d. This page runs the real compiled contract on Midnight's
          compact-runtime in your browser. Network deployment follows the ledger-9 fork.
        </p>
      </div>
    </div>
  );
}
