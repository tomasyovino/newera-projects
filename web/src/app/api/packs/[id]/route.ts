import { NextResponse } from 'next/server';
import { packSchema } from '@/lib/schemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const res = await fetchFromVM(`/packs/${encodeURIComponent(params.id)}`);

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
        const data = packSchema.parse(raw);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
