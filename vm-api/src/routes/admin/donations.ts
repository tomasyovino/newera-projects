import { Router } from 'express';
import { requireInternalKey } from '../../middleware/internalAuth';
import {
    dbListDonationsAll,
    dbCreateDonationItem,
    dbGetDonationItem,
    dbUpdateDonationItem,
    dbRemoveDonationItem,
} from '../../db/sqlite';
import { donationSchema } from '../../lib/schemas';

export const adminDonationsRouter = Router();

adminDonationsRouter.use(requireInternalKey);

const donationCreateSchema = donationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const donationUpdateSchema = donationCreateSchema.partial();

adminDonationsRouter.get('/', (_req, res) => {
    try {
        const items = dbListDonationsAll();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminDonationsRouter.post('/', (req, res) => {
    let input: any;

    try {
        const payload = req.body;
        input = donationCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const created = dbCreateDonationItem(input);
        return res.status(201).json(created);
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminDonationsRouter.put('/:id', (req, res) => {
    const { id } = req.params;
    let patch: any;

    try {
        const payload = req.body;
        patch = donationUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return res.status(400).json({ error: msg ?? 'Invalid payload' });
    }

    try {
        const updated = dbUpdateDonationItem(id, patch);
        return res.json(updated);
    } catch (err: any) {
        if (err?.message === 'Not found') {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});

adminDonationsRouter.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const existing = dbGetDonationItem(id);
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        dbRemoveDonationItem(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? 'Internal error' });
    }
});
