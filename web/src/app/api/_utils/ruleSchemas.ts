import { ruleSchema } from '@/lib/schemas';
import { z } from 'zod';

export const ruleCreateSchema = ruleSchema.omit({
    id: true, createdAt: true, updatedAt: true,
});

export const ruleUpdateSchema = ruleSchema.partial().omit({
    id: true, createdAt: true, updatedAt: true,
});

export const ruleCreateMinimalSchema = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9\-]+$/i),
    title: z.object({ es: z.string().min(1), en: z.string().min(1) }),
    body: z.object({ es: z.string().min(1), en: z.string().min(1) }),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    sort: z.number().int().default(0),
    active: z.boolean().default(true),
});
