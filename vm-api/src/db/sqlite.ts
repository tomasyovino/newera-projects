import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { AboutEntry, Donation, LocalizedString, New, Pack, PackItem, Rule, WeeklyEvent, WorldEvent } from '../lib/types';
import { rowToAbout, rowToDonation, rowToNew, rowToPack, rowToRule } from '../helpers/dbHelpers';
import { donationSchema, newSchema } from '../lib/schemas';
import { boolToInt, intToBool, ls, nowIso } from '../utils/dbUtils';

// Ruta del archivo SQLite
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, 'app.db');

// Asegurar carpeta
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Abrir DB
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Crear tablas si no existen
db.exec(`
CREATE TABLE IF NOT EXISTS weekly_events (
  id TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  desc_es TEXT,
  desc_en TEXT,
  day_of_week INTEGER NOT NULL,
  times_json TEXT NOT NULL,            -- JSON string[] "HH:mm"
  duration_minutes INTEGER,
  featured INTEGER NOT NULL DEFAULT 0, -- 0/1
  icon TEXT,
  sphere_cmd TEXT                      -- comando Sphere a ejecutar al inicio
);

CREATE TABLE IF NOT EXISTS world_events (
  id TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  desc_es TEXT,
  desc_en TEXT,
  headline_es TEXT,
  headline_en TEXT,
  location_es TEXT,
  location_en TEXT,
  starts_at TEXT NOT NULL,  -- ISO8601
  ends_at TEXT NOT NULL,    -- ISO8601
  featured INTEGER NOT NULL DEFAULT 0,
  banner TEXT,
  highlights_json TEXT,     -- JSON LocalizedString[]
  rewards_json TEXT,        -- JSON LocalizedString[]
  warnings_json TEXT,       -- JSON LocalizedString[]
  sphere_start_cmd TEXT,    -- comando a ejecutar al inicio (opcional)
  sphere_end_cmd   TEXT     -- comando a ejecutar al fin (opcional)
);

CREATE INDEX IF NOT EXISTS idx_world_events_ends_at   ON world_events(ends_at);
CREATE INDEX IF NOT EXISTS idx_world_events_starts_at ON world_events(starts_at);

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  desc_es TEXT,
  desc_en TEXT,
  category TEXT NOT NULL,
  scope TEXT NOT NULL,
  price_eur REAL,
  price_ne REAL,
  price_ne_fake REAL,
  featured INTEGER DEFAULT 0,
  icon TEXT,
  is_special INTEGER NOT NULL DEFAULT 0,
  show_item INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_donations_show_feat_created
  ON donations(show_item, featured, created_at);

CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  desc_es TEXT,
  desc_en TEXT,

  price_eur REAL,
  price_ne REAL,
  price_ne_fake REAL,

  featured INTEGER NOT NULL DEFAULT 0,
  icon TEXT,

  items_json TEXT NOT NULL,       -- JSON: Array<{ donationId:string, qty?:number }>
  metadata_json TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_packs_featured_created
  ON packs(featured, created_at);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_es TEXT,
  excerpt_en TEXT,
  body_es TEXT NOT NULL,
  body_en TEXT NOT NULL,
  cover TEXT,
  tags_json TEXT,            -- string[]
  published_at TEXT,         -- ISO (nullable => draft)
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(featured);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_es  TEXT NOT NULL,  -- markdown
  body_en  TEXT NOT NULL,  -- markdown
  category TEXT,
  tags_json TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rules_active_sort ON rules(active, sort, created_at);

CREATE TABLE IF NOT EXISTS about (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  body_es_md TEXT NOT NULL,   -- markdown ES
  body_en_md TEXT NOT NULL,   -- markdown EN
  tags_json TEXT,             -- string[]
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, -- 0/1
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_about_active_sort ON about(active, sort, created_at);
`);


function parseJsonArray<T>(s: string | null | undefined, fallback: T): T {
    if (!s) return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
}

