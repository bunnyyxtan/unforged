import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Seal } from "../components/Seal";
import { PoolRing } from "../components/PoolRing";
import { refusalCode } from "../engine/pool";
import { href } from "../lib/route";
import { APPROVERS, enrollMe, MIN_POOL, RELAY_BATCH, THRESHOLD, realPasskeysAvailable, sealPhoto, useStore, type SealRecord, type StageTimes } from "../store";
import { PageHead } from "./Studio";
import { toast } from "./toast";

type Problem = { title: string; detail: string };

/** What happened, why (when known), and what to do next. */
function explain(e: unknown): Problem {
  const err = e as Error;
  if (err?.name === "NotAllowedError") return { title: "Not sealed. The approval was cancelled or timed out.", detail: "Your device needs your face, fingerprint or PIN to sign. Nothing was recorded. Press Seal to try again." };
  const code = refusalCode(e);
  const map: Record<string, Problem> = {
    ALREADY_SEALED: { title: "This exact photo is already sealed.", detail: "Each photo can be sealed once. Verify it to see the existing seal, or take a new photo." },
    NOT_ENROLLED: { title: "This device isn't in the pool any more.", detail: "The pool admin may have removed it. Ask your editor for a new invite." },
    POOL_TOO_SMALL: { title: `The pool is too small to hide you yet.`, detail: `Sealing starts once the pool has ${MIN_POOL} phones. Your photo was not recorded.` },
    BAD_SIGNATURE: { title: "The signature didn't match this photo.", detail: "The circuit rejected it, so nothing was recorded. Take the photo again and approve the new prompt." },
    BAD_TIME: { title: "The capture time was outside the sealing window.", detail: "Photos must be sealed within 24 hours of capture. Check your device clock." },
  };
  return map[code] ?? { title: "The photo could not be sealed.", detail: `${err?.message ?? "Unknown error"}. Nothing was recorded. Try again.` };
}

export function SealScreen() {
  const s = useStore();
  return (
    <>
      <PageHead
        title="Seal a photo"
        purpose="Pick a photo and we stamp it. Anyone can later check it has not been changed, and nobody can tell who took it."
      />
      {s.me ? <Capture /> : <GettingReady />}
    </>
  );
}

