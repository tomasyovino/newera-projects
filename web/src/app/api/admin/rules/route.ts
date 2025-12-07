import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/app/api/_utils/adminAuth';
import { ruleListSchema } from '@/lib/schemas';
import { ruleCreateSchema } from '@/app/api/_utils/ruleSchemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

const VM_API_BASE = process.env.VM_API_BASE_URL!;
const INTERNAL_KEY = process.env.VM_INTERNAL_API_KEY!;

export async function GET(req: NextRequest) {
    const guard = requireAdminAuth(req);
    if (guard) return guard;

    try {
        const res = await fetchFromVM(`/admin/rules`);

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = ruleListSchema.parse(raw);
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
        input = ruleCreateSchema.parse(payload);
    } catch (err: any) {
        const msg = err?.issues ?? err?.message;
        return NextResponse.json({ error: msg ?? 'Invalid payload' }, { status: 400 });
    }

    try {
        const res = await fetchFromVM(`/admin/rules`, {
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