// ---------- Queries públicas ----------
export function dbListWeekly(): WeeklyEvent[] {
    const rows = db.prepare(`SELECT * FROM weekly_events`).all() as any[];
    return rows.map(r => ({
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        dayOfWeek: r.day_of_week,
        times: parseJsonArray<string[]>(r.times_json, []),
        durationMinutes: r.duration_minutes ?? undefined,
        featured: intToBool(r.featured),
        icon: r.icon ?? undefined,
        sphereCmd: undefined,
    }));
}

export function dbListAllWeekly(): WeeklyEvent[] {
    const rows = db.prepare(`SELECT * FROM weekly_events`).all() as any[];
    return rows.map(r => ({
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        dayOfWeek: r.day_of_week,
        times: parseJsonArray<string[]>(r.times_json, []),
        durationMinutes: r.duration_minutes ?? undefined,
        featured: intToBool(r.featured),
        icon: r.icon ?? undefined,
        sphereCmd: r.sphere_cmd ?? undefined,
    }));
}

export function dbGetWeekly(id: string): WeeklyEvent | undefined {
    const r = db.prepare(`SELECT * FROM weekly_events WHERE id=?`).get(id) as any;
    if (!r) return;
    return {
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        dayOfWeek: r.day_of_week,
        times: parseJsonArray<string[]>(r.times_json, []),
        durationMinutes: r.duration_minutes ?? undefined,
        featured: intToBool(r.featured),
        icon: r.icon ?? undefined,
    };
}

