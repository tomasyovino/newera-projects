import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/app/api/_utils/adminAuth';
import { aboutSchema } from '@/lib/schemas';
import { aboutUpdateSchema } from '@/app/api/_utils/aboutSchemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    try {
        const res = await fetchFromVM(`/admin/about/${encodeURIComponent(params.id)}`);

        if (res.status === 404) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = aboutSchema.parse(raw);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    let patch: unknown;

    try {
        const payload = await req.json();
        patch = aboutUpdateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ? err.issues : err?.message;
        return NextResponse.json({ error: msg ?? 'Invalid payload' }, { status: 400 });
    }

    try {
        const res = await fetchFromVM(
            `/admin/about/${encodeURIComponent(params.id)}`,
            {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(patch),
            },
        );

        if (res.status === 404) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? 'Upstream error' },
            { status: 502 },
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    try {
        const res = await fetchFromVM(
            `/admin/about/${encodeURIComponent(params.id)}`,
            {
                method: 'DELETE',
            },
        );

        if (res.status === 404) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }


        const data = await res.json().catch(() => ({ ok: true }));
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
