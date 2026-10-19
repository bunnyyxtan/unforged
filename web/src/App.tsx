import { useEffect, useState } from "react";
import { Capture } from "./screens/Capture";
import { Verify } from "./screens/Verify";
import { AttackLab } from "./screens/AttackLab";
import { PoolDesk } from "./screens/PoolDesk";
import { HowItWorks } from "./screens/HowItWorks";
import { bootstrap, useStore, type SealRecord } from "./store";

type Tab = "seal" | "verify" | "attacks" | "pool" | "how";
const TABS: [Tab, string][] = [
  ["seal", "Seal a photo"],
  ["verify", "Verify"],
  ["attacks", "Attack lab"],
  ["pool", "Pool desk"],
  ["how", "How it works"],
];

export function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>("seal");
  const [preset, setPreset] = useState<SealRecord>();
  const [theme, setTheme] = useState<"light" | "dark" | undefined>();

  useEffect(() => { void bootstrap(); }, []);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  const dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  const go = (t: Tab) => {
    setTab(t);
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="var(--seal)" /><circle cx="32" cy="32" r="19" fill="none" stroke="var(--bg)" strokeWidth="3" /></svg>
            Unforged
          </a>
          <span className="chip net"><span className="dot" />Midnight · ledger 9 · in-browser runtime</span>
          <span className="spacer" />
          <a className="chip" href="https://github.com/bunnyyxtan/unforged" target="_blank" rel="noreferrer">GitHub</a>
          <button className="theme-btn" aria-label="Toggle dark mode" onClick={() => setTheme(dark ? "light" : "dark")}>{dark ? "☀" : "☾"}</button>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div>
            <h1>Prove it's real.<br /><em>Keep who took it secret.</em></h1>
            <p className="lede">
              Your phone's secure chip seals a photo the moment it's taken. A zero-knowledge proof on Midnight shows it came from one of a pool's enrolled phones, never which one.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <button className="btn seal" onClick={() => go("seal")}>Seal a photo</button>
              <button className="btn ghost" onClick={() => go("verify")}>Verify a photo</button>
            </div>
          </div>
          <div className="stats" aria-label="Pool statistics">
            <div><b>{String(s.pool?.ledger.deviceCount ?? "–")}</b><span>phones in pool</span></div>
            <div><b>{String(s.pool?.ledger.sealCount ?? "–")}</b><span>photos sealed</span></div>
            <div><b>0</b><span>photographers revealed</span></div>
          </div>
        </section>

        <section id="app" style={{ scrollMarginTop: 72 }}>
          <div className="tabs" role="tablist">
            {TABS.map(([t, label]) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{label}</button>
            ))}
          </div>
          {!s.ready && <div className="card">Starting the pool: deploying the contract and enrolling 7 reporters…</div>}
          {s.error && <div className="notice error">{s.error}</div>}
          {s.ready && !s.error && (
            <>
              {tab === "seal" && <Capture onVerify={(r) => { setPreset(r); setTab("verify"); }} />}
              {tab === "verify" && <Verify preset={preset} />}
              {tab === "attacks" && <AttackLab />}
              {tab === "pool" && <PoolDesk />}
              {tab === "how" && <HowItWorks />}
            </>
          )}
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>
            This demo runs the real compiled <b>unforged.compact</b> (P-256 passkey verification included) on Midnight's compact-runtime in your browser. Network deployment follows the ledger-9 fork. The demo pool resets when you reload.
          </span>
          <span>Apache-2.0 · Built for the Midnight Buildathon · A seal proves a real, unedited capture. It doesn't prove what a photo means.</span>
        </div>
      </footer>
    </>
  );
}
