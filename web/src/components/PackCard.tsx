'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Locale, Pack } from '@/lib/types';

type ResolveDonationName = (id: string, lang: Locale) => string | undefined;

function fmtEur(n: number, lang: Locale) {
  const loc = lang === 'es' ? 'es-ES' : 'en-GB';
  return new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);
}

export default function PackCard({
  pack,
  lang,
  resolveDonationName,
  maxPreview = 3,
}: {
  pack: Pack;
  lang: Locale;
  resolveDonationName?: ResolveDonationName;
  maxPreview?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasImg = !!pack.icon && /^https?:\/\//i.test(pack.icon!);

  useEffect(() => {
    setLoaded(false);
    if (hasImg) {
      const img = new Image();
      img.src = pack.icon!;
      img.onload = () => setLoaded(true);
      img.onerror = () => setLoaded(false);
    }
  }, [pack.icon, hasImg]);

  const total = pack.items?.length ?? 0;
  const hasMore = total > maxPreview;
  const remaining = Math.max(0, total - maxPreview);

  const itemsPreview = useMemo(() => {
    const all = pack.items ?? [];
    return expanded ? all : all.slice(0, maxPreview);
  }, [expanded, pack.items, maxPreview]);

  // Precios -> chips
  const priceChips: string[] = [];
  if (pack.price?.eur != null) priceChips.push(fmtEur(pack.price.eur, lang));
  if (pack.price?.ne != null) priceChips.push(`${pack.price.ne} NE`);
  if (pack.price?.neFake != null) priceChips.push(`${pack.price.neFake} ${lang==='es' ? 'NEF' : 'NEF'}`);

  return (
    <article className="tile pack-card2">
      {/* HERO con preload + skeleton */}
      <div
        className={`pack-card2__hero ${loaded ? 'is-loaded' : 'is-loading'}`}
        style={loaded && pack.icon ? { backgroundImage: `url(${pack.icon})` } : undefined}
        aria-hidden={!loaded}
      >
        <div className="pack-card2__scrim" aria-hidden />
        <div className="pack-card2__overlay">
          <h3 className="pack-card2__title">{pack.name[lang]}</h3>
        </div>
        {!loaded && <div className="skeleton shimmer" aria-hidden />}
      </div>

      {/* BODY */}
      <div className="pack-card2__body">
        {/* Tags + precios en una fila estable */}
        <div className="pack-card2__meta">
          <div className="pack-card2__tags">
            {pack.featured && (
              <span className="chip chip-ok">{lang==='es' ? 'Destacado' : 'Featured'}</span>
            )}
          </div>
          <div className="pack-card2__prices">
            {priceChips.length
              ? priceChips.map((c, i) => <span key={i} className="chip">{c}</span>)
              : <span className="chip" style={{opacity:.7}}>{lang==='es' ? 'Consultar' : 'Ask'}</span>
            }
          </div>
        </div>

        {/* Descripción (clamp) */}
        {pack.description?.[lang] && (
          <p className="pack-card2__desc">{pack.description[lang]}</p>
        )}

        {/* Contenido */}
        <div className="kicker" style={{ marginTop: 2 }}>
          {lang==='es' ? 'Contenido' : 'Contents'}
        </div>
        <ul id={`pack-items-${pack.id}`} className="list-soft space-y-1">
          {itemsPreview.map((it, idx) => {
            const label = resolveDonationName?.(it.donationId, lang)
              ?? (lang==='es' ? 'Ítem' : 'Item');
            return (
              <li key={`${it.donationId}-${idx}`} className="flex items-center justify-between gap-3">
                <span className="truncate">{label}</span>
                {it.qty != null && <span className="chip">×{it.qty}</span>}
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <div className="pack-card2__footer">
            <span className="text-xs" style={{ color:'var(--muted)' }}>
              {expanded
                ? (lang==='es' ? 'Mostrando todos los ítems' : 'Showing all items')
                : (lang==='es'
                    ? (remaining === 1 ? '1 ítem más' : `${remaining} ítems más`)
                    : (remaining === 1 ? '1 more item' : `${remaining} more items`))}
            </span>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              aria-controls={`pack-items-${pack.id}`}
            >
              {expanded ? (lang==='es' ? 'Ver menos' : 'Show less')
                      : (lang==='es' ? 'Ver todo' : 'Show all')}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
