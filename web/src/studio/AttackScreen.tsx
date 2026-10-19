import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "../components/Icon";
import { href } from "../lib/route";
import { attacks, MIN_POOL, useStore, verifyBytes, type AttackOutcome } from "../store";

type Result = AttackOutcome | { info: true; note: string } | { error: true; note: string };
type Row = Result | "running";

const cases = [
  { key: "pixel", family: "FILE INTEGRITY", title: "A changed image", question: "Can an altered file inherit the original seal?", method: "Change one decoded pixel in the last sealed photograph, export it, and look up the new file fingerprint.", boundary: "Exact-byte fingerprint lookup", impact: "An editor could publish an altered frame under a valid-looking seal." },
  { key: "outsider", family: "POOL ACCESS", title: "An unregistered signer", question: "Can an outsider borrow the pool's reputation?", method: "Create a fresh signing key outside the pool and attempt to seal a file with it.", boundary: "Private Merkle membership", impact: "An attacker could attach a trusted pool's seal to their own content." },
  { key: "edited", family: "SIGNATURE BINDING", title: "A reused signature", question: "Can a valid signature authorize different pixels?", method: "Sign one fingerprint, then submit a second fingerprint with that assertion.", boundary: "P-256 signature bound to fingerprint", impact: "A genuine reporter's approval could be transplanted onto a forgery." },
  { key: "twice", family: "REPLAY CONTROL", title: "A duplicate claim", question: "Can another signer claim a file already sealed?", method: "Seal a fresh fingerprint legitimately, then ask another enrolled signer to seal the same one.", boundary: "Unique seal registry", impact: "Conflicting provenance records could be created for one file." },
  { key: "backdate", family: "TIME INTEGRITY", title: "A false capture time", question: "Can a reporter move an event two days into the past?", method: "Submit a capture time 48 hours before the pool clock.", boundary: "24-hour capture window", impact: "A valid image could be used to support a false chronology." },
  { key: "nobio", family: "HUMAN APPROVAL", title: "No user verification", question: "Can malware seal without a human approving?", method: "Submit an assertion with user presence but without WebAuthn's user-verification flag.", boundary: "WebAuthn UV requirement", impact: "A compromised client could quietly issue seals." },
  { key: "phishing", family: "ORIGIN BINDING", title: "A look-alike origin", question: "Can a phishing page reuse a reporter's passkey?", method: "Use an assertion bound to a look-alike site origin.", boundary: "Signed WebAuthn origin", impact: "A counterfeit site could issue seals as the real newsroom." },
  { key: "bypass", family: "ENROLLMENT POLICY", title: "An owner bypass", question: "Can the pool owner add a credential alone?", method: "Use the owner key to enroll a fresh credential directly while the pool requires 2 of 3 approvals.", boundary: "Threshold enrollment policy", impact: "One compromised administrator could add an attacker's device to a trusted pool." },
  { key: "doublevote", family: "ENROLLMENT POLICY", title: "A duplicate approval", question: "Can one approver supply both approvals?", method: "Approve a pending credential, then approve it again with the same approver secret.", boundary: "Anonymous approval nullifier", impact: "A single insider could satisfy a multi-person policy." },
  { key: "stolen", family: "INCIDENT RESPONSE", title: "A revoked credential", question: "Can a removed signer keep sealing?", method: "Revoke one simulated signer, then attempt another seal using its old membership.", boundary: "Current pool epoch", impact: "A lost credential could keep issuing trusted records after an incident." },
] as const;

type CaseKey = (typeof cases)[number]["key"];

