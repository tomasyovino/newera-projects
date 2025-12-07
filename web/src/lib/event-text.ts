import type { EventSlot, Locale } from './types';
import { joinTimes } from './time';

export function groupTodayByTitle(slots: EventSlot[], locale: Locale) {
  const map = new Map<string, string[]>();
  for (const s of slots) {
    const title = s.name[locale];
    const arr = map.get(title) || [];
    arr.push(s.time);
    map.set(title, arr);
  }
  return Array.from(map.entries()).map(([title, times]) => ({
    title,
    times: times.sort((a,b)=> a.localeCompare(b))
  }));
}

export function buildTodaySentences(slots: EventSlot[], locale: Locale): string[] {
  const groups = groupTodayByTitle(slots, locale);
  if (groups.length === 0) {
    return locale === 'es'
      ? ['Hoy no hay eventos programados.']
      : ['There are no events scheduled for today.'];
  }
  const prefix = locale === 'es' ? 'Hoy hay' : 'Today there is';
  const at     = locale === 'es' ? 'a las' : 'at';
  return groups.map(g => `${prefix} ${g.title} ${at} ${joinTimes(g.times, locale)}.`);
}
