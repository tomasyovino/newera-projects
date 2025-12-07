import fs from 'node:fs';
import path from 'node:path';
import { Reveal, TodayEvents, WorldEventsPanel, FloatingNews } from '@/components';
import { getTodayEventSlots, getWeeklyAgendaSlots, getWorldEvents, getLatestNews } from '@/lib/data-source';
import type { Locale, New } from '@/lib/types';
import Image from 'next/image';
import { DEFAULT_TZ } from '@/lib/constants';

function dict(lang: Locale) {
  const p = path.join(process.cwd(), 'i18n', `${lang}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export default async function HomePage({ params }: { params: { lang: string } }) {
  const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;
  const d = dict(lang);

  const [latestNews, today, weekly, worldEvents] = await Promise.all([
    getLatestNews(5),
    getTodayEventSlots(),
    getWeeklyAgendaSlots(),
    getWorldEvents(),
  ]);

  const NEXT_PUBLIC_DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com';
  const NEXT_PUBLIC_WIKI_URL = process.env.NEXT_PUBLIC_WIKI_URL || '';
  const DL_WIN = process.env.NEXT_PUBLIC_DOWNLOAD_URL_WIN || '#';
  const DL_MAC = process.env.DOWNLOAD_URL_MAC || '';

  const dayNamesES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dayNamesEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayNames = lang === 'es' ? dayNamesES : dayNamesEN;

  const grouped: Record<number, typeof weekly> = {};
  for (const s of weekly) (grouped[s.dayOfWeek] ||= []).push(s);
  const order = [1, 2, 3, 4, 5, 6, 7];

  return (
    <>
      {/* HERO */}
      <section id="hero" className="section section--hero">
        <div className="container">
          <Reveal>
            <div style={{ position: 'relative' }}>
            <div className="hero">
              <div className="hero-media" style={{ backgroundImage: "url(/images/hero-bg.webp)" }} />
              <div className="hero-content">
                <div className="hero-eyebrow">{lang === 'es' ? 'Bienvenido' : 'Welcome'}</div>
                <h1 className="hero-title">New Era</h1>
                <p className="hero-sub">
                  {d.home.subtitle}
                </p>
                <div className="pillbar">
                  <a href="#download" className="pill">{lang === 'es' ? 'Descargar' : 'Download'}</a>
                  <a href="#community" className="pill">Discord & Wiki</a>
                  <a href="#events" className="pill">{lang === 'es' ? 'Eventos' : 'Events'}</a>
                </div>
              </div>
            </div>
            <FloatingNews items={latestNews} lang={lang} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="section section--events">
        <div className="container">
          <Reveal><h2 className="section-title">{lang === 'es' ? 'Eventos' : 'Events'}</h2></Reveal>

          {/* Mundo */}
          <Reveal className="mt-4">
            <WorldEventsPanel events={worldEvents} serverTz={DEFAULT_TZ} lang={lang} />
          </Reveal>

          {/* Hoy */}
          <Reveal className="mt-6">
            <div className="kicker" style={{ marginBottom: 8 }}>{lang === 'es' ? 'Eventos semanales' : 'Weekly schedule'}</div>
            <TodayEvents slots={today} serverTz={DEFAULT_TZ} lang={lang} />
          </Reveal>

          {/* Semanal */}
          <Reveal className="mt-4">
            {(() => {
              const daysWith = order.filter((d) => (grouped[d]?.length ?? 0) > 0);

              if (daysWith.length === 0) {
                return (
                  <div className="note" style={{ marginTop: 8 }}>
                    {lang === 'es'
                      ? 'No hay eventos semanales definidos por ahora.'
                      : 'No weekly events defined yet.'}
                  </div>
                );
              }

              return (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                    {daysWith.map((dIdx) => (
                      <div key={dIdx - 1} className="tile">
                        <div className="tile-cta">
                          <h3>{dayNames[dIdx - 1]}</h3>
                          <span className="chip">
                            {grouped[dIdx].length}{' '}
                            {lang === 'es' ? 'eventos' : 'events'}
                          </span>
                        </div>

                        <ul className="list-soft space-y-1">
                          {grouped[dIdx].map((s, i) => (
                            <li key={`${s.id}-${i}`}>
                              <span className="truncate">{s.name[lang]}</span>
                              <span className="chip">{s.time}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="note mt-2">
                    {lang === 'es'
                      ? `Horarios en hora del servidor (${DEFAULT_TZ}).`
                      : `Times are in server time (${DEFAULT_TZ}).`}
                  </div>
                </>
              );
            })()}
          </Reveal>
        </div>
      </section>

      {/* COMMUNITY (Discord / Wiki) */}
      <section id="community" className="section">
        <div className="container">
          <Reveal><h2 className="section-title">{lang === 'es' ? 'Comunidad' : 'Community'}</h2></Reveal>
          <Reveal className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Discord */}
              <a className="tile tile-cta hover:brightness-105" href={NEXT_PUBLIC_DISCORD_URL} target="_blank" rel="noreferrer">
                <div className="flex items-center gap-3">
                  <Image src="/images/discord.svg" alt="Discord" width={28} height={28} className="icon icon-glow" />
                  <div>
                    <h3>Discord</h3>
                    <p style={{ color: 'var(--muted)' }}>{lang === 'es' ? 'Únete a la comunidad y a los anuncios' : 'Join the community and announcements'}</p>
                  </div>
                </div>
                <span className="chip">{lang === 'es' ? 'Abrir' : 'Open'}</span>
              </a>

              {/* Wiki */}
              <a className="tile tile-cta hover:brightness-105" href={NEXT_PUBLIC_WIKI_URL || '#'} target={NEXT_PUBLIC_WIKI_URL ? '_blank' : undefined} rel={NEXT_PUBLIC_WIKI_URL ? 'noreferrer' : undefined}>
                <div className="flex items-center gap-3">
                  <Image src="/images/guide.svg" alt="Wiki" width={28} height={28} className="icon icon-glow" />
                  <div>
                    <h3>Wiki</h3>
                    <p style={{ color: 'var(--muted)' }}>{lang === 'es' ? 'Guías, sistemas y progresión' : 'Guides, systems and progression'}</p>
                  </div>
                </div>
                <span className="chip">{NEXT_PUBLIC_WIKI_URL ? (lang === 'es' ? 'Abrir' : 'Open') : (lang === 'es' ? 'Pronto' : 'Soon')}</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="section section--half section--half-last  mb-12">
        <div className="container">
          <Reveal><h2 className="section-title">{lang === 'es' ? 'Descargar' : 'Download'}</h2></Reveal>

          <Reveal className="mt-4">
            <div className="tile">
              {/* CTA grande */}
              <div className="dl-banner">
                <div>
                  <div className="kicker">{lang === 'es' ? 'Cliente del juego' : 'Game client'}</div>
                  <h3>{lang === 'es' ? 'Descarga y juega' : 'Download & play'}</h3>
                </div>
                <div className="dl-buttons">
                  <a target="_blank" href={DL_WIN} className="btn btn-primary btn-xl btn-fixed">Windows</a>
                  {DL_MAC && (
                    <a target="_blank" href={DL_MAC} className="btn btn-ghost btn-xl btn-fixed">macOS</a>
                  )}
                </div>
              </div>

              {/* info compacta */}
              <div className="meta-list">
                <div>
                  <span>{lang === 'es' ? 'Tamaño de descarga' : 'Download size'}</span>{' '}
                  <span className="chip">~1.2 GB</span>
                </div>
              </div>

              {/* leyenda importante */}
              <div className="note-box">
                {lang === 'es'
                  ? 'Importante: Se requiere Windows 8 o una versión más reciente para ejecutar el launcher.'
                  : 'Important: Windows 8 or a more recent version is required to run the launcher.'}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
