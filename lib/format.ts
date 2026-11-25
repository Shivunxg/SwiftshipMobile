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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// "25 Nov '26"
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '';
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} '${String(dt.getFullYear()).slice(-2)}`;
}

// "Wed, 25 Nov"
export function fmtDateLong(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
