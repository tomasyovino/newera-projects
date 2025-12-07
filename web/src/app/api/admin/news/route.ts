import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/app/api/_utils/adminAuth';
import { newListSchema } from '@/lib/schemas';
import { newCreateSchema } from '../../_utils/newSchemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET(req: NextRequest) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    try {
        const res = await fetchFromVM(`/admin/news`);

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = newListSchema.parse(raw);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    let input: unknown;

    try {
        const payload = await req.json();
        input = newCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ? err.issues : err?.message;
        return NextResponse.json({ error: msg ?? 'Invalid payload' }, { status: 400 });
    }

    try {
        const res = await fetchFromVM(`/admin/news`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? 'Upstream error' },
            { status: 502 },
        );
    }
}
