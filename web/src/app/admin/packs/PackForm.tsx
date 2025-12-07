'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Donation, Locale, Pack } from '@/lib/types';

type FormValue = Omit<Pack, 'id'|'createdAt'|'updatedAt'> & { id?: string };

function slugify(s: string) {
  return s
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}
function numOrUndef(v: string): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function PackForm({
  value,
  onCancel,
  onSaved,
  lang = 'es',
  maxPreviewNames = 24,
}: {
  value?: Pack;              // si viene => edición
  onCancel?: () => void;
  onSaved?: () => void;
  lang?: Locale;
  maxPreviewNames?: number;
}) {
  const initial: FormValue = useMemo<FormValue>(() => {
    if (value) {
      return {
        id: value.id,
        slug: value.slug,
        name: value.name,
        description: value.description,
        price: value.price,
        featured: !!value.featured,
        icon: value.icon,
        items: value.items ?? [],
      };
    }
    return {
      slug: '',
      name: { es: '', en: '' },
      description: { es: '', en: '' },
      price: { eur: 0 },
      featured: false,
      icon: undefined,
      items: [],
    };
  }, [value]);

  const [data, setData] = useState<FormValue>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogo de donaciones para armar el contenido
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDon, setLoadingDon] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingDon(true);
      const res = await fetch('/api/admin/donations', { cache: 'no-store' });
      const list: Donation[] = await res.json();
      setDonations(list);
      setLoadingDon(false);
    })();
  }, []);

  const mapName = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of donations) m.set(d.id, d.name[lang]);
    return m;
  }, [donations, lang]);

  // autogenerar slug
  useEffect(() => {
    if (!data.slug?.trim() && data.name?.es?.trim()) {
      setData(d => ({ ...d, slug: slugify(d.name.es) }));
    }
  }, [data.name?.es]); // eslint-disable-line

  // edición de items
  const [selDonation, setSelDonation] = useState<string>('');
  const [selQty, setSelQty] = useState<string>('1');

  const addItem = () => {
    if (!selDonation) return;
    const qty = Math.max(1, Number(selQty || 1));
    setData(d => ({ ...d, items: [...(d.items ?? []), { donationId: selDonation, qty }] }));
    setSelDonation('');
    setSelQty('1');
  };
  const removeItem = (idx: number) => {
    setData(d => ({ ...d, items: (d.items ?? []).filter((_, i) => i !== idx) }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const payload: any = {
      slug: data.slug.trim(),
      name: { es: data.name.es?.trim() || '', en: data.name.en?.trim() || '' },
      description: (data.description?.es || data.description?.en)
        ? { es: data.description?.es ?? '', en: data.description?.en ?? '' }
        : undefined,
      price: {
        eur: Number.isFinite(Number(data.price.eur)) ? Number(data.price.eur) : 0,
        ne: numOrUndef(String((data.price as any).ne ?? '')),
        neFake: numOrUndef(String((data.price as any).neFake ?? '')),
      },
      featured: !!data.featured,
      icon: data.icon?.trim() ? data.icon.trim() : undefined,
      items: data.items ?? [],
    };

    if (!payload.slug) return setErr('El slug es obligatorio.');
    if (!payload.name.es || !payload.name.en) return setErr('Completá ambos nombres (ES/EN).');
    if (payload.price.eur < 0 || (payload.price.ne ?? 0) < 0 || (payload.price.neFake ?? 0) < 0) {
      return setErr('Los precios no pueden ser negativos.');
    }

    setBusy(true);
    try {
      const isEdit = !!value?.id;
      const url = isEdit ? `/api/admin/packs/${value!.id}` : '/api/admin/packs';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = 'Error al guardar';
        try {
          const j = await res.json();
          msg = j?.error ? JSON.stringify(j.error) : msg;
        } catch {}
        throw new Error(msg);
      }
      onSaved?.();
    } catch (e: any) {
      setErr(e?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  const itemsPreview = (data.items ?? []).slice(0, 6);
  const remaining = Math.max(0, (data.items?.length ?? 0) - itemsPreview.length);

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="tile-cta">
        <div>
          <div className="kicker">Pack</div>
          <h2 className="section-title">{value ? 'Editar' : 'Nuevo'}</h2>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
              Cancelar
            </button>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : (value ? 'Guardar cambios' : 'Crear')}
          </button>
        </div>
      </div>

      {/* Nombre */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Nombre (ES)</span>
          <input
            className="input"
            value={data.name.es}
            onChange={e => setData(d => ({ ...d, name: { ...d.name, es: e.target.value } }))}
          />
        </label>
        <label className="grid gap-1">
          <span>Name (EN)</span>
          <input
            className="input"
            value={data.name.en}
            onChange={e => setData(d => ({ ...d, name: { ...d.name, en: e.target.value } }))}
          />
        </label>
      </div>

      {/* Slug + Icono */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Slug</span>
          <input
            className="input"
            value={data.slug}
            onChange={e => setData({ ...data, slug: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span>Icono (URL)</span>
          <input
            className="input"
            value={data.icon ?? ''}
            onChange={e => setData({ ...data, icon: e.target.value || undefined })}
            placeholder="https://… /icons/.."
          />
        </label>
      </div>

      {/* Descripción */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Descripción (ES) — opcional</span>
          <textarea
            className="input"
            rows={3}
            value={data.description?.es ?? ''}
            onChange={e =>
              setData(d => ({ ...d, description: { es: e.target.value, en: d.description?.en ?? '' } }))
            }
          />
        </label>
        <label className="grid gap-1">
          <span>Description (EN) — optional</span>
          <textarea
            className="input"
            rows={3}
            value={data.description?.en ?? ''}
            onChange={e =>
              setData(d => ({ ...d, description: { es: d.description?.es ?? '', en: e.target.value } }))
            }
          />
        </label>
      </div>

      {/* Precios + Destacado */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span>Precio EUR</span>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={String(data.price.eur ?? 0)}
            onChange={e => setData({ ...data, price: { ...data.price, eur: Number(e.target.value || 0) } })}
          />
        </label>
        <label className="grid gap-1">
          <span>Precio NE (opcional)</span>
          <input
            className="input"
            type="number"
            min={0}
            step="1"
            value={String(data.price.ne ?? '')}
            onChange={e => setData({ ...data, price: { ...data.price, ne: numOrUndef(e.target.value) } })}
          />
        </label>
        <label className="grid gap-1">
          <span>Precio NEF (opcional)</span>
          <input
            className="input"
            type="number"
            min={0}
            step="1"
            value={String(data.price.neFake ?? '')}
            onChange={e => setData({ ...data, price: { ...data.price, neFake: numOrUndef(e.target.value) } })}
          />
        </label>
        <label className="grid gap-1">
          <span>Destacado</span>
          <select
            className="input admin-select"
            value={data.featured ? '1' : '0'}
            onChange={e => setData({ ...data, featured: e.target.value === '1' })}
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </label>
      </div>

      {/* Contenido del pack */}
      <div className="grid gap-2">
        <span>Contenido del pack</span>
        <div className="grid md:grid-cols-2 gap-2">
          <select
            className="input admin-select"
            value={selDonation}
            onChange={e => setSelDonation(e.target.value)}
            disabled={loadingDon}
          >
            <option value="">{loadingDon ? 'Cargando donaciones…' : 'Seleccionar ítem'}</option>
            {donations.map(d => (
              <option key={d.id} value={d.id}>
                {d.name[lang]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              className="input w-[120px]"
              type="number"
              min={1}
              value={selQty}
              onChange={e => setSelQty(e.target.value)}
              placeholder="Cantidad"
            />
            <button type="button" className="btn btn-ghost" onClick={addItem} disabled={!selDonation}>
              Añadir
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          {(data.items ?? []).map((it, idx) => {
            const label = mapName.get(it.donationId) ?? `(ID: ${it.donationId})`;
            return (
              <div key={`${it.donationId}-${idx}`} className="flex items-center justify-between p-2 rounded border border-[var(--stroke)]">
                <div className="truncate">
                  <strong className="truncate">{label}</strong>
                  {it.qty != null && <span className="chip ml-2">×{it.qty}</span>}
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => removeItem(idx)}>
                  Quitar
                </button>
              </div>
            );
          })}
          {(data.items?.length ?? 0) === 0 && <span className="note">— vacío —</span>}
        </div>

        {/* Preview rápido de nombres */}
        {(data.items?.length ?? 0) > 0 && (
          <div className="note mt-1">
            Vista previa: {(data.items ?? [])
              .map(it => mapName.get(it.donationId) ?? it.donationId)
              .slice(0, maxPreviewNames)
              .join(', ')}
            {(data.items!.length > maxPreviewNames) ? '…' : ''}
          </div>
        )}
      </div>

      {err && <div className="we-warning">{err}</div>}
    </form>
  );
}
