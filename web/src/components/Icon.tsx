// A small, consistent stroke icon family (1.6 stroke, 20 px grid).
const P: Record<string, string> = {
  seal: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z",
  verify: "M8.5 3a5.5 5.5 0 1 0 3.4 9.8L16 17M6.5 8.5l1.6 1.6 3-3.2",
  attack: "M10 2.5 3.5 5v4.6c0 3.7 2.8 6.8 6.5 7.9 3.7-1.1 6.5-4.2 6.5-7.9V5L10 2.5ZM10 7v3.5M10 13h.01",
  pool: "M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 16c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4m-.5-2.6c.7-.9 1.8-1.4 3-1.4 2.1 0 3.9 1.4 4.5 4",
  check: "M4.5 10.5 8 14l7.5-8",
  info: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM10 9v4.5M10 6.5h.01",
  alert: "M10 3 2.5 16.5h15L10 3Zm0 5.5v3.5m0 2.5h.01",
  x: "M5 5l10 10M15 5 5 15",
  arrow: "M4 10h12m-4.5-4.5L16 10l-4.5 4.5",
  back: "M16 10H4m4.5-4.5L4 10l4.5 4.5",
  camera: "M3 6.5h3l1.5-2h5L14 6.5h3v9.5H3V6.5Zm7 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  image: "M3 4h14v12H3V4Zm0 9 4-4 3 3 2-2 5 5M13 7.5h.01",
  upload: "M10 13V3.5M6 7.5l4-4 4 4M3.5 13v3.5h13V13",
  download: "M10 3.5V13m-4-4 4 4 4-4M3.5 13v3.5h13V13",
  copy: "M7 7V3.5h9.5V13H13M3.5 7H13v9.5H3.5V7Z",
  sun: "M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM10 1.5v2m0 13v2M1.5 10h2m13 0h2M4 4l1.4 1.4m9.2 9.2L16 16M4 16l1.4-1.4m9.2-9.2L16 4",
  moon: "M16.5 12.2A7 7 0 0 1 7.8 3.5 7 7 0 1 0 16.5 12.2Z",
  lock: "M5 9h10v8H5V9Zm2 0V6.5a3 3 0 0 1 6 0V9",
  fingerprint: "M5.5 7.5a5 5 0 0 1 9 0M4 11c0-1 .2-2 .6-2.8M16 11c0 2.5-.5 4.5-1.5 6M10 9.5c0 3-.6 5.6-2 8M12.8 10.5c0 2.6-.4 4.6-1.3 6.5M7.2 10.8c0 2-.4 3.6-1.2 5",
  chip: "M6 6h8v8H6V6Zm2 2h4v4H8V8ZM8 3.5V6m4-2.5V6M8 14v2.5m4-2.5v2.5M3.5 8H6m-2.5 4H6m8-4h2.5M14 12h2.5",
  ledger: "M4 3.5h12v13H4v-13ZM7 7h6M7 10h6M7 13h3.5",
};

export function Icon({ name, size = 20, label }: { name: keyof typeof P; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={P[name]} />
    </svg>
  );
}

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true">
      <circle r="11" fill="none" stroke="var(--seal)" strokeWidth="1.6" />
      <circle r="7.2" fill="none" stroke="var(--seal)" strokeWidth="0.8" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * 2.6} y1={Math.sin(a) * 2.6} x2={Math.cos(a) * 6.2} y2={Math.sin(a) * 6.2} stroke="var(--seal)" strokeWidth="0.9" strokeLinecap="round" />;
      })}
    </svg>
  );
}
