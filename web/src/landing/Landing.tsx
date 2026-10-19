import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Seal } from "../components/Seal";
import { Film, Redacted, Reveal } from "../components/Print";
import { Icon, Mark } from "../components/Icon";
import { sealId, sha256, toHex } from "../engine/bytes";
import { href } from "../lib/route";
import { useTheme } from "../lib/theme";

const BASE = import.meta.env.BASE_URL;
const studio = href({ page: "studio", tab: "seal" });
const verify = href({ page: "studio", tab: "verify" });
const attacks = href({ page: "studio", tab: "attacks" });

/** The real SHA-256 of the hero photograph, computed in the browser. */
function usePhotoFingerprint(path: string) {
  const [fp, setFp] = useState<Uint8Array>();
  useEffect(() => {
    let live = true;
    fetch(path)
      .then((r) => r.arrayBuffer())
      .then((b) => sha256(b))
      .then((d) => live && setFp(d))
      .catch(() => { /* specimen stays unsealed; the page remains fully usable */ });
    return () => { live = false; };
  }, [path]);
  return fp;
}

function Masthead() {
  const [theme, toggle] = useTheme();
  return (
    <header className="masthead">
      <div className="rail masthead-row">
        <a className="wordmark" href="#/" aria-label="Unforged home"><Mark />Unforged</a>
        <nav aria-label="Sections" className="masthead-nav">
          <a href="#workflow">Workflow</a>
          <a href="#proof">Proof</a>
          <a href="#midnight">Midnight</a>
        </nav>
        <div className="cluster" style={{ "--gap": "8px" } as React.CSSProperties}>
          <button className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Use paper theme" : "Use darkroom theme"}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <a className="btn btn-primary btn-sm" href={studio}>Open the studio</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const fp = usePhotoFingerprint(`${BASE}media/umbrella.jpg`);
  const reduce = useReducedMotion();
  const hex = fp ? toHex(fp) : "";
  return (
    <section className="hero rail" aria-labelledby="hero-title">
      <div className="hero-copy">
        <motion.p className="label" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          Source-safe evidence infrastructure · Built with Midnight
        </motion.p>
        <motion.h1
          id="hero-title"
          className="display"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        >
          Prove the file. <em>Protect the source.</em>
        </motion.h1>
        <motion.p className="lede" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
          Unforged binds an exact image file to an enrolled passkey and proves pool membership without publishing which signer approved it.
          Editors can check the record, readers can check the file, and a compromised credential can be removed.
        </motion.p>
        <motion.div className="cluster hero-actions" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
          <a className="btn btn-primary" href={studio}>Seal a photo <Icon name="arrow" size={18} /></a>
          <a className="btn btn-secondary" href={verify}>Verify a photo</a>
        </motion.div>
        <p className="meta hero-note"><Icon name="lock" size={16} /> Explore the compiled contract locally. Files stay in your browser; public-network deployment is next.</p>
      </div>

      <motion.div
        className="hero-specimen"
        initial={reduce ? false : { opacity: 0, y: 24, rotate: 1.2 }}
        animate={{ opacity: 1, y: 0, rotate: 0.6 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Film src={`${BASE}media/umbrella.jpg`} alt="Black-and-white street photograph: a person walks past shuttered shopfronts under an umbrella that hides their face." frame="24 ▸ 24A" width={1600} height={1069}>
          {fp && (
            <div className="specimen-seal">
              <Seal fp={fp} id={sealId(fp)} size={150} draw />
            </div>
          )}
        </Film>
        <div className="specimen-caption">
          <span className="label">Fingerprint · SHA-256</span>
          <span className="data specimen-hash" aria-live="polite">
            {fp ? <TypedHex hex={hex} /> : <span className="skeleton" style={{ display: "inline-block", width: "100%", height: 14 }} />}
          </span>
          <span className="meta">Specimen. The seal pattern is drawn from this photo's real fingerprint, so changing one pixel would change it. It is not recorded on chain.</span>
        </div>
      </motion.div>
    </section>
  );
}

function TypedHex({ hex }: { hex: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? hex.length : 0);
  useEffect(() => {
    if (reduce) return setN(hex.length);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(Math.min(i, hex.length));
      if (i >= hex.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [hex, reduce]);
  return (
    <>
      <span aria-hidden="true">{hex.slice(0, n)}<span style={{ opacity: 0.25 }}>{hex.slice(n).replace(/./g, "·")}</span></span>
      <span className="sr-only">{hex}</span>
    </>
  );
}

function TradeOff() {
  const rows: { k: string; v: string; hide?: boolean }[] = [
    { k: "Photographer", v: "Mira Haddad", hide: true },
    { k: "Device", v: "Pixel 10 · serial 3B7F-21C9", hide: true },
    { k: "Location", v: "50.4501° N, 30.5234° E", hide: true },
    { k: "Captured", v: "19 Oct 2026, 14:02" },
    { k: "Edited since capture", v: "No" },
    { k: "Signature", v: "Valid" },
  ];
  return (
    <section className="section rail tradeoff" aria-labelledby="tradeoff-title">
      <Reveal className="section-head">
        <h2 id="tradeoff-title" className="headline">A useful provenance record should not become <em>a source list.</em></h2>
        <p className="body-2">
          Existing content credentials can carry identity and device metadata. For an at-risk contributor, sharing that metadata can
          create a physical risk. Unforged tests a different trust boundary: verify an enrolled signer and an exact file match while
          withholding the signer's identity from the public seal.
        </p>
      </Reveal>

      <div className="tradeoff-grid">
        <Reveal y={20}>
          <Film src={`${BASE}media/crossing.jpg`} alt="A busy city crossing photographed from street level." frame="12 ▸ 12A" width={1600} height={1200} />
        </Reveal>
        <Reveal className="credential-sheet" delay={0.1}>
          <div className="sheet-head">
            <span className="title">Content credentials</span>
            <span className="chip">Illustration · fictional data</span>
          </div>
          <dl className="kv">
            {rows.map((r, i) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.hide ? <Redacted delay={0.35 + i * 0.22} label={`${r.k}: hidden by Unforged`}>{r.v}</Redacted> : <span className="ok-text"><Icon name="check" size={16} /> {r.v}</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="meta" style={{ margin: 0 }}>
            The public seal omits signer identity. Editorial teams must still protect enrollment records and remove identifying image content.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: "chip" as const, t: "Enroll a credential", d: "A source pool records an opaque commitment to a passkey. The public seal never contains a named signer or public key. Production pools will require controlled enrollment." },
    { n: "02", icon: "fingerprint" as const, t: "Approve the exact file", d: "The passkey approves the file fingerprint. The Compact circuit checks the signature and privately proves the signer belongs to the pool." },
    { n: "03", icon: "verify" as const, t: "Review the evidence", d: "An editor or reader checks the exact bytes, stated time and pool record. The result answers a narrow provenance question; scene truth and camera origin need separate checks." },
  ];
  return (
    <section id="how" className="section rail" aria-labelledby="how-title">
      <Reveal className="section-head">
        <h2 id="how-title" className="headline">One file. <em>A chain of accountable decisions.</em></h2>
      </Reveal>
      <ol className="steps">
        {steps.map((s, i) => (
          <Reveal as="li" key={s.n} delay={i * 0.08} className="step">
            <span className="numeral" aria-hidden="true">{s.n}</span>
            <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
              <h3 className="title"><Icon name={s.icon} size={18} /> {s.t}</h3>
              <p className="body-2" style={{ margin: 0 }}>{s.d}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Workflow() {
  const stations = [
    { number: "01", role: "FIELD", title: "Protect the contributor", description: "The source approves an exact file with a pool credential. The public record carries no signer identifier.", action: "Enter capture", to: studio, icon: "camera" as const },
    { number: "02", role: "EDITORIAL", title: "Make a bounded decision", description: "The desk checks the file match and approval, then separately reviews context and the capture pipeline.", action: "Open verification", to: verify, icon: "verify" as const },
    { number: "03", role: "PUBLIC", title: "Let the claim be challenged", description: "A reader can use the same file and inspect the same seal facts without requesting access to the source.", action: "Check a file", to: verify, icon: "fingerprint" as const },
    { number: "04", role: "SECURITY", title: "Respond when trust changes", description: "A compromised credential can be revoked. Adversarial cases make the refusal boundary visible to the team.", action: "Open threat lab", to: attacks, icon: "attack" as const },
  ];
  return (
    <section id="workflow" className="section rail newsroom-workflow" aria-labelledby="workflow-title">
      <Reveal className="workflow-intro">
        <span className="label">A PRODUCT FOR EDITORIAL TEAMS</span>
        <h2 id="workflow-title" className="headline">From the field to the front page. <em>One trust boundary at every step.</em></h2>
        <p className="body-2">Unforged is being built as evidence infrastructure for organizations that must verify a contribution without turning the provenance system into a source directory. These four stations are explorable in the current local build.</p>
      </Reveal>
      <div className="workflow-stations">
        {stations.map((station, index) => (
          <Reveal key={station.number} delay={index * 0.06}>
            <a className="workflow-station" href={station.to}>
              <span className="workflow-number">{station.number}</span>
              <span className="workflow-icon"><Icon name={station.icon} size={21} /></span>
              <span className="workflow-copy"><span className="label">{station.role}</span><strong>{station.title}</strong><span className="meta">{station.description}</span></span>
              <span className="workflow-link">{station.action} <Icon name="arrow" size={17} /></span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Ledger() {
  return (
    <section className="section rail" aria-labelledby="ledger-title">
      <Reveal className="section-head">
        <h2 id="ledger-title" className="headline">What the chain sees, <em>and what it never will.</em></h2>
        <p className="body-2">Midnight lets a contract verify private inputs and publish selected results. The current browser build runs that compiled contract on a local ledger; this is the intended public-network disclosure boundary.</p>
      </Reveal>
      <div className="ledger">
        <Reveal className="ledger-col">
          <p className="label"><Icon name="ledger" size={16} /> Intended public seal record</p>
          <ul className="ledger-list">
            <li><span>Photo fingerprint</span><span className="data">a4e8…1ccaa2</span></li>
            <li><span>Capture time</span><span className="data">2026-10-19 14:02</span></li>
            <li><span>Pool epoch</span><span className="data">0</span></li>
            <li><span>Enrolled credentials</span><span className="data">opaque commitments</span></li>
          </ul>
        </Reveal>
        <Reveal className="ledger-col ledger-private" delay={0.1}>
          <p className="label"><Icon name="lock" size={16} /> Withheld from the seal record</p>
          <ul className="ledger-list">
            <li><span>Which credential sealed it</span><Redacted label="hidden" delay={0.2}><span className="data">credential #07 of 412</span></Redacted></li>
            <li><span>Device key and salt</span><Redacted label="hidden" delay={0.35}><span className="data">04b1…9f2e</span></Redacted></li>
            <li><span>Passkey signature</span><Redacted label="hidden" delay={0.5}><span className="data">3045…a1c0</span></Redacted></li>
            <li><span>Location, serial, name</span><Redacted label="not in seal" delay={0.65}><span className="data">not in seal</span></Redacted></li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Forgeries() {
  const rows = [
    ["Change a sealed file and check it again", "NO_SEAL"],
    ["A credential outside the pool tries to seal", "NOT_ENROLLED"],
    ["Reuse a signature for different pixels", "BAD_SIGNATURE"],
    ["A second signer claims the same file", "ALREADY_SEALED"],
    ["Backdate a stated capture time by two days", "BAD_TIME"],
    ["Submit without user verification", "UV_REQUIRED"],
    ["Sign from a look-alike website", "BAD_SIGNATURE"],
    ["Seal after the credential is revoked", "NOT_ENROLLED"],
  ];
  return (
    <section id="proof" className="section rail" aria-labelledby="proof-title">
      <div className="forgeries">
        <Reveal className="section-head" >
          <h2 id="proof-title" className="headline">Put every claim <em>under pressure.</em></h2>
          <p className="body-2">Seven cases challenge compiled Compact circuits with real P-256 assertions; the changed-file case challenges the fingerprint lookup. Run them and inspect the observed response.</p>
          <a className="btn btn-secondary" style={{ justifySelf: "start" }} href={attacks}>Run the attacks yourself <Icon name="arrow" size={18} /></a>
        </Reveal>
        <Reveal delay={0.1}>
          <table className="press-table">
            <caption className="sr-only">Threat exercises and their observed refusal codes</caption>
            <thead><tr><th scope="col">Attempt</th><th scope="col">Observed response</th></tr></thead>
            <tbody>
              {rows.map(([a, c]) => (
                <tr key={a}><td>{a}</td><td><span className="refusal">{c}</span></td></tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

function BuiltOnMidnight() {
  const spec = [
    ["Contract", "unforged.compact · Compact 0.35 · ZKIR v3"],
    ["Signature check", "P-256 ECDSA verified inside the circuit (secp256r1EcdsaVerify)"],
    ["Passkey profile", "WebAuthn rebuilt in-circuit, adapted from Midnight Passport"],
    ["Anonymity", "Merkle membership over enrolled credentials · minimum pool size enforced"],
    ["Disclosed", "fingerprint · capture time · pool epoch"],
    ["Tests", "26 passing in CI, including ledger indistinguishability"],
    ["Fee strategy", "Pool-sponsored transactions planned; not live in this browser build"],
    ["License", "Apache-2.0"],
  ];
  return (
    <section id="midnight" className="section rail" aria-labelledby="midnight-title">
      <div className="spec">
        <Reveal className="section-head">
          <h2 id="midnight-title" className="headline">Private verification <em>is the product.</em></h2>
          <p className="body-2">
            A public registry can expose the signing key. A conventional service can see every signer-to-file link.
            Unforged uses Compact to verify the signature and private pool membership together, then discloses only the file and pool facts selected by the contract.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="kv spec-sheet">
            {spec.map(([k, v]) => (
              <div key={k}><dt className="label" style={{ letterSpacing: "0.06em" }}>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Closing() {
  const fp = usePhotoFingerprint(`${BASE}media/umbrella.jpg`);
  return (
    <section className="closing rail" aria-labelledby="closing-title">
      <Reveal className="stack" >
        <h2 id="closing-title" className="display" style={{ fontSize: "clamp(2.6rem, 1.4rem + 4.6vw, 5.2rem)" }}>Publish the evidence.<br /><em>Protect the witness.</em></h2>
        <div className="cluster" style={{ marginTop: "var(--s-5)" }}>
          <a className="btn btn-primary" href={studio}>Open the studio <Icon name="arrow" size={18} /></a>
          <a className="btn btn-quiet" href="https://github.com/bunnyyxtan/unforged" target="_blank" rel="noreferrer">Read the code on GitHub</a>
        </div>
      </Reveal>
      {fp && (
        <Reveal className="closing-seal" delay={0.1}>
          <Seal fp={fp} id={sealId(fp)} size={300} />
          <span className="meta">No two seals are alike: each pattern is generated from its photo's fingerprint.</span>
        </Reveal>
      )}
    </section>
  );
}

export function Landing() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Masthead />
      <main id="main">
        <Hero />
        <TradeOff />
        <HowItWorks />
        <Workflow />
        <Ledger />
        <Forgeries />
        <BuiltOnMidnight />
        <Closing />
      </main>
      <footer className="footer">
        <div className="rail footer-row">
          <span className="wordmark small-mark"><Mark size={18} />Unforged</span>
          <p className="meta" style={{ margin: 0, maxWidth: "60ch" }}>
            A seal proves approval of an exact file by a pool credential; it cannot prove camera origin, scene truth or source safety by itself.
            This build runs the compiled contract in a local browser simulation; public-network deployment and device attestation remain release milestones.
            Photographs: Jesse Williams and Mike Petrucci (CC0).
          </p>
        </div>
      </footer>
    </>
  );
}
