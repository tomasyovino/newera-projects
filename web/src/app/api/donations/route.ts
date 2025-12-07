import { NextResponse } from 'next/server';
import { donationListSchema } from '@/lib/schemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET() {
    try {
        const res = await fetchFromVM(`/donations`);

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        const data = donationListSchema.parse(raw);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
