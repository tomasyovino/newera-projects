import { notFound } from 'next/navigation';
import { getNewsBySlug } from '@/lib/data-source';
import { renderMarkdown } from '@/lib/markdown';
import type { Locale } from '@/lib/types';

export default async function NewsDetail({ params }: { params: { lang: string; slug: string } }) {
    const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;
    const item = await getNewsBySlug(params.slug);
    if (!item) return notFound();

    const html = await renderMarkdown(item.body[lang]);

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 860 }}>
                <article className="tile">
                    <div className="kicker" style={{ color: 'var(--muted)' }}>
                        {new Date(item.publishedAt ?? item.createdAt).toLocaleString()}
                    </div>
                    <h1 className="section-title">{item.title[lang]}</h1>

                    {item.excerpt?.[lang] && (
                        <p className="mt-3 text-lg" style={{ color: 'var(--muted)' }}>
                            {item.excerpt[lang]}
                        </p>
                    )}

                    {item.cover && (
                        <div className="rounded overflow-hidden border border-[var(--stroke)] mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.cover} alt={item.title[lang]} style={{ width: '100%', display: 'block' }} />
                        </div>
                    )}

                    <div className="prose mt-4">
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    </div>

                    {!!item.tags?.length && (
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {item.tags.map(t => <span key={t} className="chip">#{t}</span>)}
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
}
