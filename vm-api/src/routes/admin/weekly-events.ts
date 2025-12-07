import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListAllWeekly,
    dbGetWeekly,
    dbCreateWeekly,
    dbUpdateWeekly,
    dbRemoveWeekly,
} from '../../db/sqlite';
import { weeklyEventSchema } from '../../lib/schemas';

export const adminWeeklyEventsRouter = Router();

adminWeeklyEventsRouter.use(requireInternalKey);

const weeklyEventCreateSchema = weeklyEventSchema.omit({
    id: true,
});

const weeklyEventUpdateSchema = weeklyEventCreateSchema.partial();

adminWeeklyEventsRouter.get('/', (_req, res) => {
    try {
        const items = dbListAllWeekly();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWeeklyEventsRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = dbGetWeekly(id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWeeklyEventsRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = weeklyEventCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateWeekly(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWeeklyEventsRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = weeklyEventUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const existing = dbGetWeekly(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        const candidate = weeklyEventSchema.parse({
            ...existing,
            ...patch,
            id,
            name: {
                es: patch.name?.es ?? existing.name.es,
                en: patch.name?.en ?? existing.name.en,
            },
            description: patch.description
                ? {
                    es: patch.description.es ?? existing.description?.es ?? '',
                    en: patch.description.en ?? existing.description?.en ?? '',
                }
                : existing.description,
        });

        const updated = dbUpdateWeekly(id, candidate);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWeeklyEventsRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetWeekly(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveWeekly(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
