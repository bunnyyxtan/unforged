import { lazy, Suspense } from "react";
import { Landing } from "./landing/Landing";
import { Toaster } from "./studio/toast";
import { useEffect } from "react";
import { titleFor, useRoute } from "./lib/route";

// The studio pulls in the contract runtime (WASM); the landing page doesn't need it.
const Studio = lazy(() => import("./studio/Studio").then((m) => ({ default: m.Studio })));

export function App() {
  const route = useRoute();
  useEffect(() => { document.title = titleFor(route); }, [route]);
  return (
    <>
      {route.page === "home" ? (
        <Landing />
      ) : (
        <Suspense fallback={<div className="studio-loading" aria-busy="true" aria-label="Opening the studio" />}>
          <Studio tab={route.tab} />
        </Suspense>
      )}
      <Toaster />
    </>
  );
}
