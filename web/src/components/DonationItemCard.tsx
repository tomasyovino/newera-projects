'use client';

import { useEffect, useState } from 'react';
import type { Donation, Locale } from '@/lib/types';

function categoryLabel(cat: string, lang: Locale) {
  const es: Record<string,string> = {
    currency_ne: 'Moneda NE',
    currency_ne_fake: 'Moneda NE Falsificada',
    item: 'Objetos',
    stat_boost: 'Mejora de Personaje',
    land_house: 'Casas',
    land_mine: 'Minas',
    mount: 'Monturas',
  };
  const en: Record<string,string> = {
    currency_ne: 'NE Currency',
    currency_ne_fake: 'Counterfeit NE',
    item: 'Items',
    stat_boost: 'Character Upgrade',
    land_house: 'Houses',
    land_mine: 'Mines',
    mount: 'Mounts',
  };
  const t = lang==='es' ? es : en;
  return t[cat] ?? cat;
}

function fmtEur(n: number, lang: Locale) {
  return new Intl.NumberFormat(lang==='es' ? 'es-ES' : 'en-GB', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2
  }).format(n);
}

export default function DonationItemCard({ item, lang }: { item: Donation; lang: Locale }) {
  const [loaded, setLoaded] = useState(false);
  const isExternalImg = !!item.icon && /^https?:\/\//i.test(item.icon!);

  useEffect(() => {
    setLoaded(false);
    if (isExternalImg) {
      const img = new Image();
      img.src = item.icon!;
      img.onload = () => setLoaded(true);
      img.onerror = () => setLoaded(false);
    }
  }, [item.icon, isExternalImg]);

  const hasEUR = item.price?.eur != null;
  const hasNE  = item.price?.ne != null;
  const hasNEF = item.price?.neFake != null;

  return (
    <article className="tile donation-card2">
      {/* HERO con preload + skeleton */}
      <div
        className={`donation-card2__hero ${loaded ? 'is-loaded' : 'is-loading'}`}
        style={loaded ? { backgroundImage: `url(${item.icon})` } : undefined}
        aria-hidden={!loaded}
      >
        {/* Scrim general */}
        <div className="donation-card2__scrim" aria-hidden />

        {/* Banda inferior para título */}
        <div className="donation-card2__overlay">
          <h3 className="donation-card2__title">{item.name[lang]}</h3>
        </div>

        {/* Skeleton mientras carga */}
        {!loaded && <div className="skeleton shimmer" aria-hidden />}
      </div>

      {/* Contenido */}
      <div className="donation-card2__body">
        {/* Tags */}
        <div className="donation-card2__tags">
          <span className="chip chip-ellip">{categoryLabel(item.category, lang)}</span>
          {item.isSpecial && <span className="chip chip-warn">{lang==='es'?'Especial':'Special'}</span>}
          {item.featured && <span className="chip chip-ok">{lang==='es'?'Destacado':'Featured'}</span>}
        </div>

        {/* Descripción */}
        {item.description?.[lang] && (
          <p className="donation-card2__desc">{item.description[lang]}</p>
        )}

        {/* Precios (solo si hay valor) */}
        <div className="donation-card2__prices">
          {hasEUR && <span className="chip">EUR: {fmtEur(item.price.eur!, lang)}</span>}
          {hasNE  && <span className="chip">NE: {item.price.ne}</span>}
          {hasNEF && <span className="chip">{lang==='es' ? 'NEF' : 'NEF'}: {item.price.neFake}</span>}
        </div>
      </div>
    </article>
  );
}