export function AttackScreen() {
  const s = useStore();
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<CaseKey>("pixel");
  const [rows, setRows] = useState<Partial<Record<CaseKey, Row>>>({});
  const [all, setAll] = useState(false);
  const phones = Number(s.pool?.ledger.deviceCount ?? 0);
  const latest = s.seals[0];
  const scenario = cases.find((item) => item.key === selected)!;
  const current = rows[selected];
  const results = cases.map((item) => rows[item.key]);
  const refused = results.filter((r) => r && r !== "running" && "code" in r && !r.ok).length;
  const unexpected = results.filter((r) => r && r !== "running" && "code" in r && r.ok).length;
  const incomplete = results.filter((r) => r && r !== "running" && ("info" in r || "error" in r)).length;
  const running = results.some((r) => r === "running");

  async function onePixel(): Promise<Result> {
    if (!latest) return { note: "Seal a photo first. The test needs an original file to alter.", info: true };
    const img = new Image();
    img.src = latest.url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(img, 0, 0);
    const x = Math.min(10, canvas.width - 1);
    const y = Math.min(10, canvas.height - 1);
    const point = context.getImageData(x, y, 1, 1);
    point.data[0] = (point.data[0] + 1) % 256;
    context.putImageData(point, x, y);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Could not encode the changed image.")), "image/png"));
    const result = await verifyBytes(new Uint8Array(await blob.arrayBuffer()));
    return result.kind === "none"
      ? { ok: false, code: "NO_SEAL", note: "The edited file has a different SHA-256 fingerprint. The exact-file lookup finds no seal." }
      : { ok: true, code: "ACCEPTED", note: "Unexpected: a changed file matched an existing seal. Investigate before relying on this pool." };
  }

  async function run(key: CaseKey) {
    setRows((before) => ({ ...before, [key]: "running" }));
    try {
      const result = key === "pixel" ? await onePixel() : await attacks[key].run();
      setRows((before) => ({ ...before, [key]: result }));
    } catch (error) {
      setRows((before) => ({ ...before, [key]: { error: true, note: error instanceof Error ? error.message : "The check could not finish." } }));
    }
  }

  async function runAll() {
    setAll(true);
    try {
      for (const item of cases) {
        setSelected(item.key);
        if (item.key === "stolen" && Number(s.pool?.ledger.deviceCount ?? 0) <= MIN_POOL + 1) {
          setRows((before) => ({ ...before, stolen: { info: true, note: "Revocation was held: the pool is at its anonymity floor." } }));
          continue;
        }
        await run(item.key);
      }
    } finally {
      setAll(false);
    }
  }

  const blocked = selected === "stolen" && phones <= MIN_POOL + 1;
  const finished = current && current !== "running";
  const verdict = !finished ? undefined : "code" in current ? current.ok ? "accepted" : "refused" : "info" in current ? "setup" : "error";

  return (
    <div className="attack-lab">
      <header className="attack-head">
        <div>
          <p className="label attack-kicker">UNFORGED / ASSURANCE / THREAT EXERCISES</p>
          <h1 className="display">Trust must survive <em>an adversary.</em></h1>
          <p className="lede">Exercise the failure paths an editor, source-protection lead, or verifier needs to understand before relying on a seal.</p>
        </div>
        <button className="btn btn-primary" onClick={() => void runAll()} disabled={all || running} aria-busy={all}>
          {all ? <><span className="spinner" /> Running suite</> : <>Run all ten <Icon name="arrow" size={17} /></>}
        </button>
      </header>

      <div className="attack-overview" aria-label="Exercise progress">
        <div><span className="label">SCENARIOS</span><strong>{cases.length.toString().padStart(2, "0")}</strong><span className="meta">distinct failure paths</span></div>
        <div><span className="label">REFUSED</span><strong>{refused.toString().padStart(2, "0")}</strong><span className="meta">contract or file lookup</span></div>
        <div><span className="label">INCOMPLETE</span><strong>{incomplete.toString().padStart(2, "0")}</strong><span className="meta">held or could not run</span></div>
        <div className={unexpected ? "attack-risk" : ""}><span className="label">UNEXPECTED</span><strong>{unexpected.toString().padStart(2, "0")}</strong><span className="meta">accepted attempts</span></div>
      </div>

      <div className="attack-workspace">
        <aside className="attack-index" aria-label="Threat scenarios">
          <div className="attack-index-head"><span className="label">THREAT FILES</span><span className="data">01—08</span></div>
          <div className="attack-index-list">
            {cases.map((item, index) => {
              const row = rows[item.key];
              const state = !row ? "ready" : row === "running" ? "running" : "code" in row ? row.ok ? "unexpected" : "refused" : "info" in row ? "held" : "error";
              return (
                <button key={item.key} className={`attack-index-item${selected === item.key ? " active" : ""}`} aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}>
                  <span className="attack-index-no">{String(index + 1).padStart(2, "0")}</span>
                  <span className="attack-index-copy"><span>{item.title}</span><small>{item.family}</small></span>
                  <span className={`attack-state-dot ${state}`} aria-label={state} title={state} />
                </button>
              );
            })}
          </div>
          <p className="attack-index-note">Run state is local to this browser. Reloading resets the pool and its records.</p>
        </aside>

        <section className="attack-case" aria-labelledby="case-title">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={selected} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -5 }} transition={{ duration: 0.18 }} className="attack-case-inner">
              <div className="attack-case-top"><span className="label">CASE {String(cases.indexOf(scenario) + 1).padStart(2, "0")} / {scenario.family}</span><Icon name="attack" size={22} /></div>
              <h2 id="case-title" className="headline">{scenario.title}</h2>
              <p className="attack-question">{scenario.question}</p>
              {selected === "pixel" && latest && <div className="attack-evidence"><img src={latest.url} alt="Latest sealed photograph used for this test" /><div><span className="label">ORIGINAL ON FILE</span><strong className="data">{latest.id}</strong><span className="meta">The changed output is checked separately.</span></div></div>}
              <div className="attack-path" aria-label="Test method">
                <div><span className="attack-step-no">01</span><span className="label">ATTEMPT</span><p>{scenario.method}</p></div>
                <div><span className="attack-step-no">02</span><span className="label">BOUNDARY</span><p>{scenario.boundary}</p></div>
                <div><span className="attack-step-no">03</span><span className="label">WHY IT MATTERS</span><p>{scenario.impact}</p></div>
              </div>
              <div className="attack-action-row">
                <button className="btn btn-primary" onClick={() => void run(selected)} disabled={all || running || blocked} aria-busy={current === "running"}>
                  {current === "running" ? <><span className="spinner" /> Checking boundary</> : current ? "Run again" : "Run this scenario"}
                </button>
                <span className="meta">{selected === "pixel" ? "File fingerprint check · browser" : "Compiled Compact contract · local runtime"}</span>
              </div>
              <div className={`attack-verdict${verdict ? ` is-${verdict}` : ""}`} role="status" aria-live="polite">
                <div className="attack-verdict-heading"><span className="label">OBSERVED RESULT</span><span className="data">{current === "running" ? "RUNNING" : verdict ? verdict.toUpperCase() : "AWAITING RUN"}</span></div>
                {!current && <p>Run the scenario to see the actual response. An unrun case is not counted as passing.</p>}
                {current === "running" && <p>Executing the attempt against {selected === "pixel" ? "the file lookup" : "the compiled contract"}…</p>}
                {finished && "code" in current && <><strong className="attack-code">{current.code}</strong><p>{current.note}</p></>}
                {finished && "info" in current && <><strong>Prerequisite required</strong><p>{current.note} {selected === "pixel" && <a href={href({ page: "studio", tab: "seal" })}>Open capture <Icon name="arrow" size={15} /></a>}</p></>}
                {finished && "error" in current && <><strong>Could not complete</strong><p>{current.note}</p></>}
              </div>
              {blocked && <p className="attack-guard"><Icon name="lock" size={16} /> Revocation paused at the pool's anonymity floor. Add a device or reload the demo pool to run this case.</p>}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
      <footer className="attack-footnote"><Icon name="info" size={17} /><p>The changed-image case checks exact-file fingerprint lookup. The other nine execute compiled Compact circuits in a local simulator. This is reproducible engineering evidence, not a public network transaction or a camera-origin attestation.</p></footer>
    </div>
  );
}
