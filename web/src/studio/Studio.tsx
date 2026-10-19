import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Field } from "../components/Field";
import { Icon, Mark } from "../components/Icon";
import { href, type StudioTab } from "../lib/route";
import { useTheme } from "../lib/theme";
import { bootstrap, useStore } from "../store";
import { StartScreen } from "./StartScreen";
import { SealScreen } from "./SealScreen";
import { VerifyScreen } from "./VerifyScreen";
import { AttackScreen } from "./AttackScreen";
import { PoolScreen } from "./PoolScreen";
import { DeskScreen } from "./DeskScreen";
import { RelayScreen } from "./RelayScreen";

type NavItem = { tab: StudioTab; label: string; hint: string; icon: "home" | "seal" | "verify" | "desk" | "attack" | "pool" | "relay" };
const MAIN: NavItem[] = [
  { tab: "start", label: "Start here", hint: "How this works", icon: "home" },
  { tab: "seal", label: "Seal a photo", hint: "Protect a photo", icon: "seal" },
  { tab: "verify", label: "Check a photo", hint: "Is it sealed?", icon: "verify" },
];
const MORE: NavItem[] = [
  { tab: "desk", label: "Review desk", hint: "Editors approve photos", icon: "desk" },
  { tab: "pool", label: "Members", hint: "Who can seal", icon: "pool" },
  { tab: "relay", label: "Privacy relay", hint: "Hides timing", icon: "relay" },
  { tab: "attacks", label: "Safety tests", hint: "Try to break it", icon: "attack" },
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

export function PageHead({ title, purpose, aside, eyebrow }: { title: string; purpose: string; aside?: ReactNode; eyebrow?: string }) {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        {eyebrow && <span className="label page-eyebrow">{eyebrow}</span>}
        <h1 className="heading">{title}</h1>
        <p>{purpose}</p>
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
        <span className="studio-name">Practice studio</span>
        <span className="chip chip-ok pool-chip" title="This evaluation pool runs the compiled Compact contract locally">
          <span className="dot" />{s.ready ? "Practice mode" : "Getting ready…"}
        </span>
        <span className="spacer" />
        <button className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Use paper theme" : "Use darkroom theme"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      </header>

      <nav className="studio-rail" aria-label="Workspace">
        {MAIN.map((n) => <RailLink key={n.tab} item={n} tab={tab} reduce={!!reduce} />)}
        <details className="rail-more" open={MORE.some((m) => m.tab === tab) || undefined}>
          <summary><span className="rail-section label">For teams and experts</span></summary>
          {MORE.map((n) => <RailLink key={n.tab} item={n} tab={tab} reduce={!!reduce} />)}
        </details>
        <div className="rail-runtime">
          <span className="rail-runtime-mark"><Icon name="ledger" size={16} /></span>
          <div><strong>Practice mode</strong><span>Everything runs in your browser</span></div>
          <span className="rail-live" aria-label="Ready" />
        </div>
      </nav>

      <main id="studio-main" className="studio-main has-field dot-lattice" tabIndex={-1}>
        <Field place="studio" />
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
              {tab === "start" && <StartScreen />}
              {tab === "seal" && <SealScreen />}
              {tab === "desk" && <DeskScreen />}
              {tab === "verify" && <VerifyScreen />}
              {tab === "attacks" && <AttackScreen />}
              {tab === "pool" && <PoolScreen />}
              {tab === "relay" && <RelayScreen />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function RailLink({ item, tab, reduce }: { item: NavItem; tab: StudioTab; reduce: boolean }) {
  const on = tab === item.tab;
  return (
    <a href={href({ page: "studio", tab: item.tab })} aria-current={on ? "page" : undefined}>
      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
      {on && !reduce && <motion.span layoutId="rail-mark" className="rail-mark" transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }} />}
      {on && reduce && <span className="rail-mark" />}
    </a>
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
