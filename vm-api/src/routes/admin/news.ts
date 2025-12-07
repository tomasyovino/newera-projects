import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListAllNews,
    dbCreateNew,
    dbGetNew,
    dbUpdateNew,
    dbRemoveNew,
} from '../../db/sqlite';
import { newSchema } from '../../lib/schemas';

export const adminNewsRouter = Router();

adminNewsRouter.use(requireInternalKey);

const newCreateSchema = newSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const newUpdateSchema = newCreateSchema.partial();

adminNewsRouter.get('/', (_req, res) => {
    try {
        const items = dbListAllNews();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminNewsRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = newCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateNew(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminNewsRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = newUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const updated = dbUpdateNew(id, patch);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminNewsRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetNew(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveNew(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
