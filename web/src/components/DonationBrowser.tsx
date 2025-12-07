'use client';

import { useMemo, useState } from 'react';
import type { Donation, Locale, Pack } from '@/lib/types';
import { DonationItemCard, PackCard } from './';

type Currency = 'eur' | 'ne' | 'neFake';
type ScopeTab = 'all' | 'personal' | 'clan';
type ViewMode = 'items' | 'packs';

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

function priceOf(d: Donation, curr: Currency): number | undefined {
  return (d.price as any)?.[curr] ?? undefined;
}

export default function DonationBrowser({
  items,
  packs = [],
  lang,
}: {
  items: Donation[];
  packs?: Pack[];
  lang: Locale;
}) {
  const [view, setView] = useState<ViewMode>('items');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.category);
    return Array.from(set).sort();
  }, [items]);

  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>('eur');
  const [onlyWithCurrency, setOnlyWithCurrency] = useState(false);
  const [onlySpecial, setOnlySpecial] = useState(false);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<ScopeTab>('all');
  const [showFilters, setShowFilters] = useState(false);

  const scopeAllow = (s: 'personal'|'clan'|'both') => {
    if (scope === 'all') return true;
    if (scope === 'personal') return s === 'personal' || s === 'both';
    if (scope === 'clan') return s === 'clan' || s === 'both';
    return true;
  };

  const filteredItems = useMemo(() => {
    if (view !== 'items') return [];
    let out = items.slice();

    if (scope !== 'all') out = out.filter(d => scopeAllow(d.scope as any));

    if (activeCats.length) out = out.filter(d => activeCats.includes(d.category));
    if (onlyWithCurrency) out = out.filter(d => priceOf(d, currency) != null);
    if (onlySpecial) out = out.filter(d => !!d.isSpecial);

    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter(d =>
        d.name[lang].toLowerCase().includes(term) ||
        (d.description?.[lang]?.toLowerCase().includes(term))
      );
    }

    out.sort((a, b) => {
      const pa = priceOf(a, currency);
      const pb = priceOf(b, currency);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return sortDir === 'asc' ? (pa - pb) : (pb - pa);
    });

    out.sort((a, b) => ((b.featured?1:0) - (a.featured?1:0)));
    return out;
  }, [view, items, activeCats, currency, onlyWithCurrency, onlySpecial, sortDir, q, lang, scope]);

  const filteredPacks = useMemo(() => {
    if (view !== 'packs') return [];
    let out = packs.slice();

    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter(p =>
        p.name[lang].toLowerCase().includes(term) ||
        (p.description?.[lang]?.toLowerCase().includes(term))
      );
    }

    if (onlyWithCurrency) {
      const hasPrice = (p: Pack) => (p.price as any)?.[currency] != null;
      out = out.filter(hasPrice);
    }

    out.sort((a, b) => {
      const pa = (a.price as any)?.[currency];
      const pb = (b.price as any)?.[currency];
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return sortDir === 'asc' ? (pa - pb) : (pb - pa);
    });

    out.sort((a, b) => ((b.featured?1:0) - (a.featured?1:0)));
    return out;
  }, [view, packs, q, onlyWithCurrency, currency, sortDir, lang]);

  const goView = (next: ViewMode) => {
    setView(next);
    if (next === 'packs') setActiveCats([]);
  };

  const resolveDonationName = (id: string, lang: Locale) =>
    items.find(d => d.id === id)?.name[lang];

  return (
    <div className="donations-layout">
      {/* Sidebar categorías (solo aplica a items) */}
      <aside className="donations-sidebar tile">
        <div className="kicker">{lang==='es' ? 'Navegación' : 'Browse'}</div>

        {/* toggle items/packs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`pill w-full justify-center ${view==='items' ? 'ring-1 ring-[--acc]' : ''}`}
            onClick={() => goView('items')}
          >
            {lang==='es' ? 'Items' : 'Items'}
          </button>
          <button
            className={`pill w-full justify-center ${view==='packs' ? 'ring-1 ring-[--acc]' : ''}`}
            onClick={() => goView('packs')}
          >
            {lang==='es' ? 'Packs' : 'Packs'}
          </button>
        </div>

        {view === 'items' && (
          <>
            <div className="kicker mt-3">{lang==='es' ? 'Categorías' : 'Categories'}</div>

            <button
              className={`pill w-full justify-between ${activeCats.length===0 ? 'ring-1 ring-[--acc]' : ''}`}
              onClick={() => setActiveCats([])}
            >
              <span>{lang==='es' ? 'Todas' : 'All'}</span>
              {activeCats.length===0 && <span>✓</span>}
            </button>

            <div className="grid gap-2 mt-2">
              {categories.map(cat => {
                const active = activeCats.includes(cat);
                return (
                  <button
                    key={cat}
                    className={`pill w-full justify-between ${active ? 'ring-1 ring-[--acc]' : ''}`}
                    onClick={() =>
                      setActiveCats(prev => active ? prev.filter(c => c!==cat) : [...prev, cat])
                    }
                  >
                    <span>{categoryLabel(cat, lang)}</span>
                    {active && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* Contenido principal */}
      <div className="donations-main">
        {/* Sub-tabs de Scope (solo items) */}
        {view === 'items' && (
          <div className="tabs mb-3">
            <button
              className={`tab ${scope==='all' ? 'is-active' : ''}`}
              onClick={() => setScope('all')}
            >
              {lang==='es' ? 'Todos' : 'All'}
            </button>
            <button
              className={`tab ${scope==='personal' ? 'is-active' : ''}`}
              onClick={() => setScope('personal')}
            >
              {lang==='es' ? 'Personal' : 'Personal'}
            </button>
            <button
              className={`tab ${scope==='clan' ? 'is-active' : ''}`}
              onClick={() => setScope('clan')}
            >
              {lang==='es' ? 'Clan' : 'Clan'}
            </button>
          </div>
        )}

        {/* Topbar filtros/orden (2 filas, limpio) */}
        <div className="tile donations-topbar donations-topbar--grid">
          {/* FILA 1 */}
          <div className="donations-topbar__row">
            <div className="donations-topbar__left">
              <input
                className="input"
                placeholder={
                  lang==='es'
                    ? (view==='packs' ? 'Buscar packs…' : 'Buscar items…')
                    : (view==='packs' ? 'Search packs…' : 'Search items…')
                }
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{minWidth:180}}
              />
            </div>

            <div className="donations-topbar__right">
              <label className="kicker" style={{marginRight:6}}>
                {lang==='es' ? 'Moneda' : 'Currency'}
              </label>

              {/* SELECT con contraste */}
              <div className="select">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  aria-label={lang==='es' ? 'Seleccionar moneda' : 'Select currency'}
                >
                  <option value="eur">EUR</option>
                  <option value="ne">NE</option>
                  <option value="neFake">{lang==='es' ? 'NE Falsificadas' : 'Counterfeit NE'}</option>
                </select>
              </div>

              <button
                className="btn btn-ghost"
                onClick={() => setSortDir(d => d==='asc' ? 'desc' : 'asc')}
                aria-label={lang==='es' ? 'Ordenar por precio' : 'Sort by price'}
                title={lang==='es' ? 'Ordenar por precio' : 'Sort by price'}
              >
                {lang==='es' ? (sortDir==='asc' ? 'Precio ↑' : 'Precio ↓') : (sortDir==='asc' ? 'Price ↑' : 'Price ↓')}
              </button>

              {/* Toggle filtros (móvil) */}
              <button
                className="btn btn-ghost show-on-mobile"
                onClick={() => setShowFilters(v => !v)}
                aria-expanded={showFilters}
              >
                {lang==='es' ? 'Filtros' : 'Filters'}
              </button>
            </div>
          </div>

          {/* FILA 2 */}
          <div className={`donations-topbar__filters ${showFilters ? 'is-open' : ''}`}>
            <button
              type="button"
              role="checkbox"
              aria-checked={onlyWithCurrency}
              className={`switch ${onlyWithCurrency ? 'is-on' : ''}`}
              onClick={() => setOnlyWithCurrency(v => !v)}
              title={lang==='es' ? 'Solo con esta moneda' : 'Only with this currency'}
            >
              <span className="switch-dot" />
              <span className="switch-label">
                {lang==='es' ? 'Solo con esta moneda' : 'Only with this currency'}
              </span>
            </button>

            <button
              type="button"
              role="checkbox"
              aria-checked={onlySpecial}
              className={`switch ${onlySpecial ? 'is-on' : ''}`}
              onClick={() => setOnlySpecial(v => !v)}
              title={lang==='es' ? 'Solo especiales' : 'Only specials'}
            >
              <span className="switch-dot" />
              <span className="switch-label">
                {lang==='es' ? 'Solo especiales' : 'Only specials'}
              </span>
            </button>
          </div>
        </div>

        {/* Grid de cards */}
        {view === 'items' ? (
          filteredItems.length === 0 ? (
            <div className="note-box">
              {lang==='es' ? 'No hay resultados con los filtros actuales.' : 'No results with current filters.'}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch donations-grid">
              {filteredItems.map(d => (
                <DonationItemCard key={d.id} item={d} lang={lang} />
              ))}
            </div>
          )
        ) : (
          filteredPacks.length === 0 ? (
            <div className="note-box">
              {lang==='es' ? 'No hay packs disponibles con los filtros actuales.' : 'No packs available with current filters.'}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch donations-grid">
              {filteredPacks.map(p => (
                <PackCard key={p.id} pack={p} lang={lang} resolveDonationName={resolveDonationName} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
