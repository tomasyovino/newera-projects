import { Router } from 'express';
import { dbListAboutPublic, dbGetAbout } from '../db/sqlite';
import { aboutListSchema, aboutSchema } from '../lib/schemas';

export const aboutRouter = Router();

aboutRouter.get('/', (_req, res) => {
    try {
        const items = dbListAboutPublic();
        const data = aboutListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

aboutRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetAbout(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = aboutSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
