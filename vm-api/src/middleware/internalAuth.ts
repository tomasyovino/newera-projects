import type { Request, Response, NextFunction } from 'express';

const INTERNAL_KEY = process.env.INTERNAL_API_KEY!;

if (!INTERNAL_KEY) {
    throw new Error('INTERNAL_API_KEY not set');
}

export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
    const key = req.header('x-internal-key');
    if (!key || key !== INTERNAL_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
