import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Seal } from "../components/Seal";
import { toHex } from "../engine/bytes";
import { href } from "../lib/route";
import { c2paAssertion, downloadJson, type Evidence } from "../lib/evidence";
import { useStore, verifyBytes, type VerifyResult } from "../store";
import { Ladder, Report } from "./EvidenceReport";
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

  const mine = result?.kind === "sealed" && !!result.record?.byYou;
  const evidence: Evidence | undefined = result?.kind === "sealed" ? {
    id: result.id, fp: result.fp, takenAt: result.takenAt, epoch: result.epoch, poolSize: result.poolSize, removedSince: result.removedSince,
    poolAddress: s.pool!.address, level: result.record?.level, batch: result.record?.batch, case: s.cases.find((c) => c.sealId === result.id),
  } : undefined;

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
      assurance: evidence?.level ?? "not stated",
      editorialCase: evidence?.case ? { id: evidence.case.id, status: evidence.case.status } : null,
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
      <PageHead title="Check a photo" purpose="Drop a photo in. We tell you if it has a seal, and whether it has been changed since." />
      <div className="verify">
        <div className="verify-intake">
          <div className="verify-section-head">
            <div><h2 className="title">1. Choose the photo to check</h2></div>
            <span className="verify-local"><Icon name="lock" size={14} /> Stays on your device</span>
          </div>
          <label
            className={`dropzone${over ? " over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); void onFiles(e.dataTransfer.files); }}
          >
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
            <span className="icon-wrap"><Icon name="upload" size={24} /></span>
            <span className="title">{checking ? `Checking ${file}…` : "Drop a photo, or choose a file"}</span>
            <span className="meta">Nothing is uploaded. Your photo never leaves this device.</span>
          </label>
          {readError && (
            <div className="status status-error" role="alert">
              <Icon name="alert" />
                <p><strong>We couldn't check that file.</strong>It may be empty, still downloading, or too large for this device. Choose it again, or try a different file.</p>
            </div>
          )}
          {s.seals.some((r) => r.byYou) ? (
            <div className="verify-recents">
              <span className="label">PHOTOS YOU SEALED</span>
              <div className="thumbs">
                {s.seals.filter((r) => r.byYou).slice(0, 10).map((r) => (
                  <button key={r.id} onClick={() => void check(r.bytes, `${r.id}.jpg`)} aria-label={`Check ${r.id}`}>
                    <img src={r.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="verify-empty-session"><Icon name="info" size={16} /><p>You have not sealed anything yet. <a href={href({ page: "studio", tab: "seal" })}>Seal a photo</a>, or drop in any photo to check it.</p></div>
          )}
          {s.seals.some((r) => !r.byYou) && (
            <div className="verify-recents">
              <span className="label">SAMPLE PHOTOS</span>
              <div className="thumbs">
                {s.seals.filter((r) => !r.byYou).map((r) => (
                  <button key={r.id} onClick={() => void check(r.bytes, `${r.id}.jpg`)} aria-label={`Check sample ${r.id}`}>
                    <img src={r.url} alt="" />
                  </button>
                ))}
              </div>
              <p className="meta" style={{ margin: 0 }}>Sealed in advance by demo members, so you can try Check without sealing anything.</p>
            </div>
          )}
          
        </div>

        <section className="result" aria-live="polite" aria-label="Verification result">
          <div className="verify-section-head result-head"><div><h2 className="title">2. The answer</h2></div></div>
          <div className="result-body">
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
                <div className="result-awaiting"><span className="result-crosshair"><Icon name="verify" size={26} /></span><h3>Choose a photo and the answer shows up here.</h3><p>We look for a seal and tell you if the photo is exactly the one that was sealed.</p></div>
                
                
              </motion.div>
            )}

            {result?.kind === "sealed" && (
              <motion.div key={`s-${toHex(result.fp)}`} className="stack" style={{ "--gap": "20px" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <div className="verdict">
                  <Seal fp={result.fp} id={result.id} size={128} />
                  <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                    <span className="chip chip-ok" style={{ justifySelf: "start" }}><Icon name="check" size={14} /> Seal is real</span>
                    <h2 className="headline">Yes, this photo is sealed.</h2>
                    <span className="meta">{file}</span>
                  </div>
                </div>
                <ul className="facts big-facts">
                  <li><Icon name="check" size={20} /><span><b>Not changed.</b> This is exactly the photo that was sealed.</span></li>
                  <li><Icon name="check" size={20} /><span><b>Approved by a trusted group.</b> One of {result.poolSize} members approved it. Nobody can tell which one.</span></li>
                  <li><Icon name="check" size={20} /><span><b>Sealed around {new Date(result.takenAt * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.</b></span></li>
                </ul>
                <p className="meta" style={{ margin: 0 }}>A seal does not say what the photo shows or whether the scene is true. It only says the file is original and was approved.</p>
                <details className="more-details">
                  <summary>See the full report</summary>
                <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
                  <span className="label">SECURITY REPORT</span>
                  <Report evidence={evidence!} />
                </div>
                <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
                  <span className="label">ASSURANCE LEVEL</span>
                  <Ladder level={evidence!.level} />
                </div>
                <div className="cluster">
                  <button className="btn btn-secondary" onClick={exportReview}><Icon name="download" size={17} /> Local review</button>
                  <button className="btn btn-secondary" onClick={() => downloadJson(`${result.id}-c2pa-assertion.json`, c2paAssertion(evidence!))}><Icon name="download" size={17} /> C2PA assertion (draft)</button>
                </div>
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
                              </details>
              </motion.div>
            )}

            {result?.kind === "none" && (
              <motion.div key={`n-${toHex(result.fp)}`} className="stack" style={{ "--gap": "18px" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <span className="chip chip-warn" style={{ justifySelf: "start" }}>No seal found</span>
                <h2 className="headline" style={{ fontSize: "clamp(1.9rem, 1.4rem + 1.2vw, 2.5rem)" }}>This photo has no seal.</h2>
                <p className="body-2" style={{ margin: 0 }}>
                  That does not mean it is fake. It only means this exact photo was never sealed here. Common reasons:
                </p>
                <ul className="facts" style={{ color: "var(--text-2)" }}>
                  <li><Icon name="info" size={16} /> It was changed after sealing. Even cropping, or sending it through a chat app, counts.</li>
                  <li><Icon name="info" size={16} /> It was never sealed with Unforged at all.</li>
                </ul>
                <details className="more-details"><summary>Technical detail</summary><dl className="kv"><div><dt>Photo code (SHA-256)</dt><dd className="data">{toHex(result.fp)}</dd></div></dl></details>
                <div className="cluster">
                  <label className="btn btn-secondary">Check another photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
                  <a className="btn btn-quiet" href={href({ page: "studio", tab: "seal" })}>Seal a photo</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </section>
      </div>
    </>
  );
}
