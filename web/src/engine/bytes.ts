export const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export const fromHex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));
export const utf8 = (s: string) => new TextEncoder().encode(s);
export const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
export const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export function base64url(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64url(s: string): Uint8Array {
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

export const bigintFrom = (b: Uint8Array) => b.reduce((n, v) => (n << 8n) | BigInt(v), 0n);

export async function sha256(data: Uint8Array | ArrayBuffer): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource));
}

/** Short human-friendly seal id from a fingerprint, e.g. UF-7K3Q-9D2M. */
export function sealId(fp: Uint8Array): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let n = bigintFrom(fp.slice(0, 5));
  let out = "";
  for (let i = 0; i < 8; i++) {
    out = alphabet[Number(n % 32n)] + out;
    n /= 32n;
  }
  return `UF-${out.slice(0, 4)}-${out.slice(4)}`;
}
