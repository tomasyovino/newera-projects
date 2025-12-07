import { NextResponse } from 'next/server';
import { packListSchema } from '@/lib/schemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET() {
    try {
        const res = await fetchFromVM(`/packs`);

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = packListSchema.parse(raw);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