export function dbCreateWeekly(input: Omit<WeeklyEvent, 'id'> & { id?: string }): WeeklyEvent {
    const id = input.id ?? ('ev_' + Math.random().toString(36).slice(2, 8));
    db.prepare(`
    INSERT INTO weekly_events
    (id, name_es, name_en, desc_es, desc_en, day_of_week, times_json, duration_minutes, featured, icon, sphere_cmd)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        input.name.es, input.name.en,
        input.description?.es ?? null, input.description?.en ?? null,
        input.dayOfWeek,
        JSON.stringify(input.times ?? []),
        input.durationMinutes ?? null,
        boolToInt(input.featured),
        input.icon ?? null,
        input.sphereCmd ?? null,
    );
    return dbGetWeekly(id)!;
}

export function dbUpdateWeekly(id: string, input: Omit<WeeklyEvent, 'id'> & { id?: string }): WeeklyEvent {
    db.prepare(`
    UPDATE weekly_events
      SET name_es=?, name_en=?, desc_es=?, desc_en=?, day_of_week=?, times_json=?,
          duration_minutes=?, featured=?, icon=?, sphere_cmd=?
      WHERE id=?
  `).run(
        input.name.es, input.name.en,
        input.description?.es ?? null, input.description?.en ?? null,
        input.dayOfWeek,
        JSON.stringify(input.times ?? []),
        input.durationMinutes ?? null,
        boolToInt(input.featured),
        input.icon ?? null,
        input.sphereCmd ?? null,
        id,
    );
    return dbGetWeekly(id)!;
}

export function dbRemoveWeekly(id: string): void {
    db.prepare(`DELETE FROM weekly_events WHERE id=?`).run(id);
}

export function dbListWorld(
    opts: { limit?: number; from?: Date } = {}
): WorldEvent[] {
    const limit = Math.max(1, opts.limit ?? 6);
    const fromIso = (opts.from ?? new Date()).toISOString();

    const rows = db.prepare(`
    SELECT *
      FROM world_events
     WHERE datetime(ends_at) >= datetime(?)
     ORDER BY datetime(starts_at) ASC
     LIMIT ?
  `).all(fromIso, limit) as any[];

    return rows.map(r => ({
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        headline: (r.headline_es || r.headline_en) ? ls(r.headline_es, r.headline_en) : undefined,
        location: (r.location_es || r.location_en) ? ls(r.location_es, r.location_en) : undefined,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        featured: intToBool(r.featured),
        banner: r.banner ?? undefined,
        highlights: parseJsonArray<LocalizedString[]>(r.highlights_json, []),
        rewards: parseJsonArray<LocalizedString[]>(r.rewards_json, []),
        warnings: parseJsonArray<LocalizedString[]>(r.warnings_json, []),
        sphereStartCmd: undefined,
        sphereEndCmd: undefined,
    }));
}

export function dbListAllWorld(): WorldEvent[] {
    const rows = db.prepare(`SELECT * FROM world_events`).all() as any[];
    return rows.map(r => ({
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        headline: (r.headline_es || r.headline_en) ? ls(r.headline_es, r.headline_en) : undefined,
        location: (r.location_es || r.location_en) ? ls(r.location_es, r.location_en) : undefined,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        featured: intToBool(r.featured),
        banner: r.banner ?? undefined,
        highlights: parseJsonArray<LocalizedString[]>(r.highlights_json, []),
        rewards: parseJsonArray<LocalizedString[]>(r.rewards_json, []),
        warnings: parseJsonArray<LocalizedString[]>(r.warnings_json, []),
        sphereStartCmd: r.sphere_start_cmd ?? undefined,
        sphereEndCmd: r.sphere_end_cmd ?? undefined,
    }));
}

export function dbGetWorld(id: string): WorldEvent | undefined {
    const r = db.prepare(`SELECT * FROM world_events WHERE id=?`).get(id) as any;
    if (!r) return;
    return {
        id: r.id,
        name: ls(r.name_es, r.name_en),
        description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
        headline: (r.headline_es || r.headline_en) ? ls(r.headline_es, r.headline_en) : undefined,
        location: (r.location_es || r.location_en) ? ls(r.location_es, r.location_en) : undefined,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        featured: intToBool(r.featured),
        banner: r.banner ?? undefined,
        highlights: parseJsonArray<LocalizedString[]>(r.highlights_json, []),
        rewards: parseJsonArray<LocalizedString[]>(r.rewards_json, []),
        warnings: parseJsonArray<LocalizedString[]>(r.warnings_json, []),
    };
}

export function dbCreateWorld(input: Omit<WorldEvent, 'id'> & { id?: string }): WorldEvent {
    const id = input.id ?? ('we_' + Math.random().toString(36).slice(2, 8));
    db.prepare(`
    INSERT INTO world_events
    (id, name_es, name_en, desc_es, desc_en, headline_es, headline_en, location_es, location_en,
     starts_at, ends_at, featured, banner, highlights_json, rewards_json, warnings_json, sphere_start_cmd, sphere_end_cmd)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        input.name.es, input.name.en,
        input.description?.es ?? null, input.description?.en ?? null,
        input.headline?.es ?? null, input.headline?.en ?? null,
        input.location?.es ?? null, input.location?.en ?? null,
        input.startsAt, input.endsAt,
        boolToInt(input.featured),
        input.banner ?? null,
        input.highlights ? JSON.stringify(input.highlights) : null,
        input.rewards ? JSON.stringify(input.rewards) : null,
        input.warnings ? JSON.stringify(input.warnings) : null,
        input.sphereStartCmd ?? null,
        input.sphereEndCmd ?? null,
    );
    return dbGetWorld(id)!;
}

export function dbUpdateWorld(id: string, input: Omit<WorldEvent, 'id'> & { id?: string }): WorldEvent {
    db.prepare(`
    UPDATE world_events
      SET name_es=?, name_en=?, desc_es=?, desc_en=?, headline_es=?, headline_en=?,
          location_es=?, location_en=?, starts_at=?, ends_at=?, featured=?, banner=?,
          highlights_json=?, rewards_json=?, warnings_json=?, sphere_start_cmd=?, sphere_end_cmd=?
      WHERE id=?
  `).run(
        input.name.es, input.name.en,
        input.description?.es ?? null, input.description?.en ?? null,
        input.headline?.es ?? null, input.headline?.en ?? null,
        input.location?.es ?? null, input.location?.en ?? null,
        input.startsAt, input.endsAt,
        boolToInt(input.featured), input.banner ?? null,
        input.highlights ? JSON.stringify(input.highlights) : null,
        input.rewards ? JSON.stringify(input.rewards) : null,
        input.warnings ? JSON.stringify(input.warnings) : null,
        input.sphereStartCmd ?? null,
        input.sphereEndCmd ?? null,
        id,
    );
    return dbGetWorld(id)!;
}

