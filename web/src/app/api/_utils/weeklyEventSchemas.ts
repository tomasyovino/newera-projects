import { weeklyEventSchema } from '@/lib/schemas';

export const weeklyEventsCreateSchema = weeklyEventSchema.omit({
    id: true
});

export const weeklyEventsUpdateSchema = weeklyEventSchema.partial().omit({
  id: true
});