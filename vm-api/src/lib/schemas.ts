import { z } from 'zod';

export const localizedStringSchema = z.object({
  es: z.string(),
  en: z.string(),
});

const hhmm = /^\d{2}:\d{2}$/;

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid ISO datetime' });

const urlOrRootRelative = z.string().refine((v) => {
  return /^https?:\/\//i.test(v) || v.startsWith('/');
}, { message: 'Invalid URL' });

const iconSchema = z.string().regex(/^(https?:\/\/|\/)/, {
  message: 'Icon must be an absolute URL or a /local/path',
});

export const weeklyEventSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  times: z.array(z.string().regex(hhmm)).min(1),
  durationMinutes: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  icon: z.string().optional(),
  sphereCmd: z.string().trim().optional(),
});

export const worldEventSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  startsAt: isoDate,
  endsAt: isoDate,
  banner: urlOrRootRelative.optional(),
  location: localizedStringSchema.optional(),
  featured: z.boolean().optional(),
  headline: localizedStringSchema.optional(),
  highlights: z.array(localizedStringSchema).optional(),
  rewards: z.array(localizedStringSchema).optional(),
  warnings: z.array(localizedStringSchema).optional(),
  sphereStartCmd: z.string().trim().optional(),
  sphereEndCmd: z.string().trim().optional(),
}).superRefine((val, ctx) => {
  if (Date.parse(val.endsAt) <= Date.parse(val.startsAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '`endsAt` must be after `startsAt`', path: ['endsAt'] });
  }
});

export const donationScopeSchema = z.enum(['personal', 'clan', 'both']);
export const donationCategorySchema = z.enum([
  'item',
  'mount',
  'stat_boost',
  'land_mine',
  'land_house',
  'currency_ne',
  'currency_ne_fake',
]);
export const donationPriceSchema = z.object({
  eur: z.number().nonnegative().optional(),
  ne: z.number().nonnegative().optional(),
  neFake: z.number().nonnegative().optional(),
});
export const donationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  category: donationCategorySchema,
  isSpecial: z.boolean().default(false),
  showItem: z.boolean().default(true),
  scope: donationScopeSchema,
  price: donationPriceSchema,
  featured: z.boolean().optional(),
  icon: z.string().url().or(z.string().startsWith('/')).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export const packItemSchema = z.object({
  donationId: z.string().min(1),
  qty: z.number().int().positive().optional(),
  metadataOverride: z.record(z.string(), z.unknown()).optional(),
});

export const packSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  items: z.array(packItemSchema).min(1),
  price: donationPriceSchema,
  featured: z.boolean().optional(),
  icon: z.string().url().or(z.string().startsWith('/')).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const newSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: localizedStringSchema,
  excerpt: localizedStringSchema.optional(),
  body: localizedStringSchema,
  cover: z.string().url().or(z.string().startsWith('/')).optional(),
  tags: z.array(z.string().min(1)).optional(),
  publishedAt: isoDate.nullable().optional(),
  featured: z.boolean().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const ruleSchema = z.object({
  id: z.string(),
  slug: z.string().min(1).regex(/^[a-z0-9\-]+$/i, 'Slug inválido'),
  title: z.object({
    es: z.string().min(1),
    en: z.string().min(1),
  }),
  body: z.object({
    es: z.string().min(1),
    en: z.string().min(1),
  }),
  category: z.string().min(1).optional().nullable(),
  tags: z.array(z.string()).optional(),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const aboutSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  title: localizedStringSchema,
  role: z.string().trim().min(1).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  body: localizedStringSchema,
  tags: z.array(z.string().trim().min(1)).optional(),
  sort: z.number().int(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const weeklyEventListSchema = z.array(weeklyEventSchema);
export const worldEventListSchema = z.array(worldEventSchema);
export const donationListSchema = z.array(donationSchema);
export const packListSchema = z.array(packSchema);
export const newListSchema = z.array(newSchema);
export const ruleListSchema = z.array(ruleSchema);
export const aboutListSchema = z.array(aboutSchema);
export type DonationInput = z.input<typeof donationSchema>;