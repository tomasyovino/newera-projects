import { getAbout } from '@/lib/data-source';
import { renderMarkdown } from '@/lib/markdown';
import type { Locale } from '@/lib/types';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AboutPage({ params }: { params: { lang: string } }) {
    const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;

    // Intro fija (no viene del backend)
    const intro = {
        es: {
            title: 'Quiénes somos',
            subtitle: 'Proyecto, equipo y comunidad',
            body: `En **New Era** buscamos el progreso junto a nuestros jugadores, no de manera separada. 
            Creemos que el desarrollo del juego es un esfuerzo conjunto: premiamos la participación activa 
            y la colaboración. Este proyecto evoluciona **con ustedes y gracias a ustedes**.`,
        },
        en: {
            title: 'Who we are',
            subtitle: 'Project, team & community',
            body: `At **New Era**, we grow **with** our players, not apart from them. 
            We believe game development is a joint effort: we reward active participation 
            and collaboration. This project evolves **with you and thanks to you**.`,
        },
    }[lang];

    const entries = (await getAbout()).filter(e => e.slug !== 'intro');
    const rendered = await Promise.all(
        entries.map(async (m) => ({
            ...m,
            html: await renderMarkdown(m.body[lang] || ''),
        }))
    );

    const lastUpdated =
        rendered.length > 0
            ? new Date(Math.max(...rendered.map(e => Date.parse(e.updatedAt || e.createdAt))))
            : null;

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 900 }}>
                <article
                    className="tile"
                    style={{
                        overflow: 'hidden',
                        position: 'relative',
                        background:
                            'radial-gradient(120% 160% at 80% 10%, rgba(72,135,255,.12) 0%, rgba(25,28,40,.6) 45%, rgba(16,18,26,.8) 100%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0))',
                        border: '1px solid rgba(255,255,255,.08)',
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            inset: -2,
                            background:
                                'conic-gradient(from 220deg at 110% -10%, rgba(255,255,255,.22), rgba(255,255,255,0) 20%)',
                            maskImage:
                                'linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,0.0) 40%, rgba(0,0,0,.5))',
                            pointerEvents: 'none',
                        }}
                    />
                    <div className="kicker" style={{ color: 'var(--muted)', position: 'relative' }}>
                        {intro.subtitle}
                    </div>
                    <h1 className="section-title" style={{ position: 'relative' }}>
                        {intro.title}
                    </h1>
                    <div className="prose-md mt-2" style={{ position: 'relative' }} dangerouslySetInnerHTML={{ __html: await renderMarkdown(intro.body) }} />
                    {lastUpdated && (
                        <div className="note" style={{ marginTop: 10, position: 'relative' }}>
                            {lang === 'es' ? 'Última actualización:' : 'Last updated:'}{' '}
                            {lastUpdated.toLocaleDateString()}
                        </div>
                    )}
                </article>

                {/* Lista de miembros */}
                <div className="grid gap-4 mt-4">
                    {rendered.map((m) => (
                        <section key={m.id} className="tile">
                            <div className="tile-cta">
                                <div className="flex items-center gap-3">
                                    {m.avatar && (
                                        <Image
                                            src={m.avatar}
                                            alt={m.title[lang]}
                                            width={64}
                                            height={64}
                                            className="rounded object-cover"
                                        />
                                    )}
                                    <div>
                                        <h2 style={{ fontSize: 20, lineHeight: 1.2 }}>{m.title[lang]}</h2>
                                        {m.role && <div style={{ color: 'var(--muted)' }}>{m.role}</div>}
                                    </div>
                                </div>
                                {!!m.tags?.length && (
                                    <div className="flex gap-2 flex-wrap">
                                        {m.tags.map((t) => (
                                            <span key={t} className="chip">#{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="prose-md mt-3">
                                <div dangerouslySetInnerHTML={{ __html: m.html }} />
                            </div>
                        </section>
                    ))}

                    {rendered.length === 0 && (
                        <div className="note">
                            {lang === 'es'
                                ? 'Pronto presentaremos al equipo.'
                                : 'Team information coming soon.'}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
