import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/app/api/_utils/adminAuth';
import { aboutListSchema } from '@/lib/schemas';
import { aboutCreateSchema } from '@/app/api/_utils/aboutSchemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET(req: NextRequest) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    try {
        const res = await fetchFromVM(`/admin/about`);

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = aboutListSchema.parse(raw);
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
        input = aboutCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ? err.issues : err?.message;
        return NextResponse.json({ error: msg ?? 'Invalid payload' }, { status: 400 });
    }

    try {
        const res = await fetchFromVM(`/admin/about`, {
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
