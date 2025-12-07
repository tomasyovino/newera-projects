import { aboutSchema } from '@/lib/schemas';

export const aboutCreateSchema = aboutSchema.omit({
    id: true, createdAt: true, updatedAt: true,
});

export const aboutUpdateSchema = aboutSchema.partial().omit({
    id: true, createdAt: true, updatedAt: true,
});
