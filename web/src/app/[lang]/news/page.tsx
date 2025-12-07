import Link from 'next/link';
import { getAllPublishedNewsPage } from '@/lib/data-source';
import type { Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewsIndex({
    params, searchParams,
}: {
    params: { lang: string },
    searchParams: { page?: string }
}) {
    const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;
    const page = Number(searchParams.page ?? '1') || 1;
    const limit = 8;

    const { items, pages } = await getAllPublishedNewsPage(page, limit);

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 900 }}>
                {/* Header */}
                <div className="tile">
                    <div className="kicker">{lang === 'es' ? 'Novedades' : 'News'}</div>
                    <h1 className="section-title">
                        {lang === 'es' ? 'Actualizaciones & anuncios' : 'Updates & announcements'}
                    </h1>
                </div>

                {/* Listado */}
                <div className="grid gap-4 mt-4">
                    {items.map(n => {
                        const href = `/${lang}/news/${n.slug}`;
                        const dateStr = new Date(n.publishedAt ?? n.createdAt).toLocaleDateString();
                        const hasCover = !!n.cover;
                        const bg = hasCover
                            ? `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55)), url(${n.cover})`
                            : 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))';

                        return (
                            <Link
                                key={n.id}
                                href={href}
                                className="tile hover:brightness-105"
                                style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: 16,
                                    padding: 0,
                                    background: hasCover ? undefined : 'var(--panel)',
                                    border: '1px solid var(--stroke)',
                                }}
                            >
                                {/* “Row hero” compacto como fondo */}
                                <div
                                    style={{
                                        position: 'relative',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: 12,
                                        minHeight: 180,            // sube a 220 si quieres más presencia
                                        padding: 16,
                                        backgroundImage: bg,
                                        backgroundSize: hasCover ? 'cover' : undefined,
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            className="kicker"
                                            style={{ color: 'var(--muted)', marginBottom: 6 }}
                                        >
                                            {dateStr}
                                        </div>

                                        <h2
                                            style={{
                                                fontSize: 22,
                                                lineHeight: 1.2,
                                                margin: 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical' as any,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {n.title[lang]}
                                        </h2>

                                        {n.excerpt?.[lang] && (
                                            <p
                                                style={{
                                                    marginTop: 8,
                                                    color: 'var(--muted)',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical' as any,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {n.excerpt[lang]}
                                            </p>
                                        )}

                                        {!!n.tags?.length && (
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {n.tags.map(t => (
                                                    <span key={t} className="chip">#{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA lateral */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        {n.featured && <span className="chip">★</span>}
                                        <span className="btn btn-ghost">{lang === 'es' ? 'Leer' : 'Read'}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="note">
                            {lang === 'es' ? 'No hay novedades publicadas.' : 'No news yet.'}
                        </div>
                    )}
                </div>

                {/* Paginado */}
                {pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {/* Prev */}
                        <Link
                            className={`btn btn-ghost ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                            href={`/${lang}/news?page=${Math.max(1, page - 1)}`}
                            aria-disabled={page <= 1}
                        >
                            ‹ {lang === 'es' ? 'Anterior' : 'Prev'}
                        </Link>

                        {/* Números */}
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => {
                            const active = p === page;
                            return (
                                <Link
                                    key={p}
                                    className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                                    href={`/${lang}/news?page=${p}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {p}
                                </Link>
                            );
                        })}

                        {/* Next */}
                        <Link
                            className={`btn btn-ghost ${page >= pages ? 'opacity-50 pointer-events-none' : ''}`}
                            href={`/${lang}/news?page=${Math.min(pages, page + 1)}`}
                            aria-disabled={page >= pages}
                        >
                            {lang === 'es' ? 'Siguiente' : 'Next'} ›
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
