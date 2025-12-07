import { Router } from 'express';
import { dbListRules, dbGetRuleBySlug } from '../db/sqlite';
import { ruleListSchema, ruleSchema } from '../lib/schemas';

export const rulesRouter = Router();

rulesRouter.get('/', (_req, res) => {
    try {
        const items = dbListRules();
        const data = ruleListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

rulesRouter.get('/:slug', (req, res) => {
    try {
        const item = dbGetRuleBySlug(req.params.slug);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = ruleSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
