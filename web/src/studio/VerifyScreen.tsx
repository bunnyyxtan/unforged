import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Seal } from "../components/Seal";
import { toHex } from "../engine/bytes";
import { href } from "../lib/route";
import { useStore, verifyBytes, type VerifyResult } from "../store";
import { PageHead } from "./Studio";

type View = "world" | "private" | "yourself";

export function VerifyScreen() {
  const s = useStore();
  const reduce = useReducedMotion();
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<VerifyResult>();
  const [file, setFile] = useState<string>();
  const [readError, setReadError] = useState(false);
  const [view, setView] = useState<View>("world");

  async function check(bytes: Uint8Array, name: string) {
    setReadError(false);
    setFile(name);
    setView("world");
    setResult(await verifyBytes(bytes));
  }

  async function onFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (bytes.length === 0) throw new Error("empty");
      await check(bytes, f.name);
    } catch {
      setResult(undefined);
      setReadError(true);
    }
  }

  // Arriving from "Verify this photo" on the Seal screen.
  useEffect(() => {
    const id = sessionStorage.getItem("unforged:verify");
    if (!id) return;
    sessionStorage.removeItem("unforged:verify");
    const rec = s.seals.find((r) => r.id === id);
    if (rec) void check(rec.bytes, `${rec.id}.jpg`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = result?.kind === "sealed" && s.seals.some((r) => toHex(r.fp) === toHex(result.fp));

  return (
    <>
      <PageHead title="Verify a photo" purpose="Drop any photo to check whether it carries a seal. The file is fingerprinted in your browser and never uploaded. Verifying is free and needs no account." />
      <div className="verify">
        <div className="stack" style={{ "--gap": "16px" } as React.CSSProperties}>
          <label
            className={`dropzone${over ? " over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); void onFiles(e.dataTransfer.files); }}
          >
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFiles(e.target.files)} />
            <span className="icon-wrap"><Icon name="upload" size={24} /></span>
            <span className="title">Drop a photo, or choose a file</span>
            <span className="meta">JPEG, PNG or any image. Checking takes a fraction of a second.</span>
          </label>
          {readError && (
            <div className="status status-error" role="alert">
              <Icon name="alert" />
              <p><strong>We couldn't read that file.</strong>It may be empty or still downloading. Choose it again, or try a different file.</p>
            </div>
          )}
          {s.seals.length > 0 ? (
            <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
              <span className="meta">Or check one you sealed in this session</span>
              <div className="thumbs">
                {s.seals.slice(0, 10).map((r) => (
                  <button key={r.id} onClick={() => void check(r.bytes, `${r.id}.jpg`)} aria-label={`Verify ${r.id}`}>
                    <img src={r.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="meta" style={{ margin: 0 }}>
              No sealed photos yet in this session. <a href={href({ page: "studio", tab: "seal" })}>Seal one</a>, then drop it here, or drop any other photo to see an unsealed result.
            </p>
          )}
        </div>

        <section className="panel result" aria-live="polite" aria-label="Verification result">
          <AnimatePresence mode="wait" initial={false}>
            {!result && (
              <motion.div key="empty" className="stack" style={{ "--gap": "16px" } as React.CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="title">What a seal tells you</h2>
                <ul className="facts">
                  <li><Icon name="check" size={16} /> The photo was captured on a phone enrolled in a known pool.</li>
                  <li><Icon name="check" size={16} /> A person approved it with their face, fingerprint or PIN.</li>
                  <li><Icon name="check" size={16} /> Not one byte has changed since it was sealed.</li>
                </ul>
                <p className="meta" style={{ margin: 0 }}>It never tells you who took it. That information is not recorded anywhere.</p>
              </motion.div>
            )}

            {result?.kind === "sealed" && (
              <motion.div key={`s-${toHex(result.fp)}`} className="stack" style={{ "--gap": "20px" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <div className="verdict">
                  <Seal fp={result.fp} id={result.id} size={128} />
                  <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                    <span className="chip chip-seal" style={{ justifySelf: "start" }}><Icon name="check" size={14} /> Seal found</span>
                    <h2 className="headline">Sealed.</h2>
                    <span className="data" style={{ color: "var(--text-2)" }}>{file}</span>
                  </div>
                </div>
                <ul className="facts">
                  <li><Icon name="check" size={16} /> Captured on one of <b>&nbsp;{result.poolSize} enrolled phones&nbsp;</b> in this pool</li>
                  <li><Icon name="check" size={16} /> Approved by a person, on {new Date(result.takenAt * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</li>
                  <li><Icon name="check" size={16} /> Unchanged since capture, byte for byte</li>
                </ul>
                {result.removedSince > 0 && (
                  <div className="status status-warn">
                    <Icon name="info" />
                    <p><strong>{result.removedSince} phone{result.removedSince > 1 ? "s were" : " was"} removed from this pool after this seal.</strong>Seals made before a removal stay valid. Which phone made this seal can't be known.</p>
                  </div>
                )}
                <div className="segmented" role="tablist" aria-label="Seal details">
                  {(["world", "private", "yourself"] as View[]).map((v) => (
                    <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
                      {v === "world" ? "What the world sees" : v === "private" ? "What stays private" : "Check it yourself"}
                    </button>
                  ))}
                </div>
                {view === "world" && (
                  <dl className="kv">
                    <div><dt>Seal ID</dt><dd className="data">{result.id}</dd></div>
                    <div><dt>Fingerprint</dt><dd className="data">{toHex(result.fp)}</dd></div>
                    <div><dt>Capture time</dt><dd className="data">{new Date(result.takenAt * 1000).toISOString()}</dd></div>
                    <div><dt>Pool epoch</dt><dd className="data">{String(result.epoch)}</dd></div>
                  </dl>
                )}
                {view === "private" && (
                  <dl className="kv">
                    <div><dt>Which phone</dt><dd>Not recorded. The proof shows membership only.</dd></div>
                    <div><dt>Who took it</dt><dd>Not recorded anywhere, including by the pool admin.</dd></div>
                    <div><dt>Key, signature, path</dt><dd>Private inputs to the proof. They stayed on the phone.</dd></div>
                    <div><dt>GPS, serial, EXIF</dt><dd>Never collected.</dd></div>
                    {mine && <div><dt>On this device</dt><dd>You sealed this photo. Only this browser knows.</dd></div>}
                  </dl>
                )}
                {view === "yourself" && (
                  <dl className="kv">
                    <div><dt>Pool contract</dt><dd className="data">{s.pool?.address}</dd></div>
                    <div><dt>Ledger lookup</dt><dd className="data">seals.lookup(0x{toHex(result.fp).slice(0, 16)}…)</dd></div>
                    <div><dt>Recompute</dt><dd className="data">sha256sum "{file}"</dd></div>
                  </dl>
                )}
              </motion.div>
            )}

            {result?.kind === "none" && (
              <motion.div key={`n-${toHex(result.fp)}`} className="stack" style={{ "--gap": "18px" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <span className="chip" style={{ justifySelf: "start" }}>No seal found</span>
                <h2 className="headline" style={{ fontSize: "clamp(1.9rem, 1.4rem + 1.2vw, 2.5rem)" }}>No seal for this file.</h2>
                <p className="body-2" style={{ margin: 0 }}>
                  That doesn't mean it's fake. It means this exact file wasn't sealed in this pool. The usual reasons:
                </p>
                <ul className="facts" style={{ color: "var(--text-2)" }}>
                  <li><Icon name="info" size={16} /> It was edited, cropped or re-compressed after sealing (messaging apps often do this).</li>
                  <li><Icon name="info" size={16} /> It was never captured with Unforged, including any AI-generated image.</li>
                </ul>
                <dl className="kv"><div><dt>Fingerprint checked</dt><dd className="data">{toHex(result.fp)}</dd></div></dl>
                <div className="cluster">
                  <label className="btn btn-secondary">Try another file<input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFiles(e.target.files)} /></label>
                  <a className="btn btn-quiet" href={href({ page: "studio", tab: "seal" })}>Seal a photo</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </>
  );
}
