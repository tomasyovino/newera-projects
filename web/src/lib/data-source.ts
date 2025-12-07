import {
  WeeklyEvent, EventSlot, WorldEvent,
  Pack,
  New,
  NewsPage,
  Rule,
  AboutEntry,
} from './types';
import {
  weeklyEventListSchema, donationListSchema, worldEventListSchema,
  packListSchema,
  newListSchema,
  ruleListSchema,
  ruleSchema,
  aboutListSchema,
} from './schemas';
import { DEFAULT_TZ } from './constants';
import { currentWeekday, compareTimeHHmm } from './time';

const isServer = typeof window === 'undefined';

function makeUrl(path: string) {
  if (!isServer) return path;
  const base =
    process.env.API_BASE_URL
    ?? process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`);

  return new URL(path, base).toString();
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = makeUrl(path);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ================== WORLD EVENTS ================== */

export async function getWorldEvents(opts?: { limit?: number; now?: Date }): Promise<WorldEvent[]> {
  const raw = await fetchJson<unknown>(`/api/world-events`);
  return worldEventListSchema.parse(raw);
}

/* ================== WEEKLY EVENTS ================== */

export async function getWeeklyEvents(): Promise<WeeklyEvent[]> {
  const raw = await fetchJson<unknown>('/api/weekly-events');
  return weeklyEventListSchema.parse(raw);
}

export async function getTodayEventSlots(tz = DEFAULT_TZ): Promise<EventSlot[]> {
  const all = await getWeeklyEvents();
  const today = currentWeekday(tz);
  const slots: EventSlot[] = [];
  for (const ev of all) {
    if (ev.dayOfWeek !== today) continue;
    for (const t of ev.times) {
      slots.push({
        id: ev.id,
        name: ev.name,
        description: ev.description,
        dayOfWeek: ev.dayOfWeek,
        time: t,
        durationMinutes: ev.durationMinutes,
        featured: ev.featured,
        icon: ev.icon,
      });
    }
  }
  return slots.sort((a, b) => compareTimeHHmm(a.time, b.time));
}

export async function getWeeklyAgendaSlots(): Promise<EventSlot[]> {
  const all = await getWeeklyEvents();
  const out: EventSlot[] = [];
  for (const ev of all) {
    for (const t of ev.times) {
      out.push({
        id: ev.id,
        name: ev.name,
        description: ev.description,
        dayOfWeek: ev.dayOfWeek,
        time: t,
        durationMinutes: ev.durationMinutes,
        featured: ev.featured,
        icon: ev.icon,
      });
    }
  }
  return out.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || compareTimeHHmm(a.time, b.time));
}

/* ================== DONATIONS / STATUS ================== */

export async function getDonations() {
  const raw = await fetchJson<unknown>('/api/donations');
  return donationListSchema.parse(raw);
}

export async function getPacks(): Promise<Pack[]> {
  return packListSchema.parse(await fetchJson<unknown>('/api/packs'));
}

/* ================== NEWS ================== */
export async function getLatestNews(limit = 3): Promise<New[]> {
  const raw = await fetchJson<unknown>(`/api/news?published=1&limit=${limit}`);
  return newListSchema.parse(raw);
}

export async function getAllPublishedNewsPage(page = 1, limit = 10): Promise<NewsPage> {
  const url = `/api/news?published=1&withMeta=1&limit=${limit}&page=${page}`;
  const raw = await fetchJson<unknown>(url);
  const { items, total, pages }: any = raw as any;
  return {
    items: newListSchema.parse(items),
    total,
    page,
    limit,
    pages,
  };
}

export async function getNewsBySlug(slug: string): Promise<New | null> {
  const raw = await fetchJson<unknown>(`/api/news?published=1&limit=1&slug=${encodeURIComponent(slug)}`);
  const arr = newListSchema.parse(raw);
  return arr[0] ?? null;
}

/* ================== RULES ================== */
export async function getRules(): Promise<Rule[]> {
  const raw = await fetchJson<unknown>('/api/rules');
  return ruleListSchema.parse(raw);
}

export async function getRuleBySlug(slug: string): Promise<Rule | null> {
  try {
    const raw = await fetchJson<unknown>(`/api/rules/${encodeURIComponent(slug)}`);
    return ruleSchema.parse(raw);
  } catch {
    return null;
  }
}

/* ================== ABOUT ================== */
export async function getAbout(): Promise<AboutEntry[]> {
  const raw = await fetchJson<unknown>('/api/about');
  return aboutListSchema.parse(raw);
}