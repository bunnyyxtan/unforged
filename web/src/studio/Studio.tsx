import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, Mark } from "../components/Icon";
import { href, type StudioTab } from "../lib/route";
import { useTheme } from "../lib/theme";
import { bootstrap, useStore } from "../store";
import { SealScreen } from "./SealScreen";
import { VerifyScreen } from "./VerifyScreen";
import { AttackScreen } from "./AttackScreen";
import { PoolScreen } from "./PoolScreen";

const NAV: { tab: StudioTab; label: string; icon: "seal" | "verify" | "attack" | "pool" }[] = [
  { tab: "seal", label: "Seal", icon: "seal" },
  { tab: "verify", label: "Verify", icon: "verify" },
  { tab: "attacks", label: "Attack lab", icon: "attack" },
  { tab: "pool", label: "Pool", icon: "pool" },
];

/** Show a placeholder only if loading actually takes noticeable time. */
function useDelayed(active: boolean, ms = 300) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) return setShow(false);
    const id = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(id);
  }, [active, ms]);
  return show;
}

export function PageHead({ title, purpose, aside }: { title: string; purpose: string; aside?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <h1 className="heading">{title}</h1>
        <p className="meta" style={{ margin: 0, maxWidth: "62ch" }}>{purpose}</p>
      </div>
      {aside}
    </header>
  );
}

export function Studio({ tab }: { tab: StudioTab }) {
  const s = useStore();
  const [theme, toggle] = useTheme();
  const reduce = useReducedMotion();
  const slow = useDelayed(!s.ready);
  useEffect(() => { void bootstrap(); }, []);
  useEffect(() => { document.getElementById("studio-main")?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [tab]);

  const phones = Number(s.pool?.ledger.deviceCount ?? 0);
  return (
    <div className="studio">
      <a className="skip" href="#studio-main">Skip to content</a>
      <header className="studio-bar">
        <a className="wordmark" href="#/" aria-label="Unforged home"><Mark size={20} />Unforged</a>
        <span className="studio-divider" aria-hidden="true" />
        <span className="studio-name">Studio</span>
        <span className="chip chip-ok pool-chip" title="This pool runs on Midnight's compact-runtime in your browser">
          <span className="dot" />{s.ready ? `Demo pool · ${phones} phones · runs in your browser` : "Starting the demo pool…"}
        </span>
        <span className="spacer" />
        <button className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Use paper theme" : "Use darkroom theme"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <a className="btn btn-quiet btn-sm back-link" href="#/"><Icon name="back" size={16} /> Site</a>
      </header>

      <nav className="studio-rail" aria-label="Studio">
        {NAV.map((n) => (
          <a key={n.tab} href={href({ page: "studio", tab: n.tab })} aria-current={tab === n.tab ? "page" : undefined}>
            <Icon name={n.icon} size={20} />
            <span>{n.label}</span>
            {tab === n.tab && !reduce && <motion.span layoutId="rail-mark" className="rail-mark" transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }} />}
            {tab === n.tab && reduce && <span className="rail-mark" />}
          </a>
        ))}
        <p className="rail-note meta">Everything here runs the compiled Unforged contract locally. Reloading resets the demo pool.</p>
      </nav>

      <main id="studio-main" className="studio-main" tabIndex={-1}>
        {s.error && (
          <div className="status status-error" role="alert">
            <Icon name="alert" />
            <p><strong>The demo pool couldn't start.</strong>{s.error} Reload the page to try again.</p>
          </div>
        )}
        {!s.ready && slow && <StudioSkeleton />}
        {s.ready && !s.error && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {tab === "seal" && <SealScreen />}
              {tab === "verify" && <VerifyScreen />}
              {tab === "attacks" && <AttackScreen />}
              {tab === "pool" && <PoolScreen />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="stack" style={{ "--gap": "16px" } as React.CSSProperties} aria-busy="true" aria-label="Loading the demo pool">
      <div className="skeleton" style={{ height: 34, width: 220 }} />
      <div className="skeleton" style={{ height: 16, width: 420, maxWidth: "100%" }} />
      <div className="skeleton" style={{ height: 360, borderRadius: 16 }} />
    </div>
  );
}
