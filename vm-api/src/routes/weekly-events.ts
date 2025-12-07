import { Router } from 'express';
import { dbListWeekly, dbGetWeekly } from '../db/sqlite';
import { weeklyEventListSchema, weeklyEventSchema } from '../lib/schemas';

export const weeklyEventsRouter = Router();

weeklyEventsRouter.get('/', (_req, res) => {
    try {
        const items = dbListWeekly();
        const data = weeklyEventListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

weeklyEventsRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetWeekly(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = weeklyEventSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
