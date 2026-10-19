import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  const [checking, setChecking] = useState(false);
  const [view, setView] = useState<View>("world");
  const checkId = useRef(0);

  async function check(bytes: Uint8Array, name: string, id = ++checkId.current) {
    setReadError(false);
    setChecking(true);
    setFile(name);
    setView("world");
    setResult(undefined);
    try {
      const next = await verifyBytes(bytes);
      if (id === checkId.current) setResult(next);
    } catch {
      if (id === checkId.current) setReadError(true);
    } finally {
      if (id === checkId.current) setChecking(false);
    }
  }

  async function onFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    const id = ++checkId.current;
    setChecking(true);
    setReadError(false);
    setResult(undefined);
    setFile(f.name);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (id !== checkId.current) return;
      if (bytes.length === 0) throw new Error("empty");
      await check(bytes, f.name, id);
    } catch {
      if (id === checkId.current) {
        setChecking(false);
        setResult(undefined);
        setReadError(true);
      }
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

  function exportReview() {
    if (!result || result.kind !== "sealed") return;
    const review = {
      format: "unforged-local-review-v1",
      source: "local Compact runtime; no public network transaction",
      sealId: result.id,
      fingerprintSha256: toHex(result.fp),
      fileName: file,
      statedCaptureTime: new Date(result.takenAt * 1000).toISOString(),
      poolAddress: s.pool?.address,
      poolEpoch: String(result.epoch),
      currentPoolSize: result.poolSize,
      devicesRemovedSinceSeal: result.removedSince,
      checks: ["exact file fingerprint matched a local seal", "the local seal was accepted by the compiled contract", "the assertion contained a user-verification flag"],
      notEstablished: ["camera sensor origin", "truth of scene or context", "public-chain inclusion", "source anonymity against network or timing observers"],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(review, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.id}-local-review.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <PageHead title="Verification desk" purpose="Check an exact file against this pool's local seal registry. The file stays in your browser. A match supports an editorial decision; it does not establish that the scene is true." />
      <div className="verify">
        <div className="stack" style={{ "--gap": "16px" } as React.CSSProperties}>
          <label
            className={`dropzone${over ? " over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); void onFiles(e.dataTransfer.files); }}
          >
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
            <span className="icon-wrap"><Icon name="upload" size={24} /></span>
            <span className="title">{checking ? `Checking ${file}…` : "Drop a photo, or choose a file"}</span>
            <span className="meta">JPEG, PNG or any image. Exact bytes are checked in this browser.</span>
          </label>
          {readError && (
            <div className="status status-error" role="alert">
              <Icon name="alert" />
                <p><strong>We couldn't check that file.</strong>It may be empty, still downloading, or too large for this device. Choose it again, or try a different file.</p>
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
            {checking && (
              <motion.div key="checking" className="stack" style={{ "--gap": "16px" } as React.CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="skeleton" style={{ width: 110, height: 110, borderRadius: "50%" }} />
                <h2 className="title">Checking the exact file</h2>
                <p className="meta" style={{ margin: 0 }}>Computing its fingerprint and reading the local pool record. Your file stays in this browser.</p>
              </motion.div>
            )}
            {!result && !checking && (
              <motion.div key="empty" className="stack" style={{ "--gap": "16px" } as React.CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="title">What the desk can check</h2>
                <ul className="facts">
                  <li><Icon name="check" size={16} /> This exact file matches a fingerprint in the pool registry.</li>
                  <li><Icon name="check" size={16} /> A pool credential assertion with a user-verification flag was accepted.</li>
                  <li><Icon name="check" size={16} /> The public record does not reveal which signer approved it.</li>
                </ul>
                <p className="meta" style={{ margin: 0 }}>Always review the scene, source context and capture pipeline separately. This browser version runs on a local ledger.</p>
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
                  <li><Icon name="check" size={16} /><span>Approved by one of <b>{result.poolSize} credentials</b> in this pool</span></li>
                  <li><Icon name="check" size={16} /><span>User-verification flag required; stated capture time {new Date(result.takenAt * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span></li>
                  <li><Icon name="check" size={16} /> This exact file matches the sealed fingerprint, byte for byte</li>
                </ul>
                <div className="review-boundary">
                  <div><span className="label">ESTABLISHED HERE</span><p>File match, accepted pool membership, verified assertion flags and a seal record with an undisclosed signer.</p></div>
                  <div><span className="label">STILL FOR THE EDITOR</span><p>Camera origin, scene truth, context, source safety beyond the public record and any external chain inclusion.</p></div>
                </div>
                <button className="btn btn-secondary" style={{ justifySelf: "start" }} onClick={exportReview}><Icon name="download" size={17} /> Download local review</button>
                {result.removedSince > 0 && (
                  <div className="status status-warn">
                    <Icon name="info" />
                    <p><strong>{result.removedSince} credential{result.removedSince > 1 ? "s were" : " was"} removed from this pool after this seal.</strong>Earlier seals remain valid. The seal record does not identify its signer.</p>
                  </div>
                )}
                <div className="segmented" role="tablist" aria-label="Seal details">
                  {(["world", "private", "yourself"] as View[]).map((v) => (
                    <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
                      {v === "world" ? "Public record" : v === "private" ? "Kept private" : "Verify yourself"}
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
                    <div><dt>Which passkey</dt><dd>Not disclosed in the local ledger. The proof shows membership only.</dd></div>
                    <div><dt>Who took it</dt><dd>Not contained in this seal record. An operator may still know enrollment identities.</dd></div>
                    <div><dt>Key, signature, path</dt><dd>Private proof inputs, not published in the seal record.</dd></div>
                    <div><dt>GPS, serial, EXIF</dt><dd>Never collected.</dd></div>
                    {mine && <div><dt>On this device</dt><dd>You sealed this photo. Only this browser knows.</dd></div>}
                  </dl>
                )}
                {view === "yourself" && (
                  <dl className="kv">
                    <div><dt>Pool contract</dt><dd className="data">{s.pool?.address}</dd></div>
                    <div><dt>Ledger lookup</dt><dd>Local browser simulation; no public explorer transaction yet.</dd></div>
                    <div><dt>Recompute</dt><dd>SHA-256 of the original bytes must equal <span className="data">{toHex(result.fp)}</span></dd></div>
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
                  <label className="btn btn-secondary">Try another file<input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
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
