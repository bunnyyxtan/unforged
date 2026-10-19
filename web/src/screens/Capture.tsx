import { useEffect, useRef, useState } from "react";
import { Stamp } from "../components/Stamp";
import { Timeline } from "../components/Timeline";
import { PoolRing } from "../components/PoolRing";
import { enrollMe, MIN_POOL, realPasskeysAvailable, sealPhoto, useStore, type SealRecord } from "../store";
import { refusalCode } from "../engine/pool";

const COPY: Record<string, string> = {
  NOT_ENROLLED: "This phone isn't in the pool.",
  POOL_TOO_SMALL: `This pool is too small to hide you yet. Sealing starts at ${MIN_POOL} phones.`,
  ALREADY_SEALED: "This exact photo is already sealed.",
  BAD_SIGNATURE: "The signature doesn't match this photo.",
  NotAllowedError: "Not sealed. Your device needs your face, fingerprint or PIN to seal.",
};

export function Capture({ onVerify }: { onVerify: (r: SealRecord) => void }) {
  const s = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const enrolled = !!s.me;

  async function enroll(simulated = false) {
    setBusy(true);
    setError(undefined);
    try {
      await enrollMe(undefined, simulated);
    } catch (e) {
      const err = e as Error;
      setError(err.name === "NotAllowedError" ? "Passkey creation was cancelled." : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!enrolled) {
    const real = realPasskeysAvailable();
    return (
      <div className="grid two">
        <div className="card">
          <div className="eyebrow">Step 1 · Enroll this device</div>
          <h2>Turn this device into a press camera.</h2>
          <p className="muted">
            Your device creates a passkey inside its secure chip. Only an opaque commitment joins the pool. No account, no wallet, no seed phrase.
          </p>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn seal" disabled={busy || !s.ready} onClick={() => enroll(!real)}>
              {busy ? "Waiting for your device…" : real ? "Use Face ID / Touch ID / Windows Hello" : "Enroll a simulated phone"}
            </button>
            {real && (
              <button className="btn ghost" disabled={busy || !s.ready} onClick={() => enroll(true)}>
                No biometrics? Use a simulated phone
              </button>
            )}
          </div>
          {!real && (
            <p className="notice" style={{ marginTop: 16 }}>
              Real passkeys need this page on <span className="mono">http://localhost:5173</span> (the contract's WebAuthn profile fixes the origin length).
              Here you'll use a <b>simulated secure chip</b> that signs the exact same bytes.
            </p>
          )}
          {error && <p className="notice error">{error}</p>}
        </div>
        <div className="card" style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <div className="eyebrow">The pool you're joining</div>
          <div className="row" style={{ gap: 18 }}>
            <PoolRing size={Number(s.pool?.ledger.deviceCount ?? 0)} min={MIN_POOL} />
            <div>
              <h3>Independent Press Pool (demo)</h3>
              <p className="muted" style={{ margin: 0 }}>
                Your seals will say “one of {Number(s.pool?.ledger.deviceCount ?? 0) + 1} phones”. Nobody, including the pool admin, can tell which.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <Camera onVerify={onVerify} />;
}

function Camera({ onVerify }: { onVerify: (r: SealRecord) => void }) {
  const s = useStore();
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream>();
  const [shot, setShot] = useState<{ bytes: Uint8Array; url: string; test: boolean }>();
  const [step, setStep] = useState(-1);
  const [sealed, setSealed] = useState<SealRecord>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (stream && video.current) {
      video.current.srcObject = stream;
      void video.current.play();
    }
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  async function openCamera() {
    setError(undefined);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1600 } }, audio: false });
      setStream(st);
    } catch {
      setError("Camera unavailable. Use a test shot instead.");
    }
  }

  async function toShot(canvas: HTMLCanvasElement, test: boolean) {
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    setShot({ bytes, url: URL.createObjectURL(blob), test });
    setSealed(undefined);
    setStep(-1);
  }

  async function takePhoto() {
    const v = video.current!;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(undefined);
    await toShot(c, false);
  }

  async function testShot() {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 900;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 1200, 900);
    grd.addColorStop(0, `hsl(${Math.random() * 360} 35% 22%)`);
    grd.addColorStop(1, `hsl(${Math.random() * 360} 45% 12%)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, 1200, 900);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      g.fillRect(Math.random() * 1200, Math.random() * 900, 2, 2);
    }
    g.fillStyle = "rgba(255,255,255,.85)";
    g.font = "64px Instrument Serif, serif";
    g.fillText("Test shot", 60, 120);
    g.font = "28px JetBrains Mono, monospace";
    g.fillText(new Date().toISOString(), 60, 170);
    await toShot(c, true);
  }

  async function seal() {
    if (!shot) return;
    setError(undefined);
    try {
      const rec = await sealPhoto(shot.bytes, shot.url, setStep);
      setSealed(rec);
      navigator.vibrate?.(30);
    } catch (e) {
      const err = e as Error;
      setStep(-1);
      setError(COPY[err.name] ?? COPY[refusalCode(e)] ?? err.message);
    }
  }

  const running = step >= 0 && !sealed;
  return (
    <div className="grid two">
      <div className="card">
        <div className="viewfinder">
          {shot ? (
            <img src={shot.url} alt="Captured photo" />
          ) : stream ? (
            <video ref={video} playsInline muted />
          ) : (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div className="serif" style={{ fontSize: 30 }}>Darkroom ready</div>
              <div style={{ opacity: 0.7, fontSize: 14 }}>Photos are taken here, never imported from a gallery.</div>
            </div>
          )}
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          {sealed && (
            <span className="stamp-overlay"><Stamp id={sealed.id} size={120} /></span>
          )}
        </div>
        <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
          {!stream && !shot && (
            <>
              <button className="btn" onClick={openCamera}>Open camera</button>
              <button className="btn ghost" onClick={testShot}>Use a test shot</button>
            </>
          )}
          {stream && <button className="shutter" aria-label="Take photo" onClick={takePhoto} />}
          {shot && !running && !sealed && (
            <>
              <button className="btn ghost" onClick={() => { setShot(undefined); }}>Retake</button>
              <button className="btn seal" onClick={seal}>
                {s.me?.mode === "passkey" ? "Seal with Face ID / passkey" : "Seal this photo"}
              </button>
            </>
          )}
          {sealed && (
            <>
              <a className="btn ghost" href={sealed.url} download={`${sealed.id}.jpg`}>Download photo</a>
              <button className="btn" onClick={() => onVerify(sealed)}>Verify it</button>
              <button className="btn ghost" onClick={() => { setShot(undefined); setSealed(undefined); setStep(-1); }}>New photo</button>
            </>
          )}
        </div>
        {error && <p className="notice error" style={{ marginTop: 14 }}>{error}</p>}
      </div>

      <div className="card">
        <div className="eyebrow">{s.me?.mode === "passkey" ? "Enrolled · real passkey" : "Enrolled · simulated secure chip"}</div>
        <h2>{sealed ? "Sealed." : running ? "Sealing…" : shot ? "Ready to seal." : "Take a photo."}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {sealed
            ? `Seal ${sealed.id}. Anyone can verify this photo; nobody can tell it was you.`
            : "Your device signs the photo's fingerprint. A zero-knowledge proof shows the signer is one of the pool's phones."}
        </p>
        <Timeline at={sealed ? 5 : step} />
        {shot?.test && !sealed && <p className="muted" style={{ fontSize: 13 }}>Test shots are generated in the browser for demos without a camera.</p>}
      </div>
    </div>
  );
}
