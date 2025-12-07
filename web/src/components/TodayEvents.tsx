'use client';

import { useMemo, useRef, useEffect, useState, useId } from 'react';
import type { EventSlot, Locale } from '@/lib/types';

/** Offset "+HH:MM" para una zona en una fecha dada usando Intl */
function tzOffset(serverTz: string, at: Date) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: serverTz, hour12: false, hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset'
        }).formatToParts(at);
        const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
        const m = tz.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
        if (!m) return '+00:00';
        const h = String(Math.abs(parseInt(m[1], 10))).padStart(2, '0');
        const sign = m[1].startsWith('-') ? '-' : '+';
        const mm = m[2] ?? '00';
        return `${sign}${h}:${mm}`;
    } catch { return '+00:00'; }
}

/** Convierte HH:mm del servidor → hora local + indica cambio de día (-1/0/+1) */
function serverTimeToLocal(serverDate: string, hhmm: string, serverTz: string, localTz: string) {
    const offset = tzOffset(serverTz, new Date());
    const iso = `${serverDate}T${hhmm}:00${offset}`;
    const utc = new Date(iso);

    const localHHmm = new Intl.DateTimeFormat('en-GB', {
        timeZone: localTz, hour12: false, hour: '2-digit', minute: '2-digit'
    }).format(utc);

    const serverDay = new Intl.DateTimeFormat('en-CA', { timeZone: serverTz, year:'numeric',month:'2-digit',day:'2-digit' }).format(utc);
    const localDay  = new Intl.DateTimeFormat('en-CA', { timeZone: localTz,  year:'numeric',month:'2-digit',day:'2-digit' }).format(utc);
    const dayShift = localDay === serverDay ? 0 : (localDay > serverDay ? 1 : -1);
    return { localHHmm, dayShift };
}

export default function TodayEvents({
  slots, serverTz, lang,
}: { slots: EventSlot[]; serverTz: string; lang: Locale }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const localTz = useMemo(() => {
        if (!mounted) return 'UTC';
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }, [mounted]);

    // Fecha “hoy” en la zona del servidor
    const serverDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: serverTz, year:'numeric', month:'2-digit', day:'2-digit'
    }).format(new Date());

    // Agrupar por título (un evento puede tener múltiples horarios hoy)
    const groups = useMemo(() => {
        const map = new Map<string, { desc?: string; times: string[] }>();
        for (const s of slots) {
        const title = s.name[lang];
        const g = map.get(title) || { desc: s.description?.[lang], times: [] };
        g.desc = g.desc || s.description?.[lang];
        g.times.push(s.time);
        map.set(title, g);
        }
        return Array.from(map.entries()).map(([title, g]) => ({
        title,
        desc: g.desc,
        times: g.times.sort(),
        }));
    }, [slots, lang]);

    if (!groups.length) {
        return <p style={{ color: 'var(--muted)' }}>
        {lang === 'es' ? 'No hay eventos semanales programados para hoy.' : 'No weekly events scheduled for today.'}
        </p>;
    }

    return (
        <div className="tile">
        <div className="kicker">{lang === 'es' ? 'Hoy' : 'Today'}</div>
        <ul className="space-y-2">
            {groups.map((g, idx) => (
            <li key={idx}>
                <GroupDetails
                    g={g}
                    lang={lang}
                    serverDateStr={serverDateStr}
                    serverTz={serverTz}
                    localTz={localTz}
                />
            </li>
            ))}
        </ul>

        <div className="note">
            {lang === 'es'
            ? <>Leyenda: <span className="tag tag-srv">SRV</span> = hora del servidor (<strong>{serverTz}</strong>), <span className="tag tag-local">LOCAL</span> = tu hora (<strong>{localTz}</strong>).</>
            : <>Legend: <span className="tag tag-srv">SRV</span> = server time (<strong>{serverTz}</strong>), <span className="tag tag-local">LOCAL</span> = your time (<strong>{localTz}</strong>).</>}
        </div>
        </div>
    );
}

/** Subcomponente para cada grupo: maneja la animación de alto */
function GroupDetails({
  g,
  lang,
  serverDateStr,
  serverTz,
  localTz,
}: {
  g: { title: string; desc?: string; times: string[] };
  lang: Locale;
  serverDateStr: string;
  serverTz: string;
  localTz: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const uid = useId();
  const descId = `desc-${uid}`

  useEffect(() => setMounted(true), []);

  // Animación suave abrir/cerrar con max-height
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const onEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== 'max-height') return;
      if (isOpen) {
        // dejar altura libre tras expandir
        body.style.maxHeight = '';
      } else {
        // aseguramos 0 al cerrar
        body.style.maxHeight = '0px';
      }
    };
    body.addEventListener('transitionend', onEnd);

    // Mantener altura correcta si cambia contenido / resize
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
      if (isOpen) body.style.maxHeight = body.scrollHeight + 'px';
    }) : null;
    ro?.observe(body);

    const onResize = () => { if (isOpen) body.style.maxHeight = body.scrollHeight + 'px'; };
    window.addEventListener('resize', onResize);

    return () => {
      body.removeEventListener('transitionend', onEnd);
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen]);

  const openPanel = () => {
    const body = bodyRef.current!;
    body.classList.add('is-open');
    body.style.maxHeight = '0px';
    requestAnimationFrame(() => {
      body.style.maxHeight = body.scrollHeight + 'px';
    });
    setIsOpen(true);
  };

  const closePanel = () => {
    const body = bodyRef.current!;
    body.style.maxHeight = body.scrollHeight + 'px';
    // reflow para que el cambio a 0 sea animable
    void body.offsetHeight;
    body.classList.remove('is-open');
    body.style.maxHeight = '0px';
    setIsOpen(false);
  };

  const toggle = () => (isOpen ? closePanel() : openPanel());

  return (
    <div className={`panel ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="row cursor-pointer w-full text-left"
        aria-expanded={isOpen}
        aria-controls={descId}
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <span className="chip">{lang === 'es' ? 'HOY' : 'TODAY'}</span>
          <span className="font-semibold">{g.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="times">
            {g.times.map((t, i) => {
              const conv = mounted
                ? serverTimeToLocal(serverDateStr, t, serverTz, localTz)
                : { localHHmm: t, dayShift: 0 as 0 }; // evita hydration mismatch

              return (
                <span key={i} className="chip">
                  <span className="tag tag-srv">{lang==='es' ? 'SRV' : 'SRV'}</span>&nbsp;{t}
                  <span className="sep">→</span>
                  <span className="tag tag-local">{lang==='es' ? 'LOCAL' : 'LOCAL'}</span>&nbsp;
                  <span suppressHydrationWarning>{conv.localHHmm}</span>
                  {conv.dayShift !== 0 && (
                    <span className="badge-warn">
                      {lang==='es' ? (conv.dayShift>0?'mañana':'ayer') : (conv.dayShift>0?'tomorrow':'yesterday')}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <svg className="caret" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M8 5l8 7-8 7z" />
          </svg>
        </div>
      </button>

      {g.desc && (
        <div ref={bodyRef} id={descId} className="details-body mt-2">
          <div><div className="text-sm">{g.desc}</div></div>
        </div>
      )}
    </div>
  );
}
