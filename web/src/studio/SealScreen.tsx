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
        eyebrow={s.me ? "Field capture / Current session" : "Credential enrollment / Step 1 of 3"}
        title={s.me ? "Seal a photo" : "Set up this device"}
        purpose={s.me ? `Capture, approve and record exact bytes without placing a signer identity in the seal.` : "Create a private credential for the Independent Press Pool. No account, wallet or seed phrase."}
      />
      {s.me ? <Capture /> : <Onboarding />}
    </>
  );
}

function Onboarding() {
  const s = useStore();
  const real = realPasskeysAvailable();
  const [busy, setBusy] = useState<"passkey" | "simulated">();
  const [problem, setProblem] = useState<Problem>();
  const phones = Number(s.pool?.ledger.deviceCount ?? 0);

  async function enroll(simulated: boolean) {
    setBusy(simulated ? "simulated" : "passkey");
    setProblem(undefined);
    try {
      await enrollMe(undefined, simulated);
      toast(simulated ? `Test credential approved by ${THRESHOLD} of ${APPROVERS.length} approvers` : `Passkey approved by ${THRESHOLD} of ${APPROVERS.length} approvers`);
    } catch (e) {
      const err = e as Error;
      setProblem(
        err.name === "NotAllowedError"
          ? { title: "Enrollment was cancelled.", detail: "Nothing was saved and no passkey was created. Try again, or use a simulated phone." }
          : { title: "This device couldn't create a passkey.", detail: `${err.message} You can still continue with a simulated phone.` },
      );
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="onboard">
      <aside className="setup-rail" aria-label="Setup progress">
        <span className="label">First evidence</span>
        <ol className="progress-steps">
          <li aria-current="step"><span className="n">01</span><span><b>Authorize</b><small>Create a private pool credential</small></span></li>
          <li><span className="n">02</span><span><b>Capture</b><small>Choose camera or evaluation frame</small></span></li>
          <li><span className="n">03</span><span><b>Record</b><small>Approve the exact fingerprint</small></span></li>
        </ol>
        <div className="setup-promise">
          <Icon name="lock" size={18} />
          <p><strong>Your credential stays private.</strong><span>The seal names the pool, never the member who approved it.</span></p>
        </div>
      </aside>

      <div className="enrollment-workspace">
        <section className="enrollment-primary" aria-labelledby="c-passkey">
          <div className="enrollment-copy">
            <span className="chip chip-ok"><span className="dot" /> Recommended assurance</span>
            <span className="enrollment-icon"><Icon name="chip" size={24} /></span>
            <div>
              <h2 id="c-passkey" className="headline">Authorize with a passkey.</h2>
              <p>Use Windows Hello, Face ID, Touch ID or a nearby phone. The contract receives a salted commitment and never publishes the key.</p>
            </div>
            {real ? (
              <button className="btn btn-primary enrollment-action" onClick={() => enroll(false)} aria-busy={busy === "passkey"} disabled={!!busy}>
                {busy === "passkey" ? <><span className="spinner" /> Waiting for your approval…</> : "Enroll with a passkey"}
              </button>
            ) : (
              <div className="status status-info">
                <Icon name="info" />
                <p><strong>Passkeys aren't enabled on this address yet.</strong>Use the evaluation credential below. It runs the same contract path with a labeled software key.</p>
              </div>
            )}
            {busy === "passkey" && <p className="meta" style={{ margin: 0 }}>Approve the system prompt. If you see a QR code, you can scan it with your phone.</p>}
          </div>
          <div className="enrollment-assurance" aria-label="What happens during enrollment">
            <span className="label">ENROLLMENT RECEIPT</span>
            <dl>
              <div><dt><Icon name="fingerprint" size={17} /> Approval</dt><dd>System prompt required</dd></div>
              <div><dt><Icon name="lock" size={17} /> Published</dt><dd>Salted commitment only</dd></div>
              <div><dt><Icon name="ledger" size={17} /> Policy</dt><dd>{THRESHOLD} of {APPROVERS.length} anonymous approvers</dd></div>
            </dl>
            <p>Device-bound capture attestation is a later assurance level. This step proves credential approval.</p>
          </div>
        </section>

        <section className="evaluation-path" aria-labelledby="c-sim">
          <span className="evaluation-symbol"><Icon name="seal" size={20} /></span>
          <div>
            <span className="label">NO PASSKEY OR CAMERA?</span>
            <h2 id="c-sim" className="title">Continue in evaluation mode</h2>
            <p>Creates a local software credential and exercises the same Compact circuit. It carries L0 assurance and is never presented as hardware evidence.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => enroll(true)} aria-busy={busy === "simulated"} disabled={!!busy}>
            {busy === "simulated" ? <><span className="spinner" /> Creating credential…</> : "Use evaluation credential"}
          </button>
        </section>

        {problem && (
          <div className="status status-error" role="alert">
            <Icon name="alert" />
            <p><strong>{problem.title}</strong>{problem.detail}</p>
          </div>
        )}

        <section className="pool-readiness" aria-label="Pool readiness">
          <div className="pool-readiness-title">
            <PoolRing size={phones} min={MIN_POOL} px={78} />
            <div><span className="label">ACTIVE TRUST POOL</span><strong>Independent Press Pool</strong><span>Local evaluation environment</span></div>
          </div>
          <dl className="pool-metrics">
            <div><dt>Current set</dt><dd>{phones} credentials</dd></div>
            <div><dt>After enrollment</dt><dd>{phones + 1} credentials</dd></div>
            <div><dt>Public claim</dt><dd>One authorized member</dd></div>
            <div><dt>Signer identity</dt><dd>Withheld from record</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}

const STAGES = [
  { title: "Fingerprint the photo", detail: "SHA-256 of the exact file" },
  { title: "Sign with a passkey", detail: "Approve with your face, fingerprint or PIN" },
  { title: "Prove pool membership", detail: "Zero-knowledge: one enrolled credential, not which one" },
  { title: "Relay and record", detail: `Batched with ${RELAY_BATCH - 1} other submissions, shuffled, time coarsened to the hour` },
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
  const [shot, setShot] = useState<{ bytes: Uint8Array; url: string; test: boolean }>();
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
        ? "Camera access was blocked. Allow it in your browser's site settings, or use a test shot."
        : "No camera was found on this device. Use a test shot instead.");
    }
  }

  async function keep(canvas: HTMLCanvasElement, test: boolean) {
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    setShot({ bytes: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob), test });
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
      const rec = await sealPhoto(shot.bytes, shot.url, (st, t) => { setStage(st); setTimes({ ...t }); });
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
      <div className="darkroom">
        <div className="viewfinder">
          {shot ? <img src={shot.url} alt="The photo you just took" /> : stream ? <video ref={video} playsInline muted aria-label="Camera preview" /> : (
            <div className="vf-empty">
              <Icon name="camera" size={28} />
              <span className="serif" style={{ font: "700 1.5rem/1.1 var(--font-display)", letterSpacing: "-0.03em", color: "#f1eadf" }}>The darkroom is ready.</span>
              <p>Capture in the browser, or generate a test frame. The file can be sealed here; browser capture alone cannot attest the camera sensor.</p>
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
              <button className="btn btn-primary" onClick={openCamera}><Icon name="camera" size={18} /> Open camera</button>
              <button className="btn btn-secondary" onClick={testShot}>Use a test shot</button>
            </>
          )}
          {stream && (
            <>
              <span className="edge-note">LIVE ▸ {phones} PHONES IN POOL</span>
              <button className="shutter" onClick={takePhoto} aria-label="Take photo"><span /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => { stream.getTracks().forEach((t) => t.stop()); setStream(undefined); }}>Cancel</button>
            </>
          )}
          {shot && !running && !sealed && (
            <>
              <button className="btn btn-secondary" onClick={reset}>Retake</button>
              <button className="btn btn-primary" onClick={seal}>
                <Icon name="fingerprint" size={18} /> {s.me?.mode === "passkey" ? "Seal with your passkey" : "Seal this photo"}
              </button>
            </>
          )}
          {running && <button className="btn btn-primary" aria-busy="true" disabled><span className="spinner" /> Sealing…</button>}
          {sealed && (
            <>
              <a className="btn btn-secondary" href={sealed.url} download={`${sealed.id}.jpg`}><Icon name="download" size={18} /> Download</a>
              <button className="btn btn-secondary" onClick={reset}>New photo</button>
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
            <div className="sealed-head">
              <span className="chip chip-seal"><Icon name="check" size={14} /> Sealed</span>
            </div>
            <h2 id="seal-panel-title" className="headline" style={{ fontSize: "clamp(2rem, 1.5rem + 1.4vw, 2.8rem)" }}>Sealed. <em style={{ color: "var(--text-2)" }}>Signer undisclosed in the record.</em></h2>
            <div className="cluster">
              <span className="seal-id">{sealed.id}</span>
              <button className="btn btn-quiet btn-sm" onClick={() => { void navigator.clipboard?.writeText(sealed.id); toast("Seal ID copied"); }}><Icon name="copy" size={16} /> Copy</button>
            </div>
            <Stages stage={4} times={timeFor} simulated={s.me?.mode === "simulated"} />
            {sealed.batch && <p className="meta" style={{ margin: 0 }}>Released in <a href={href({ page: "studio", tab: "relay" })}>relay batch #{sealed.batch}</a> with {RELAY_BATCH - 1} other submissions; capture time is published to the hour.</p>}
            <p className="meta" style={{ margin: 0 }}>
              The circuit ran on Midnight's runtime in your browser. On the network, proving takes longer (each signature check needs ~250 MB of proving keys).
            </p>
            <a className="btn btn-primary" href={href({ page: "studio", tab: "verify" })} onClick={() => sessionStorage.setItem("unforged:verify", sealed.id)}>
              Verify this photo <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn-quiet" href={href({ page: "studio", tab: "desk" })}>
              Open {sealed.caseId} in the Desk <Icon name="arrow" size={18} />
            </a>
          </>
        ) : (
          <>
            <h2 id="seal-panel-title" className="title">{running ? "Sealing your photo" : shot ? "Ready to seal" : "Take a photo to begin"}</h2>
            <Stages stage={stage} times={timeFor} simulated={s.me?.mode === "simulated"} />
            {shot?.test && !running && <p className="meta" style={{ margin: 0 }}>Test shots are generated in the browser so you can try the flow without a camera.</p>}
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
            <span>{i === 1 && simulated ? "Sign with a local test key" : st.title}<small>{i === 1 && simulated ? "Software assertion; no biometric check" : i === 1 && state === "active" ? "Waiting for your approval…" : st.detail}</small></span>
            <span className="t">{state === "done" ? ms(times[i]) : ""}</span>
            <span className="sr-only">{state === "done" ? "done" : state === "active" ? "in progress" : "not started"}</span>
          </li>
        );
      })}
    </ol>
  );
}
