import { Router } from 'express';
import { dbListPacks, dbGetPack } from '../db/sqlite';
import { packListSchema, packSchema } from '../lib/schemas';

export const packsRouter = Router();

packsRouter.get('/', (_req, res) => {
    try {
        const items = dbListPacks();
        const data = packListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

packsRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetPack(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = packSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
