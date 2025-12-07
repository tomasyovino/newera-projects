import { Router } from 'express';
import { dbListNews, dbGetNew } from '../db/sqlite';
import { newListSchema, newSchema } from '../lib/schemas';

export const newsRouter = Router();

newsRouter.get('/', (_req, res) => {
    try {
        const items = dbListNews();
        const data = newListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

newsRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetNew(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = newSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
