import { Router } from 'express';
import { dbListDonationsAll, dbGetDonationItem } from '../db/sqlite';
import { donationListSchema, donationSchema } from '../lib/schemas';

export const donationsRouter = Router();

donationsRouter.get('/', (_req, res) => {
    try {
        const items = dbListDonationsAll();
        const data = donationListSchema.parse(items);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

donationsRouter.get('/:id', (req, res) => {
    try {
        const item = dbGetDonationItem(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        const data = donationSchema.parse(item);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
