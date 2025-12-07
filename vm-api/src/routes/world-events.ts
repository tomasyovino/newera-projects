import { Router } from 'express';
import { dbListWorld, dbGetWorld } from '../db/sqlite';
import { worldEventListSchema, worldEventSchema } from '../lib/schemas';

export const worldEventsRouter = Router();

worldEventsRouter.get('/', (_req, res) => {
    try {
        const items = dbListWorld();
        const data = worldEventListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

worldEventsRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetWorld(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = worldEventSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
