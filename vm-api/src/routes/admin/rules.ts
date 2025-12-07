import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListAllRules,
    dbGetRule,
    dbCreateRule,
    dbUpdateRule,
    dbRemoveRule,
} from '../../db/sqlite';
import { ruleSchema } from '../../lib/schemas';

export const adminRulesRouter = Router();

adminRulesRouter.use(requireInternalKey);

const ruleCreateSchema = ruleSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const ruleUpdateSchema = ruleCreateSchema.partial();

adminRulesRouter.get('/', (_req, res) => {
    try {
        const items = dbListAllRules();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminRulesRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = dbGetRule(id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminRulesRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = ruleCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateRule(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminRulesRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = ruleUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const updated = dbUpdateRule(id, patch);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminRulesRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetRule(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveRule(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
