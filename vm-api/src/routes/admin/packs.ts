import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListPacks,
    dbGetPack,
    dbCreatePack,
    dbUpdatePack,
    dbRemovePack,
} from '../../db/sqlite';
import { packSchema } from '../../lib/schemas';

export const adminPacksRouter = Router();

adminPacksRouter.use(requireInternalKey);

const packCreateSchema = packSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const packUpdateSchema = packCreateSchema.partial();

adminPacksRouter.get('/', (_req, res) => {
    try {
        const items = dbListPacks();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminPacksRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = dbGetPack(id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminPacksRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = packCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreatePack(input);
        return res.status(201).json(created);
    } catch (err: any) {
        // errores de unique slug, etc.
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminPacksRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = packUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const updated = dbUpdatePack(id, patch);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminPacksRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetPack(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemovePack(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
