import { packSchema } from '@/lib/schemas';

export const packCreateSchema = packSchema.omit({
    id: true, createdAt: true, updatedAt: true
});

export const packUpdateSchema = packSchema.partial().omit({
  id: true, createdAt: true, updatedAt: true
});