import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "studio"; tab: StudioTab };
export type StudioTab = "start" | "seal" | "desk" | "verify" | "attacks" | "pool" | "relay";

const TABS: StudioTab[] = ["start", "seal", "desk", "verify", "attacks", "pool", "relay"];

function parse(hash: string): Route {
  const m = hash.match(/^#\/studio(?:\/(\w+))?/);
  if (!m) return { page: "home" };
  const tab = (TABS as string[]).includes(m[1] ?? "") ? (m[1] as StudioTab) : "start";
  return { page: "studio", tab };
}

export const href = (r: Route) => (r.page === "home" ? "#/" : `#/studio/${r.tab}`);

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function go(r: Route) {
  location.hash = href(r);
}