/** First visit: create the practice pass automatically so there is nothing to decide. */
function GettingReady() {
  const [problem, setProblem] = useState<Problem>();
  const started = useRef(false);

  async function run() {
    setProblem(undefined);
    try {
      await enrollMe(undefined, true);
    } catch (e) {
      setProblem({ title: "We couldn't get things ready.", detail: `${(e as Error).message || "Something went wrong"}. Nothing was saved. Press the button to try again.` });
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ready-card" aria-live="polite">
      {problem ? (
        <>
          <Icon name="alert" size={28} />
          <h2 className="title">{problem.title}</h2>
          <p className="meta">{problem.detail}</p>
          <button className="btn btn-primary" onClick={() => void run()}>Try again</button>
        </>
      ) : (
        <>
          <span className="spinner" />
          <h2 className="title">Getting your seal pass ready…</h2>
          <p className="meta">This happens once and takes a moment.</p>
        </>
      )}
    </div>
  );
}

const STAGES = [
  { title: "Reading your photo", detail: "We make a short code that belongs to this exact photo" },
  { title: "Getting your approval", detail: "Your pass says you are allowed to seal" },
  { title: "Checking you are in the group", detail: "We prove it without saying which member you are" },
  { title: "Stamping it", detail: `Sent together with ${RELAY_BATCH - 1} others so timing does not give you away` },
];

function ms(n?: number) {
  if (n === undefined) return "";
  return n < 1000 ? `${Math.max(1, Math.round(n))} ms` : `${(n / 1000).toFixed(1)} s`;
}

function Capture() {
  const s = useStore();
  const reduce = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream>();
  const [shot, setShot] = useState<{ bytes: Uint8Array; url: string; test: boolean; name?: string }>();
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(-1);
  const [times, setTimes] = useState<Partial<StageTimes>>({});
  const [sealed, setSealed] = useState<SealRecord>();
  const [problem, setProblem] = useState<Problem>();
  const [cameraIssue, setCameraIssue] = useState<string>();
  const phones = Number(s.pool?.ledger.deviceCount ?? 0);

  useEffect(() => {
    if (stream && video.current) {
      video.current.srcObject = stream;
      void video.current.play();
    }
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  async function openCamera() {
    setCameraIssue(undefined);
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1600 } }, audio: false }));
    } catch (e) {
      const name = (e as Error).name;
      setCameraIssue(name === "NotAllowedError"
        ? "Camera access was blocked. Allow it in your browser's site settings, or upload a photo instead."
        : "No camera was found on this device. Upload a photo instead.");
    }
  }

  async function keep(canvas: HTMLCanvasElement, test: boolean) {
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    setShot({ bytes: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob), test });
    setSealed(undefined); setStage(-1); setTimes({}); setProblem(undefined);
  }

  /** Seal the file exactly as chosen: the original bytes, never re-encoded. */
  async function useFile(file?: File) {
    if (!file) return;
    setCameraIssue(undefined);
    if (!file.type.startsWith("image/")) {
      setCameraIssue("That file isn't an image. Choose a JPEG, PNG or WebP photo.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0) {
      setCameraIssue("That file is empty. Choose another photo.");
      return;
    }
    setShot({ bytes, url: URL.createObjectURL(file), test: false, name: file.name });
    setSealed(undefined); setStage(-1); setTimes({}); setProblem(undefined);
  }

  async function takePhoto() {
    const v = video.current!;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(undefined);
    await keep(c, false);
  }

  async function testShot() {
    const c = document.createElement("canvas");
    c.width = 1600; c.height = 1200;
    const g = c.getContext("2d")!;
    const hue = Math.floor(Math.random() * 360);
    const grd = g.createRadialGradient(800, 1300, 100, 800, 600, 1100);
    grd.addColorStop(0, `hsl(${hue} 30% 32%)`);
    grd.addColorStop(1, `hsl(${(hue + 40) % 360} 25% 9%)`);
    g.fillStyle = grd; g.fillRect(0, 0, 1600, 1200);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`; g.fillRect(Math.random() * 1600, Math.random() * 1200, 2, 2); }
    g.fillStyle = "rgba(241,234,223,.92)"; g.font = "700 88px Satoshi, system-ui, sans-serif"; g.fillText("Test shot", 90, 170);
    g.font = "34px 'Geist Mono', monospace"; g.fillText(new Date().toISOString(), 92, 230);
    await keep(c, true);
  }

  async function seal() {
    if (!shot) return;
    setProblem(undefined);
    try {
      const rec = await sealPhoto(shot.bytes, shot.url, (st, t) => { setStage(st); setTimes({ ...t }); }, shot.name ? `Uploaded file · ${shot.name}` : undefined);
      setSealed(rec);
      navigator.vibrate?.(20);
    } catch (e) {
      setStage(-1);
      setProblem(explain(e));
    }
  }

  function reset() {
    setShot(undefined); setSealed(undefined); setStage(-1); setTimes({}); setProblem(undefined);
  }

  const running = stage >= 0 && !sealed;
  const timeFor = [times.fingerprint, times.signature, times.proof, undefined];

  return (
    <div className="capture">
      <ol className="step-bar" aria-label="Progress">
        {["Pick a photo", "Press Seal", "Done"].map((label, i) => {
          const at = sealed ? 2 : shot ? 1 : 0;
          return (
            <li key={label} className={i < at ? "done" : i === at ? "now" : ""} aria-current={i === at ? "step" : undefined}>
              <span className="step-n">{i < at || (sealed && i === 2) ? <Icon name="check" size={14} /> : i + 1}</span>{label}
            </li>
          );
        })}
      </ol>
      <div className="darkroom">
        <div
          className={`viewfinder${dragging ? " dragging" : ""}`}
          onDragOver={(e) => { if (!shot && !stream) { e.preventDefault(); setDragging(true); } }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!shot && !stream) void useFile(e.dataTransfer.files[0]); }}
        >
          {shot ? <img src={shot.url} alt={shot.name ? `Uploaded file ${shot.name}` : "The photo you just took"} /> : stream ? <video ref={video} playsInline muted aria-label="Camera preview" /> : (
            <div className="vf-empty">
              <Icon name="camera" size={28} />
              <span className="serif" style={{ font: "700 1.5rem/1.1 var(--font-display)", letterSpacing: "-0.03em", color: "#f1eadf" }}>Drop a photo here</span>
              <p>Or use the buttons below. We seal the photo exactly as it is.</p>
            </div>
          )}
          <span className="vf-corner tl" /><span className="vf-corner tr" /><span className="vf-corner bl" /><span className="vf-corner br" />
          <AnimatePresence>
            {sealed && (
              <motion.span className="vf-seal" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Seal fp={sealed.fp} id={sealed.id} size={116} draw />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="darkroom-controls">
          {!stream && !shot && (
            <>
              <label className="btn btn-primary btn-big">
                <Icon name="upload" size={20} /> Choose a photo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void useFile(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <button className="btn btn-secondary btn-big" onClick={openCamera}><Icon name="camera" size={20} /> Take a photo</button>
              <button className="btn btn-quiet" onClick={testShot}>No photo handy? Try a sample</button>
            </>
          )}
          {stream && (
            <>
              <span className="edge-note">Point at something, then press the round button</span>
              <button className="shutter" onClick={takePhoto} aria-label="Take photo"><span /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => { stream.getTracks().forEach((t) => t.stop()); setStream(undefined); }}>Cancel</button>
            </>
          )}
          {shot && !running && !sealed && (
            <>
              <button className="btn btn-secondary" onClick={reset}>Pick a different photo</button>
              <button className="btn btn-primary btn-big" onClick={seal}>
                <Icon name="seal" size={20} /> Seal this photo
              </button>
            </>
          )}
          {running && <button className="btn btn-primary" aria-busy="true" disabled><span className="spinner" /> Sealing, one moment…</button>}
          {sealed && (
            <>
              <a className="btn btn-secondary" href={sealed.url} download={`${sealed.id}.jpg`}><Icon name="download" size={18} /> Download</a>
              <button className="btn btn-secondary" onClick={reset}>Seal another photo</button>
            </>
          )}
        </div>
        {cameraIssue && (
          <div className="status status-warn" role="alert" style={{ marginTop: 16, color: "var(--text)" }}>
            <Icon name="alert" />
            <p><strong>Camera unavailable.</strong>{cameraIssue}</p>
          </div>
        )}
      </div>

      <section className="panel seal-panel" aria-live="polite" aria-labelledby="seal-panel-title">
        {sealed ? (
          <>
            <span className="done-mark" aria-hidden="true"><Icon name="check" size={30} /></span>
            <h2 id="seal-panel-title" className="headline" style={{ fontSize: "clamp(2rem, 1.5rem + 1.4vw, 2.8rem)" }}>Done! Your photo is sealed.</h2>
            <p className="body-2" style={{ margin: 0 }}>Anyone can now check it. Your name is not part of the seal.</p>
            <div className="cluster">
              <span className="seal-id">{sealed.id}</span>
              <button className="btn btn-quiet btn-sm" onClick={() => { void navigator.clipboard?.writeText(sealed.id); toast("Seal ID copied"); }}><Icon name="copy" size={16} /> Copy</button>
            </div>
            <a className="btn btn-primary btn-big" href={href({ page: "studio", tab: "verify" })} onClick={() => sessionStorage.setItem("unforged:verify", sealed.id)}>
              Check it now <Icon name="arrow" size={18} />
            </a>
            <details className="more-details">
              <summary>What happened behind the scenes?</summary>
              <Stages stage={4} times={timeFor} simulated={s.me?.mode === "simulated"} />
              {sealed.batch && <p className="meta" style={{ margin: 0 }}>Sent in <a href={href({ page: "studio", tab: "relay" })}>batch {sealed.batch}</a> with {RELAY_BATCH - 1} other photos, and the time is rounded to the hour.</p>}
              <p className="meta" style={{ margin: 0 }}>Practice mode runs the real contract inside your browser. On the public network it takes longer.</p>
              <a className="btn btn-quiet btn-sm" style={{ justifySelf: "start" }} href={href({ page: "studio", tab: "desk" })}>For teams: open {sealed.caseId} in the Review desk <Icon name="arrow" size={16} /></a>
            </details>
          </>
        ) : (
          <>
            <h2 id="seal-panel-title" className="title">{running ? "Sealing your photo…" : shot ? "Looks good. Press Seal." : "Pick a photo to begin"}</h2>
            {!running && !shot && <p className="meta" style={{ margin: 0 }}>Choose one from your device, take one with your camera, or try a sample. Nothing leaves your browser.</p>}
            {shot && !running && <p className="meta" style={{ margin: 0 }}>{shot.test ? "This is a sample picture made just for practice." : "We will seal this exact photo, exactly as it is."}</p>}
            {running && <Stages stage={stage} times={timeFor} simulated={s.me?.mode === "simulated"} />}
            {problem && (
              <div className="status status-error" role="alert">
                <Icon name="alert" />
                <p><strong>{problem.title}</strong>{problem.detail}</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Stages({ stage, times, simulated }: { stage: number; times: (number | undefined)[]; simulated: boolean }) {
  return (
    <ol className="stages">
      {STAGES.map((st, i) => {
        const state = i < stage ? "done" : i === stage ? "active" : "";
        return (
          <li key={st.title} className={`stage ${state}`}>
            <span className="dot" aria-hidden="true">{state === "done" && <Icon name="check" size={12} />}</span>
            <span>{st.title}<small>{i === 1 && state === "active" && !simulated ? "Waiting for your approval…" : st.detail}</small></span>
            <span className="t">{state === "done" ? ms(times[i]) : ""}</span>
            <span className="sr-only">{state === "done" ? "done" : state === "active" ? "in progress" : "not started"}</span>
          </li>
        );
      })}
    </ol>
  );
}