export function dbRemoveWorld(id: string): void {
    db.prepare(`DELETE FROM world_events WHERE id=?`).run(id);
}

export function dbListDonationItem(): Donation[] {
    const rows = db.prepare(
        `SELECT * FROM donations WHERE show_item = 1
     ORDER BY featured DESC, created_at DESC`
    ).all() as any[];
    return rows.map(rowToDonation);
}

export function dbListDonationsAll(): Donation[] {
    const rows = db.prepare(`
    SELECT * FROM donations
    ORDER BY featured DESC, created_at DESC
  `).all() as any[];
    return rows.map(rowToDonation);
}

export function dbGetDonationItem(id: string): Donation | undefined {
    const r = db.prepare(`SELECT * FROM donations WHERE id=?`).get(id) as any;
    return r ? rowToDonation(r) : undefined;
}

export function dbCreateDonationItem(input: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Donation {
    const id = input.id ?? ('do_' + Math.random().toString(36).slice(2, 8));
    const now = nowIso();

    const candidate = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
    };
    const data = donationSchema.parse(candidate);

    db.prepare(`
    INSERT INTO donations (
      id, slug, name_es, name_en, desc_es, desc_en,
      category, scope,
      price_eur, price_ne, price_ne_fake,
      featured, icon, is_special, show_item,
      metadata_json, created_at, updated_at
    ) VALUES (
      @id, @slug, @name_es, @name_en, @desc_es, @desc_en,
      @category, @scope,
      @price_eur, @price_ne, @price_ne_fake,
      @featured, @icon, @is_special, @show_item,
      @metadata_json, @created_at, @updated_at
    )
  `).run({
        id: data.id,
        slug: data.slug,
        name_es: data.name.es,
        name_en: data.name.en,
        desc_es: data.description?.es ?? null,
        desc_en: data.description?.en ?? null,
        category: data.category,
        scope: data.scope,
        price_eur: data.price.eur ?? null,
        price_ne: data.price.ne ?? null,
        price_ne_fake: data.price.neFake ?? null,
        featured: boolToInt(!!data.featured),
        icon: data.icon ?? null,
        is_special: boolToInt(!!data.isSpecial),
        show_item: boolToInt(!!data.showItem),
        metadata_json: data.metadata ? JSON.stringify(data.metadata) : null,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
    });

    return dbGetDonationItem(id)!;
}

export function dbUpdateDonationItem(id: string, input: Partial<Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>>): Donation {
    const existing = dbGetDonationItem(id);
    if (!existing) throw new Error('Not found');

    const candidate: Donation = {
        ...existing,
        ...input,
        id,
        name: { es: input.name?.es ?? existing.name.es, en: input.name?.en ?? existing.name.en },
        description: input.description
            ? { es: input.description.es ?? existing.description?.es ?? '', en: input.description.en ?? existing.description?.en ?? '' }
            : existing.description,
        price: {
            eur: input.price?.eur ?? existing.price.eur,
            ne: input.price?.ne ?? existing.price.ne,
            neFake: input.price?.neFake ?? existing.price.neFake,
        },
        updatedAt: nowIso(),
    };

    const data = donationSchema.parse(candidate);

    db.prepare(`
    UPDATE donations
       SET slug=@slug, name_es=@name_es, name_en=@name_en,
           desc_es=@desc_es, desc_en=@desc_en,
           category=@category, scope=@scope,
           price_eur=@price_eur, price_ne=@price_ne, price_ne_fake=@price_ne_fake,
           featured=@featured, icon=@icon, is_special=@is_special, show_item=@show_item,
           metadata_json=@metadata_json, updated_at=@updated_at
     WHERE id=@id
  `).run({
        id: data.id,
        slug: data.slug,
        name_es: data.name.es,
        name_en: data.name.en,
        desc_es: data.description?.es ?? null,
        desc_en: data.description?.en ?? null,
        category: data.category,
        scope: data.scope,
        price_eur: data.price.eur ?? null,
        price_ne: data.price.ne ?? null,
        price_ne_fake: data.price.neFake ?? null,
        featured: boolToInt(!!data.featured),
        icon: data.icon ?? null,
        is_special: boolToInt(!!data.isSpecial),
        show_item: boolToInt(!!data.showItem),
        metadata_json: data.metadata ? JSON.stringify(data.metadata) : null,
        updated_at: data.updatedAt,
    });

    return dbGetDonationItem(id)!;
}

