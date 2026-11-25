// Indian number formatting without Intl dependency (Hermes-safe)
export function fmtINR(n: number | null | undefined): string {
  const num = Math.round(n ?? 0);
  const str = String(Math.abs(num));
  if (str.length <= 3) return num < 0 ? `-${str}` : str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const formatted = grouped + ',' + last3;
  return num < 0 ? `-${formatted}` : formatted;
}
