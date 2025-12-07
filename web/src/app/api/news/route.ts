import { NextResponse, NextRequest } from 'next/server';
import { newListSchema } from '@/lib/schemas';
import { fetchFromVM } from '@/helpers/fetchHelpers';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const publishedParam = searchParams.get('published');
        const onlyPublished = ['1', 'true', 'yes'].includes((publishedParam ?? '').toLowerCase());
        const slug = (searchParams.get('slug') ?? '').trim().toLowerCase();
        const q = (searchParams.get('q') ?? '').trim().toLowerCase();

        const withMeta = ['1', 'true', 'yes'].includes((searchParams.get('withMeta') ?? '').toLowerCase());
        const limitParam = Number(searchParams.get('limit') ?? '');
        const pageParam = Number(searchParams.get('page') ?? '');
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : undefined;
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

        const res = await fetchFromVM(`/news`);
        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error (${res.status})` },
                { status: 502 },
            );
        }

        const raw = await res.json();
        let items = newListSchema.parse(raw);

        const now = Date.now();
        if (onlyPublished) {
            items = items.filter((n) => n.publishedAt && now >= Date.parse(n.publishedAt));
        }
        if (slug) {
            items = items.filter((n) => n.slug.toLowerCase() === slug);
        }
        if (q) {
            items = items.filter((n) => {
                const hay = [
                    n.slug,
                    n.title.es, n.title.en,
                    n.excerpt?.es ?? '', n.excerpt?.en ?? '',
                    n.body.es, n.body.en,
                    (n.tags ?? []).join(' '),
                ].join(' ').toLowerCase();
                return hay.includes(q);
            });
        }

        items.sort((a, b) => {
            const ap = a.publishedAt ? Date.parse(a.publishedAt) : 0;
            const bp = b.publishedAt ? Date.parse(b.publishedAt) : 0;
            if (bp !== ap) return bp - ap;
            return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        });

        if (!withMeta) {
            const sliced = limit ? items.slice(0, limit) : items;
            return NextResponse.json(sliced);
        }

        const total = items.length;
        const effLimit = limit ?? 10;
        const pages = Math.max(1, Math.ceil(total / effLimit));
        const safePage = Math.max(1, Math.min(page, pages));
        const start = (safePage - 1) * effLimit;
        const end = start + effLimit;
        const pageItems = items.slice(start, end);

        return NextResponse.json({
            items: pageItems,
            total,
            page: safePage,
            limit: effLimit,
            pages,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
