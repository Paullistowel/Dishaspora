// Small date helpers for the planner / tracker (local-time, YYYY-MM-DD keys).

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return ymd(new Date());
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = fromYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** Monday-based start of the week containing `s`. */
export function startOfWeek(s: string): string {
  const d = fromYmd(s);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return ymd(d);
}

export function weekDays(startYmd: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startYmd, i));
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayShort(s: string): string {
  return WEEKDAY[fromYmd(s).getDay()];
}

export function dayNum(s: string): number {
  return fromYmd(s).getDate();
}

export function prettyDate(s: string): string {
  const d = fromYmd(s);
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
}

/** Compact relative time from an ISO timestamp, e.g. "just now", "25m", "3h", "2d". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const d = new Date(iso);
  return `${MONTH[d.getMonth()]} ${d.getDate()}`;
}
