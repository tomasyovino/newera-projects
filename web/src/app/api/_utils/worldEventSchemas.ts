import { worldEventSchema } from '@/lib/schemas';

export const worldEventsCreateSchema = worldEventSchema.omit({
    id: true
});

export const worldEventsUpdateSchema = worldEventSchema.partial().omit({
  id: true
});