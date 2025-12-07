import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListAllWorld,
    dbGetWorld,
    dbCreateWorld,
    dbUpdateWorld,
    dbRemoveWorld,
} from '../../db/sqlite';
import { worldEventSchema } from '../../lib/schemas';

export const adminWorldEventsRouter = Router();

adminWorldEventsRouter.use(requireInternalKey);

const worldEventCreateSchema = worldEventSchema.omit({
    id: true,
});

const worldEventUpdateSchema = worldEventCreateSchema.partial();

adminWorldEventsRouter.get('/', (_req, res) => {
    try {
        const items = dbListAllWorld();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWorldEventsRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = dbGetWorld(id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWorldEventsRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = worldEventCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateWorld(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWorldEventsRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = worldEventUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const existing = dbGetWorld(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        const candidate = worldEventSchema.parse({
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
            headline: patch.headline
                ? {
                    es: patch.headline.es ?? existing.headline?.es ?? '',
                    en: patch.headline.en ?? existing.headline?.en ?? '',
                }
                : existing.headline,
            location: patch.location
                ? {
                    es: patch.location.es ?? existing.location?.es ?? '',
                    en: patch.location.en ?? existing.location?.en ?? '',
                }
                : existing.location,
            highlights: patch.highlights ?? existing.highlights,
            rewards: patch.rewards ?? existing.rewards,
            warnings: patch.warnings ?? existing.warnings,
            sphereStartCmd: patch.sphereStartCmd ?? existing.sphereStartCmd,
            sphereEndCmd: patch.sphereEndCmd ?? existing.sphereEndCmd,
        });

        const updated = dbUpdateWorld(id, candidate);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminWorldEventsRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetWorld(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveWorld(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
