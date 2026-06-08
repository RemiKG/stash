// small shared utilities
export function id(prefix = ""): string {
  const s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${s}` : s;
}
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const v = Math.round(n);
  return "$" + v.toLocaleString("en-US");
}
export function band(lo?: number, hi?: number): string {
  if (lo == null || hi == null) return "—";
  return `${money(lo)}–${money(hi)}`;
}
