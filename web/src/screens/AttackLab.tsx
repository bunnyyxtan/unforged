import { useState } from "react";
import { Stamp } from "../components/Stamp";
import { attacks, MIN_POOL, useStore, verifyBytes, type AttackOutcome } from "../store";

export function AttackLab() {
  const s = useStore();
  const [results, setResults] = useState<Record<string, AttackOutcome | "running">>({});
  const [pixel, setPixel] = useState<string>();

  async function run(key: string) {
    setResults((r) => ({ ...r, [key]: "running" }));
    const out = await attacks[key].run();
    setResults((r) => ({ ...r, [key]: out }));
  }

  async function onePixel() {
    const latest = s.seals[0];
    if (!latest) {
      setPixel("Seal a photo in the Seal tab first, then come back.");
      return;
    }
    const img = new Image();
    img.src = latest.url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const p = g.getImageData(10, 10, 1, 1);
    p.data[0] = (p.data[0] + 1) % 256;
    g.putImageData(p, 10, 10);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.92));
    const res = await verifyBytes(new Uint8Array(await blob.arrayBuffer()));
    setPixel(res.kind === "none" ? `Changed 1 pixel of ${latest.id} → no seal found. The fingerprint no longer matches.` : "Unexpected: still sealed.");
  }

  const poolSize = Number(s.pool?.ledger.deviceCount ?? 0);
  return (
    <>
      <p className="muted" style={{ maxWidth: 720, marginTop: 0 }}>
        Every attack below runs the <b>real compiled contract</b> against this pool. The refusals aren't UI checks; they come from the circuit, the same way they would on Midnight.
      </p>
      <div className="grid three">
        <div className="card attack">
          <div className="eyebrow">Tamper</div>
          <h3>Change one pixel</h3>
          <p className="muted" style={{ margin: 0 }}>Edit your latest sealed photo by a single pixel and verify it.</p>
          <button className="btn small" onClick={onePixel}>Run attack</button>
          <div className="result">{pixel && <span>{pixel}</span>}</div>
        </div>
        {Object.entries(attacks).map(([key, a]) => {
          const r = results[key];
          const disabled = r === "running" || (key === "stolen" && poolSize <= MIN_POOL + 1);
          return (
            <div className="card attack" key={key}>
              <div className="eyebrow">Attack</div>
              <h3>{a.title}</h3>
              <p className="muted" style={{ margin: 0 }}>{a.story}</p>
              <button className="btn small" disabled={disabled} onClick={() => run(key)}>
                {r === "running" ? "Running circuit…" : "Run attack"}
              </button>
              <div className="result">
                {r && r !== "running" && (
                  <>
                    <Stamp id={r.code} label="REFUSED" size={64} refused />
                    <span>
                      <span className="code">{r.code}</span>
                      <br />
                      <small className="muted">{r.note}</small>
                    </span>
                  </>
                )}
                {key === "stolen" && poolSize <= MIN_POOL + 1 && !r && (
                  <small className="muted">Pool is at its anonymity floor; revoking more would block everyone.</small>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
