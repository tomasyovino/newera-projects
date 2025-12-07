import type { DayOfWeek, Locale } from './types';

export function currentWeekday(tz: string): DayOfWeek {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
    .format(new Date());
  const map: Record<string, DayOfWeek> = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 };
  return map[wd] ?? (new Date().getDay() as DayOfWeek);
}

export function compareTimeHHmm(a: string, b: string) {
  return a.localeCompare(b);
}

export function joinTimes(times: string[], locale: Locale): string {
  if (times.length <= 1) return times[0] ?? '';
  const last = times[times.length - 1];
  const head = times.slice(0, -1).join(', ');
  const conj = locale === 'es' ? ' y ' : ' and ';
  return `${head}${conj}${last}`;
}