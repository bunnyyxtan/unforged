import { useState } from "react";
import { Icon } from "../components/Icon";
import { href } from "../lib/route";
import { attacks, MIN_POOL, useStore, verifyBytes, type AttackOutcome } from "../store";
import { PageHead } from "./Studio";

type Row = AttackOutcome | "running" | { note: string; info: true };

export function AttackScreen() {
  const s = useStore();
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [all, setAll] = useState(false);
  const phones = Number(s.pool?.ledger.deviceCount ?? 0);
  const latest = s.seals[0];

  async function onePixel(): Promise<Row> {
    if (!latest) return { note: "Seal a photo first, then run this.", info: true };
    const img = new Image();
    img.src = latest.url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const p = g.getImageData(10, 10, 1, 1);
    p.data[0] = (p.data[0] + 1) % 256;
    g.putImageData(p, 10, 10);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.92));
    const res = await verifyBytes(new Uint8Array(await blob.arrayBuffer()));
    return res.kind === "none"
      ? { ok: false, code: "NO_SEAL", note: `One pixel of ${latest.id} changed, so the fingerprint no longer matches any seal.` }
      : { ok: true, code: "ACCEPTED", note: "Unexpected: the edited photo still verified." };
  }

  async function run(key: string) {
    setRows((r) => ({ ...r, [key]: "running" }));
    const out = key === "pixel" ? await onePixel() : await attacks[key].run();
    setRows((r) => ({ ...r, [key]: out }));
  }

  async function runAll() {
    setAll(true);
    for (const key of ["pixel", ...Object.keys(attacks)]) {
      if (key === "stolen" && phones <= MIN_POOL + 1) continue;
      await run(key);
    }
    setAll(false);
  }

  const list: { key: string; title: string; story: string }[] = [
    { key: "pixel", title: "Change one pixel", story: "Edit your latest sealed photo by a single pixel, then verify it." },
    ...Object.entries(attacks).map(([key, a]) => ({ key, title: a.title, story: a.story })),
  ];

  return (
    <>
      <PageHead
        title="Attack lab"
        purpose="Each attempt runs against the compiled contract in this pool. Refusals come from the circuit itself, exactly as they would on Midnight, not from checks in this interface."
        aside={<button className="btn btn-primary" onClick={runAll} disabled={all} aria-busy={all}>{all ? <><span className="spinner" /> Running…</> : "Run every attack"}</button>}
      />
      <table className="attack-table">
        <thead><tr><th scope="col">Attempt</th><th scope="col"><span className="sr-only">Action</span></th><th scope="col">Contract response</th></tr></thead>
        <tbody>
          {list.map(({ key, title, story }) => {
            const r = rows[key];
            const blocked = key === "stolen" && phones <= MIN_POOL + 1;
            return (
              <tr key={key}>
                <td><span className="title">{title}</span><br /><span className="meta">{story}</span></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => void run(key)} disabled={r === "running" || all || blocked} aria-busy={r === "running"}>
                    {r === "running" ? <><span className="spinner" /> Running</> : r ? "Run again" : "Run"}
                  </button>
                </td>
                <td aria-live="polite">
                  {blocked && !r && <span className="meta">The pool is at its anonymity floor. Removing another phone would block everyone, so this run is paused.</span>}
                  {r && r !== "running" && "info" in r && (
                    <span className="meta">{r.note} <a href={href({ page: "studio", tab: "seal" })}>Go to Seal</a></span>
                  )}
                  {r && r !== "running" && "code" in r && (
                    <div className="attack-result">
                      <span className={r.ok ? "chip chip-danger" : "refusal"}>{r.ok ? "Accepted (unexpected)" : r.code}</span>
                      <span className="meta">{r.note}</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
