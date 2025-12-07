import fs from 'node:fs';
import path from 'node:path';
import { AboutEntry, Donation, New, Pack, Rule } from "../lib/types";
import { intToBool, ls, parseJson, parseJsonArray } from "../utils/dbUtils";
import { aboutSchema } from '../lib/schemas';

export function rowToDonation(r: any): Donation {
  return {
    id: r.id,
    slug: r.slug,
    name: ls(r.name_es, r.name_en),
    description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
    category: r.category,
    scope: r.scope,
    price: {
      eur: r.price_eur ?? undefined,
      ne: r.price_ne ?? undefined,
      neFake: r.price_ne_fake ?? undefined,
    },
    featured: intToBool(r.featured),
    icon: r.icon ?? undefined,
    isSpecial: intToBool(r.is_special),
    showItem: intToBool(r.show_item),
    metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function rowToPack(r: any): Pack {
  return {
    id: r.id,
    slug: r.slug,
    name: ls(r.name_es, r.name_en),
    description: (r.desc_es || r.desc_en) ? ls(r.desc_es, r.desc_en) : undefined,
    items: parseJson<{ donationId: string; qty?: number }[]>(r.items_json, []),
    price: { eur: r.price_eur ?? undefined, ne: r.price_ne ?? undefined, neFake: r.price_ne_fake ?? undefined },
    featured: intToBool(r.featured),
    icon: r.icon ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function rowToNew(r: any): New {
  return {
    id: r.id,
    slug: r.slug,
    title: ls(r.title_es, r.title_en),
    excerpt: (r.excerpt_es || r.excerpt_en) ? ls(r.excerpt_es, r.excerpt_en) : undefined,
    body: ls(r.body_es, r.body_en),
    cover: r.cover ?? undefined,
    tags: r.tags_json ? JSON.parse(r.tags_json) as string[] : undefined,
    publishedAt: r.published_at ?? null,
    featured: intToBool(r.featured),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function rowToRule(r: any): Rule {
  return {
    id: r.id,
    slug: r.slug,
    title: { es: r.title_es, en: r.title_en },
    body: { es: r.body_es, en: r.body_en },
    category: r.category ?? null,
    tags: r.tags_json ? JSON.parse(r.tags_json) : [],
    sort: r.sort ?? 0,
    active: !!r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function rowToAbout(r: any): AboutEntry {
  return aboutSchema.parse({
    id: r.id,
    slug: r.slug,
    title: { es: r.title_es, en: r.title_en },
    role: r.role ?? null,
    avatar: r.avatar ?? null,
    body: { es: r.body_es_md, en: r.body_en_md },
    tags: parseJsonArray<string[]>(r.tags_json, []),
    sort: Number(r.sort ?? 0),
    active: intToBool(r.active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });
}

export function readMock<T = unknown>(file: string): T {
  const candidates = [
    path.join(process.cwd(), 'src', 'mocks', file),
    path.join(process.cwd(), 'mocks', file),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
  }
  throw new Error(`Mock not found: ${file} (checked: ${candidates.join(', ')})`);
}

export function boolEnv(name: string, def = true) {
  const v = process.env[name];
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}
