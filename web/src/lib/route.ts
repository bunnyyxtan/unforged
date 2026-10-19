import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "studio"; tab: StudioTab };
export type StudioTab = "start" | "seal" | "desk" | "verify" | "attacks" | "pool" | "relay";

/** Clean URL segment for each screen: /app/seal, /app/check, /app/review ... */
const SLUG: Record<StudioTab, string> = { start: "", seal: "seal", verify: "check", desk: "review", pool: "members", relay: "relay", attacks: "safety" };
const FROM_SLUG = Object.fromEntries(Object.entries(SLUG).map(([tab, slug]) => [slug, tab])) as Record<string, StudioTab>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function parse(pathname: string): Route {
  const path = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname).replace(/\/+$/, "");
  const m = path.match(/^\/app(?:\/([\w-]+))?$/);
  if (!m) return { page: "home" };
  return { page: "studio", tab: m[1] ? FROM_SLUG[m[1]] ?? "start" : "start" };
}

export const href = (r: Route) => (r.page === "home" ? `${BASE}/` : `${BASE}/app${SLUG[r.tab] ? `/${SLUG[r.tab]}` : ""}`);

// Old hash links (#/studio/seal) keep working: rewrite them to the clean path.
function upgradeLegacyHash() {
  if (!location.hash.startsWith("#/")) return;
  const m = location.hash.match(/^#\/studio(?:\/(\w+))?/);
  const legacy: Record<string, StudioTab> = { seal: "seal", desk: "desk", verify: "verify", attacks: "attacks", pool: "pool", relay: "relay" };
  history.replaceState(null, "", m ? href({ page: "studio", tab: legacy[m[1] ?? ""] ?? "start" }) : href({ page: "home" }));
}
if (typeof location !== "undefined") upgradeLegacyHash();

const NAV = "unforged:navigate";

export function go(r: Route) {
  navigate(href(r));
}

function navigate(url: string) {
  if (url === location.pathname + location.search) return;
  history.pushState(null, "", url);
  window.scrollTo(0, 0);
  dispatchEvent(new Event(NAV));
}

/** Same-tab links inside the app switch screens without reloading the page. */
function interceptLinks(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || a.target === "_blank" || a.hasAttribute("download") || a.origin !== location.origin) return;
  if (a.hash && a.pathname === location.pathname) return; // in-page anchor
  const inApp = a.pathname === `${BASE}/` || a.pathname === BASE || a.pathname.startsWith(`${BASE}/app`);
  if (!inApp) return;
  e.preventDefault();
  navigate(a.pathname + a.search + a.hash);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.pathname));
  useEffect(() => {
    const on = () => setRoute(parse(location.pathname));
    const onHash = () => { upgradeLegacyHash(); on(); };
    addEventListener("hashchange", onHash);
    addEventListener("popstate", on);
    addEventListener(NAV, on);
    document.addEventListener("click", interceptLinks);
    return () => {
      removeEventListener("hashchange", onHash);
      removeEventListener("popstate", on);
      removeEventListener(NAV, on);
      document.removeEventListener("click", interceptLinks);
    };
  }, []);
  return route;
}

const TITLES: Record<StudioTab, string> = {
  start: "Start", seal: "Seal a photo", verify: "Check a photo", desk: "Review desk", pool: "Members", relay: "Privacy relay", attacks: "Safety tests",
};
export const titleFor = (r: Route) => (r.page === "home" ? "Unforged · Evidence without exposure" : `${TITLES[r.tab]} · Unforged`);
