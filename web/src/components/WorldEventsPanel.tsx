'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorldEvent, Locale } from '@/lib/types';

function fmt(dt: Date, tz: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
    timeZone: tz, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(dt);
}

export default function WorldEventsPanel({
  events, serverTz, lang
}: { events: WorldEvent[]; serverTz: string; lang: Locale }) {
  // SSR->CSR TZ safe
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const localTz = mounted ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : serverTz;

  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const { active, upcoming } = useMemo(() => {
    const act: Array<{ ev: WorldEvent; start: Date; end: Date; p: number }> = [];
    const up: Array<{ ev: WorldEvent; start: Date; end: Date }> = [];
    for (const ev of events) {
      const start = new Date(ev.startsAt);
      const end = new Date(ev.endsAt);
      if (now >= start && now <= end) {
        const total = end.getTime() - start.getTime();
        const done = now.getTime() - start.getTime();
        const p = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
        act.push({ ev, start, end, p });
      } else if (now < start) {
        up.push({ ev, start, end });
      }
    }
    act.sort((a, b) => a.end.getTime() - b.end.getTime());
    up.sort((a, b) => a.start.getTime() - b.start.getTime());
    return { active: act, upcoming: up };
  }, [events, now]);

  if (!events.length) return null;

  const hero = useMemo(() => (active.length ? active.find(a => a.ev.featured) ?? active[0] : null), [active]);

  return (
    <div className="tile">
      <div className="kicker">{lang === 'es' ? 'Eventos de mundo' : 'World events'}</div>

      {/* HERO ACTIVO */}
      {hero ? (
        <HeroWorldEvent
          lang={lang}
          ev={hero.ev}
          start={hero.start}
          end={hero.end}
          progress={hero.p}
          tz={localTz}
        />
      ) : (
        <div className="note-box">
          {lang==='es' ? 'No hay eventos de mundo activos en este momento.' : 'No world events are active right now.'}
        </div>
      )}

      {/* PRÓXIMOS: full width list */}
      <div className="mt-4">
        {upcoming.length > 0 ? (
            <>
                <div className="kicker">{lang==='es' ? 'Próximos' : 'Upcoming'}</div>
                <UpcomingCarousel items={upcoming} lang={lang} tz={localTz} />
            </>
        ) : (
          <div className="note" style={{marginTop:8}}>
            {lang==='es' ? 'No hay eventos de mundo próximos cercanos.' : 'No upcoming world events soon.'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function HeroWorldEvent({
  ev, start, end, progress, tz, lang
}: { ev: WorldEvent; start: Date; end: Date; progress: number; tz: string; lang: Locale; }) {
  return (
    <div className={`we-hero ${ev.banner ? 'has-banner' : ''}`}>
      {ev.banner && <div className="we-hero-media" style={{ backgroundImage: `url(${ev.banner})` }} aria-hidden />}
      <span className="badge-live-abs">{lang==='es' ? 'ACTIVO' : 'LIVE'}</span>

      <div className="we-hero-content">
        {ev.headline?.[lang] && <div className="we-callout">{ev.headline[lang]}</div>}

        <div className="we-hero-head">
          <h3 className="we-hero-title">{ev.name[lang]}</h3>
          {ev.location?.[lang] && <span className="we-loc chip">{ev.location[lang]}</span>}
        </div>

        {ev.description?.[lang] && <p className="we-hero-desc">{ev.description[lang]}</p>}

        {ev.highlights?.length ? (
          <ul className="we-points">
            {ev.highlights.map((h, i) => <li key={i}>{h[lang]}</li>)}
          </ul>
        ) : null}

        {ev.rewards?.length ? (
          <>
            <div className="kicker" style={{marginTop:6}}>{lang==='es' ? 'Recompensas' : 'Rewards'}</div>
            <ul className="we-list-soft">
              {ev.rewards.map((r, i) => <li key={i} className="chip">{r[lang]}</li>)}
            </ul>
          </>
        ) : null}

        {ev.warnings?.length ? (
          <div className="we-warnings">
            {ev.warnings.map((w, i) => <div key={i} className="we-warning">{w[lang]}</div>)}
          </div>
        ) : null}

        <div className="progress progress-lg">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="we-times">
          <span className="chip">
            {lang==='es' ? 'Inicio' : 'Start'}:{' '}
            <span suppressHydrationWarning>{fmt(start, tz, lang)}</span> {lang==='es' ? '(tu zona)' : '(your TZ)'}
          </span>
          <span className="chip">
            {lang==='es' ? 'Fin' : 'End'}:{' '}
            <span suppressHydrationWarning>{fmt(end, tz, lang)}</span> {lang==='es' ? '(tu zona)' : '(your TZ)'}
          </span>
        </div>
      </div>
    </div>
  );
}

function UpcomingCarousel({
  items, lang, tz
}: {
  items: Array<{ ev: WorldEvent; start: Date; end: Date }>;
  lang: Locale;
  tz: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 1);

  const step = () => trackRef.current?.clientWidth ?? 0;

  const updateNav = () => {
    const el = trackRef.current;
    if (!el) return;
    const s = step();
    if (s === 0) return;

    const idx = Math.round(el.scrollLeft / s);
    const max = Math.max(0, items.length - 1);
    setCanPrev(idx > 0);
    setCanNext(idx < max);
  };

  useEffect(() => {
    updateNav();
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateNav);
    };
    const onResize = () => updateNav();

    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  const scrollByStep = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const s = step();
    const maxLeft = (items.length - 1) * s;
    const target = Math.max(0, Math.min(el.scrollLeft + dir * s, maxLeft));
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div className="we-carousel" role="region" aria-roledescription="carousel">
      {canPrev && (
        <button
          className="we-nav we-nav-left"
          aria-label="Previous"
          onClick={() => scrollByStep(-1)}
        >
          {/* Chevron left */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19L8 12l7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="we-track hide-scrollbar" ref={trackRef}>
        {items.map(({ ev, start, end }) => (
          <article key={ev.id} className="we-card">
            <div className="we-card-head">
              <h4 className="we-card-title">{ev.name[lang]}</h4>
              {ev.location?.[lang] && <span className="we-loc chip">{ev.location[lang]}</span>}
            </div>
            {ev.description?.[lang] && <p className="we-card-desc">{ev.description[lang]}</p>}
            <div className="we-card-times">
              <span className="chip">
                {lang==='es' ? 'Inicio' : 'Start'}:{' '}
                <span suppressHydrationWarning>{fmt(start, tz, lang)}</span>
              </span>
              <span className="chip">
                {lang==='es' ? 'Fin' : 'End'}:{' '}
                <span suppressHydrationWarning>{fmt(end, tz, lang)}</span>
              </span>
            </div>
          </article>
        ))}
      </div>

      {canNext && (
        <button
          className="we-nav we-nav-right"
          aria-label="Next"
          onClick={() => scrollByStep(1)}
        >
          {/* Chevron right */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}