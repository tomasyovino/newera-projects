import { getRules } from '@/lib/data-source';
import { renderMarkdown } from '@/lib/markdown';
import type { Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RulesPage({ params }: { params: { lang: string } }) {
    const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;

    const list = await getRules();
    if (!list || list.length === 0) {
        return (
            <section className="section">
                <div className="container" style={{ maxWidth: 860 }}>
                    <article className="tile">
                        <div className="kicker" style={{ color: 'var(--muted)' }}>
                            {lang === 'es' ? 'Reglas del Servidor' : 'Server Rules'}
                        </div>
                        <h1 className="section-title">{lang === 'es' ? 'Reglas' : 'Rules'}</h1>
                        <div className="note mt-3">
                            {lang === 'es' ? 'Aún no hay reglas publicadas.' : 'No rules published yet.'}
                        </div>
                    </article>
                </div>
            </section>
        );
    }

    const htmlById = await Promise.all(
        list.map(async (r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title[lang],
            html: await renderMarkdown(r.body[lang]),
            updatedAt: r.updatedAt,
            category: r.category ?? null,
            tags: r.tags ?? [],
        }))
    );

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 860 }}>
                <article className="tile">
                    <div className="kicker" style={{ color: 'var(--muted)' }}>
                        {lang === 'es' ? 'Reglas del Servidor' : 'Server Rules'}
                    </div>
                    <h1 className="section-title">{lang === 'es' ? 'Reglas' : 'Rules'}</h1>

                    {list.length > 1 && (
                        <nav className="mt-3">
                            <ul className="list-soft flex flex-wrap gap-2">
                                {htmlById.map((r) => (
                                    <li key={r.id}>
                                        <a className="chip" href={`#rule-${r.slug}`}>{r.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    <div className="grid gap-8 mt-6">
                        {htmlById.map((r) => (
                            <section key={r.id} id={`rule-${r.slug}`}>
                                <h2 style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 8 }}>{r.title}</h2>

                                {(Boolean(r.category) || ((r.tags?.length ?? 0) > 0)) && (
                                    <div className="flex gap-2 flex-wrap mb-2">
                                        {r.category && <span className="chip">#{r.category}</span>}
                                        {r.tags?.map(t => <span className="chip" key={t}>#{t}</span>)}
                                    </div>
                                )}

                                <div className="prose-md" dangerouslySetInnerHTML={{ __html: r.html }} />

                                <div className="note mt-2" style={{ fontSize: 12 }}>
                                    {lang === 'es' ? 'Actualizado:' : 'Updated:'}{' '}
                                    {new Date(r.updatedAt).toLocaleDateString()}
                                </div>
                            </section>
                        ))}
                    </div>
                </article>
            </div>
        </section>
    );
}
