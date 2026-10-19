import { useEffect, useState } from "react";
import { Stamp } from "../components/Stamp";
import { Glyph } from "../components/Glyph";
import { toHex } from "../engine/bytes";
import { useStore, verifyBytes, type SealRecord, type VerifyResult } from "../store";

type Tab = "world" | "private" | "yourself";

export function Verify({ preset }: { preset?: SealRecord }) {
  const s = useStore();
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<VerifyResult>();
  const [name, setName] = useState<string>();
  const [tab, setTab] = useState<Tab>("world");

  async function check(bytes: Uint8Array, label: string) {
    setName(label);
    setResult(await verifyBytes(bytes));
  }

  useEffect(() => {
    if (preset) void check(preset.bytes, `${preset.id}.jpg`);
  }, [preset]);

  async function onFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) await check(new Uint8Array(await f.arrayBuffer()), f.name);
  }

  const record = result?.kind === "sealed" ? s.seals.find((x) => toHex(x.fp) === toHex(result.fp)) : undefined;

  return (
    <div className="grid two">
      <div className="card">
        <div className="eyebrow">Verify · free, no account</div>
        <h2>Is this photo real?</h2>
        <label
          className={`drop${over ? " over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); void onFiles(e.dataTransfer.files); }}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFiles(e.target.files)} />
          <div className="serif" style={{ fontSize: 26 }}>Drop a photo to check its seal</div>
          <div className="muted" style={{ fontSize: 14 }}>The file is fingerprinted in your browser. It is never uploaded.</div>
        </label>
        {s.seals.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginTop: 18 }}>Or pick a recently sealed photo</div>
            <div className="thumbs">
              {s.seals.slice(0, 8).map((r) => (
                <button key={r.id} onClick={() => void check(r.bytes, `${r.id}.jpg`)} aria-label={`Verify ${r.id}`}>
                  <img src={r.url} alt="" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card" aria-live="polite">
        {!result && (
          <>
            <div className="eyebrow">Result</div>
            <p className="muted">A seal proves three things: the photo was captured on an enrolled phone, a person approved it, and not one byte has changed since.</p>
          </>
        )}
        {result?.kind === "sealed" && (
          <>
            <div className="verdict">
              <Stamp id={result.id} size={116} />
              <div>
                <span className="badge ok">✓ Sealed on Midnight</span>
                <h2 style={{ marginTop: 6 }}>Sealed.</h2>
                <div className="muted mono">{name}</div>
              </div>
            </div>
            <ul className="ticks">
              <li>Captured on an enrolled phone in this pool</li>
              <li>Approved by a person (biometric or PIN)</li>
              <li>Unchanged since capture, byte for byte</li>
            </ul>
            <p style={{ marginBottom: 0 }}>
              Taken <b>{new Date(result.takenAt * 1000).toLocaleString()}</b> · Pool of <b>{result.poolSize} phones</b> · Photographer <b>hidden</b>
            </p>
            {result.removedSince > 0 && (
              <p className="badge warn" style={{ marginTop: 10 }}>{result.removedSince} phone(s) removed from this pool since</p>
            )}
            <div className="tabs" role="tablist" style={{ marginTop: 18 }}>
              {(["world", "private", "yourself"] as Tab[]).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                  {t === "world" ? "What the world sees" : t === "private" ? "What stays private" : "Check it yourself"}
                </button>
              ))}
            </div>
            {tab === "world" && (
              <dl className="kv">
                <div><dt>Fingerprint (SHA-256)</dt><dd className="mono row" style={{ gap: 8 }}><Glyph fp={result.fp} size={28} />{toHex(result.fp)}</dd></div>
                <div><dt>Capture time</dt><dd>{new Date(result.takenAt * 1000).toISOString()}</dd></div>
                <div><dt>Pool epoch at sealing</dt><dd>{String(result.epoch)}</dd></div>
              </dl>
            )}
            {tab === "private" && (
              <dl className="kv">
                <div><dt>Which phone</dt><dd><span className="redacted">phone #?? of {result.poolSize}</span> · not stored anywhere</dd></div>
                <div><dt>Who took it</dt><dd><span className="redacted">reporter name here</span> · not stored anywhere</dd></div>
                <div><dt>Device key, signature, Merkle path</dt><dd>Private inputs to the proof. They never left the phone.</dd></div>
                <div><dt>GPS, camera serial, EXIF</dt><dd>Never collected.</dd></div>
                {record?.byYou && <p className="notice" style={{ margin: 0 }}>You sealed this one. Only this browser knows that.</p>}
              </dl>
            )}
            {tab === "yourself" && (
              <dl className="kv">
                <div><dt>Contract (pool)</dt><dd className="mono">{s.pool?.address}</dd></div>
                <div><dt>Ledger query</dt><dd className="mono">seals.lookup(0x{toHex(result.fp).slice(0, 16)}…)</dd></div>
                <div><dt>Recompute the fingerprint</dt><dd className="mono">sha256sum {name}</dd></div>
              </dl>
            )}
          </>
        )}
        {result?.kind === "none" && (
          <>
            <span className="badge no">No seal found</span>
            <h2 style={{ marginTop: 8 }}>No seal found.</h2>
            <p className="muted">
              That doesn't mean it's fake. It means this exact file wasn't sealed with Unforged, or it was changed after sealing (edited, cropped, re-compressed).
            </p>
            <dl className="kv">
              <div><dt>Fingerprint checked</dt><dd className="mono">{toHex(result.fp)}</dd></div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
