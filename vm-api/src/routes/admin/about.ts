import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListAboutAll,
    dbCreateAbout,
    dbGetAbout,
    dbUpdateAbout,
    dbRemoveAbout,
} from '../../db/sqlite';
import { aboutSchema } from '../../lib/schemas';

export const adminAboutRouter = Router();

adminAboutRouter.use(requireInternalKey);

const aboutCreateSchema = aboutSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const aboutUpdateSchema = aboutCreateSchema.partial();

adminAboutRouter.get('/', (_req, res) => {
    try {
        const items = dbListAboutAll();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminAboutRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = aboutCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateAbout(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminAboutRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = aboutUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const updated = dbUpdateAbout(id, patch);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminAboutRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetAbout(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveAbout(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