export function dbRemoveDonationItem(id: string): void {
    const trx = db.transaction((donId: string) => {
        db.prepare(`DELETE FROM donations WHERE id=?`).run(donId);
        pruneDonationFromPacks(donId);
    });

    trx(id);
}

export function dbListPacks(): Pack[] {
    const rows = db.prepare(`
    SELECT * FROM packs
    ORDER BY featured DESC, created_at DESC
  `).all() as any[];
    return rows.map(rowToPack);
}

export function dbGetPack(id: string): Pack | undefined {
    const r = db.prepare(`SELECT * FROM packs WHERE id=?`).get(id) as any;
    return r ? rowToPack(r) : undefined;
}

export function dbCreatePack(input: Omit<Pack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Pack {
    const id = input.id ?? ('pk_' + Math.random().toString(36).slice(2, 8));
    const now = nowIso();

    db.prepare(`
    INSERT INTO packs (
      id, slug, name_es, name_en, desc_es, desc_en,
      price_eur, price_ne, price_ne_fake,
      featured, icon,
      items_json, metadata_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id, input.slug, input.name.es, input.name.en,
        input.description?.es ?? null, input.description?.en ?? null,
        input.price?.eur ?? null, input.price?.ne ?? null, input.price?.neFake ?? null,
        input.featured ? 1 : 0, input.icon ?? null,
        JSON.stringify(input.items ?? []), null,
        now, now
    );

    return dbGetPack(id)!;
}

export function dbUpdatePack(id: string, input: Partial<Omit<Pack, 'id' | 'createdAt' | 'updatedAt'>>): Pack {
    const cur = dbGetPack(id);
    if (!cur) throw new Error('Not found');

    const merged: Pack = {
        ...cur,
        ...input,
        id,
        name: { es: input.name?.es ?? cur.name.es, en: input.name?.en ?? cur.name.en },
        description: input.description
            ? { es: input.description.es ?? cur.description?.es ?? '', en: input.description.en ?? cur.description?.en ?? '' }
            : cur.description,
        price: {
            eur: input.price?.eur ?? cur.price.eur,
            ne: input.price?.ne ?? cur.price.ne,
            neFake: input.price?.neFake ?? cur.price.neFake,
        },
        items: input.items ?? cur.items,
        updatedAt: nowIso(),
    };

    db.prepare(`
    UPDATE packs SET
      slug=@slug, name_es=@name_es, name_en=@name_en,
      desc_es=@desc_es, desc_en=@desc_en,
      price_eur=@price_eur, price_ne=@price_ne, price_ne_fake=@price_ne_fake,
      featured=@featured, icon=@icon,
      items_json=@items_json, metadata_json=@metadata_json, updated_at=@updated_at
    WHERE id=@id
  `).run({
        id: merged.id,
        slug: merged.slug,
        name_es: merged.name.es,
        name_en: merged.name.en,
        desc_es: merged.description?.es ?? null,
        desc_en: merged.description?.en ?? null,
        price_eur: merged.price.eur ?? null,
        price_ne: merged.price.ne ?? null,
        price_ne_fake: merged.price.neFake ?? null,
        featured: merged.featured ? 1 : 0,
        icon: merged.icon ?? null,
        items_json: JSON.stringify(merged.items ?? []),
        metadata_json: null,
        updated_at: merged.updatedAt,
    });

    return dbGetPack(id)!;
}

export function dbRemovePack(id: string): void {
    db.prepare(`DELETE FROM packs WHERE id=?`).run(id);
}

export function dbListNews(): New[] {
    const nowIso = new Date().toISOString();
    const rows = db.prepare(`
    SELECT *
      FROM news
     WHERE published_at IS NOT NULL
       AND datetime(published_at) <= datetime(?)
     ORDER BY datetime(published_at) DESC, created_at DESC
  `).all(nowIso) as any[];
    return rows.map(rowToNew);
}

export function dbListAllNews(): New[] {
    const rows = db.prepare(`
    SELECT *
      FROM news
     ORDER BY
       CASE WHEN published_at IS NULL THEN 1 ELSE 0 END ASC,  -- primero programadas/publicadas
       datetime(COALESCE(published_at, created_at)) DESC,
       created_at DESC
  `).all() as any[];
    return rows.map(rowToNew);
}

export function dbGetNew(id: string): New | undefined {
    const r = db.prepare(`SELECT * FROM news WHERE id=?`).get(id) as any;
    return r ? rowToNew(r) : undefined;
}

export function dbGetNewBySlug(slug: string): New | undefined {
    const r = db.prepare(`SELECT * FROM news WHERE slug=?`).get(slug) as any;
    return r ? rowToNew(r) : undefined;
}

export function dbCreateNew(input: Omit<New, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): New {
    const id = input.id ?? ('nw_' + Math.random().toString(36).slice(2, 8));
    const now = nowIso();

    const candidate: New = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
    };
    const data = newSchema.parse(candidate);

    db.prepare(`
    INSERT INTO news (
      id, slug, title_es, title_en, excerpt_es, excerpt_en,
      body_es, body_en, cover, tags_json, published_at,
      featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        data.id,
        data.slug,
        data.title.es, data.title.en,
        data.excerpt?.es ?? null, data.excerpt?.en ?? null,
        data.body.es, data.body.en,
        data.cover ?? null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.publishedAt ?? null,
        data.featured ? 1 : 0,
        data.createdAt,
        data.updatedAt,
    );

    return dbGetNew(id)!;
}

export function dbUpdateNew(id: string, input: Partial<Omit<New, 'id' | 'createdAt' | 'updatedAt'>>): New {
    const cur = dbGetNew(id);
    if (!cur) throw new Error('Not found');

    const merged: New = {
        ...cur,
        ...input,
        id,
        title: { es: input.title?.es ?? cur.title.es, en: input.title?.en ?? cur.title.en },
        excerpt: input.excerpt
            ? { es: input.excerpt.es ?? cur.excerpt?.es ?? '', en: input.excerpt.en ?? cur.excerpt?.en ?? '' }
            : cur.excerpt,
        body: {
            es: input.body?.es ?? cur.body.es,
            en: input.body?.en ?? cur.body.en,
        },
        tags: input.tags ?? cur.tags,
        cover: input.cover ?? cur.cover,
        featured: input.featured ?? cur.featured,
        publishedAt: input.publishedAt ?? cur.publishedAt,
        updatedAt: nowIso(),
    };

    const data = newSchema.parse(merged);

    db.prepare(`
    UPDATE news SET
      slug=@slug,
      title_es=@title_es, title_en=@title_en,
      excerpt_es=@excerpt_es, excerpt_en=@excerpt_en,
      body_es=@body_es, body_en=@body_en,
      cover=@cover, tags_json=@tags_json,
      published_at=@published_at,
      featured=@featured,
      updated_at=@updated_at
    WHERE id=@id
  `).run({
        id: data.id,
        slug: data.slug,
        title_es: data.title.es,
        title_en: data.title.en,
        excerpt_es: data.excerpt?.es ?? null,
        excerpt_en: data.excerpt?.en ?? null,
        body_es: data.body.es,
        body_en: data.body.en,
        cover: data.cover ?? null,
        tags_json: data.tags ? JSON.stringify(data.tags) : null,
        published_at: data.publishedAt ?? null,
        featured: data.featured ? 1 : 0,
        updated_at: data.updatedAt,
    });

    return dbGetNew(id)!;
}

export function dbRemoveNew(id: string): void {
    db.prepare(`DELETE FROM news WHERE id=?`).run(id);
}

export function dbListRules(): Rule[] {
    const rows = db.prepare(`
    SELECT * FROM rules
     WHERE active = 1
     ORDER BY sort ASC, created_at DESC
  `).all() as any[];
    return rows.map(rowToRule);
}

export function dbGetRuleBySlug(slug: string): Rule | undefined {
    const r = db.prepare(`SELECT * FROM rules WHERE slug=? AND active=1`).get(slug) as any;
    return r ? rowToRule(r) : undefined;
}

export function dbListAllRules(): Rule[] {
    const rows = db.prepare(`SELECT * FROM rules ORDER BY sort ASC, created_at DESC`).all() as any[];
    return rows.map(rowToRule);
}

export function dbGetRule(id: string): Rule | undefined {
    const r = db.prepare(`SELECT * FROM rules WHERE id=?`).get(id) as any;
    return r ? rowToRule(r) : undefined;
}

export function dbCreateRule(input: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Rule {
    const id = input.id ?? ('rl_' + Math.random().toString(36).slice(2, 8));
    const now = nowIso();

    db.prepare(`
    INSERT INTO rules (
      id, slug, title_es, title_en, body_es, body_en,
      category, tags_json, sort, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        input.slug,
        input.title.es, input.title.en,
        input.body.es, input.body.en,
        input.category ?? null,
        input.tags ? JSON.stringify(input.tags) : null,
        input.sort ?? 0,
        boolToInt(!!input.active),
        now, now
    );

    return dbGetRule(id)!;
}

export function dbUpdateRule(id: string, patch: Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>): Rule {
    const cur = dbGetRule(id);
    if (!cur) throw new Error('Not found');

    const merged: Rule = {
        ...cur,
        ...patch,
        id,
        title: { es: patch.title?.es ?? cur.title.es, en: patch.title?.en ?? cur.title.en },
        body: { es: patch.body?.es ?? cur.body.es, en: patch.body?.en ?? cur.body.en },
        tags: patch.tags ?? cur.tags ?? [],
        sort: patch.sort ?? cur.sort,
        active: patch.active ?? cur.active,
        updatedAt: nowIso(),
    };

    db.prepare(`
    UPDATE rules SET
      slug=@slug, title_es=@title_es, title_en=@title_en,
      body_es=@body_es, body_en=@body_en,
      category=@category, tags_json=@tags_json,
      sort=@sort, active=@active, updated_at=@updated_at
    WHERE id=@id
  `).run({
        id: merged.id,
        slug: merged.slug,
        title_es: merged.title.es,
        title_en: merged.title.en,
        body_es: merged.body.es,
        body_en: merged.body.en,
        category: merged.category ?? null,
        tags_json: merged.tags ? JSON.stringify(merged.tags) : null,
        sort: merged.sort ?? 0,
        active: boolToInt(!!merged.active),
        updated_at: merged.updatedAt,
    });

    return dbGetRule(id)!;
}

export function dbRemoveRule(id: string): void {
    db.prepare(`DELETE FROM rules WHERE id=?`).run(id);
}

export function dbListAboutAll(): AboutEntry[] {
    const rows = db.prepare(`
    SELECT * FROM about
    ORDER BY sort ASC, created_at DESC
  `).all() as any[];
    return rows.map(rowToAbout);
}

export function dbListAboutPublic(): AboutEntry[] {
    const rows = db.prepare(`
    SELECT * FROM about
    WHERE active = 1
    ORDER BY sort ASC, created_at DESC
  `).all() as any[];
    return rows.map(rowToAbout);
}

export function dbGetAbout(id: string): AboutEntry | undefined {
    const r = db.prepare(`SELECT * FROM about WHERE id=?`).get(id) as any;
    return r ? rowToAbout(r) : undefined;
}

export function dbCreateAbout(input: Omit<AboutEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AboutEntry {
    const id = input.id ?? ('ab_' + Math.random().toString(36).slice(2, 8));
    const now = nowIso();

    db.prepare(`
    INSERT INTO about (
      id, slug, title_es, title_en, role, avatar,
      body_es_md, body_en_md, tags_json, sort, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        input.slug,
        input.title.es, input.title.en,
        input.role ?? null,
        input.avatar ?? null,
        input.body.es, input.body.en,
        (input.tags && input.tags.length) ? JSON.stringify(input.tags) : null,
        input.sort ?? 0,
        boolToInt(!!input.active),
        now, now
    );

    return dbGetAbout(id)!;
}

export function dbUpdateAbout(id: string, patch: Partial<Omit<AboutEntry, 'id' | 'createdAt' | 'updatedAt'>>): AboutEntry {
    const cur = dbGetAbout(id);
    if (!cur) throw new Error('Not found');

    const merged: AboutEntry = {
        ...cur,
        ...patch,
        id,
        title: {
            es: patch.title?.es ?? cur.title.es,
            en: patch.title?.en ?? cur.title.en,
        },
        body: {
            es: patch.body?.es ?? cur.body.es,
            en: patch.body?.en ?? cur.body.en,
        },
        role: patch.role ?? cur.role ?? null,
        avatar: patch.avatar ?? cur.avatar ?? null,
        tags: patch.tags ?? cur.tags ?? [],
        sort: Number.isFinite(patch.sort as number) ? Number(patch.sort) : cur.sort,
        active: typeof patch.active === 'boolean' ? patch.active : cur.active,
        updatedAt: nowIso(),
    };

    db.prepare(`
    UPDATE about SET
      slug=@slug,
      title_es=@title_es, title_en=@title_en,
      role=@role, avatar=@avatar,
      body_es_md=@body_es_md, body_en_md=@body_en_md,
      tags_json=@tags_json,
      sort=@sort, active=@active,
      updated_at=@updated_at
    WHERE id=@id
  `).run({
        id: merged.id,
        slug: merged.slug,
        title_es: merged.title.es,
        title_en: merged.title.en,
        role: merged.role ?? null,
        avatar: merged.avatar ?? null,
        body_es_md: merged.body.es,
        body_en_md: merged.body.en,
        tags_json: (merged.tags && merged.tags.length) ? JSON.stringify(merged.tags) : null,
        sort: merged.sort,
        active: boolToInt(!!merged.active),
        updated_at: merged.updatedAt,
    });

    return dbGetAbout(id)!;
}

export function dbRemoveAbout(id: string): void {
    db.prepare(`DELETE FROM about WHERE id=?`).run(id);
}

function pruneDonationFromPacks(donationId: string): number {
    const candidates = db.prepare(`
    SELECT id, items_json FROM packs
    WHERE items_json LIKE ?
  `).all(`%${donationId}%`) as Array<{ id: string; items_json: string }>;

    let updated = 0;

    const upd = db.prepare(`
    UPDATE packs
       SET items_json = ?, updated_at = ?
     WHERE id = ?
  `);

    const now = nowIso();

    for (const row of candidates) {
        let items: PackItem[] = [];
        try { items = JSON.parse(row.items_json) as PackItem[]; } catch { items = []; }

        const next = items.filter(it => it?.donationId !== donationId);

        if (next.length !== items.length) {
            upd.run(JSON.stringify(next), now, row.id);
            updated++;
        }
    }

    return updated;
}