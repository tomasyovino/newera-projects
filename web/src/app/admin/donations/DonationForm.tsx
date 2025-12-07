'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Donation, DonationCategory, DonationScope, LocalizedString } from '@/lib/types';

type FormValue = Omit<Donation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

const CATEGORIES: { v: DonationCategory; label: string }[] = [
  { v: 'item', label: 'Objetos' },
  { v: 'stat_boost', label: 'Mejora de Personaje' },
  { v: 'land_mine', label: 'Minas' },
  { v: 'land_house', label: 'Casas' },
  { v: 'mount', label: 'Monturas' },
  { v: 'currency_ne', label: 'Moneda NE' },
  { v: 'currency_ne_fake', label: 'Moneda NE Falsificada' },
];

const SCOPES: { v: DonationScope; label: string }[] = [
  { v: 'personal', label: 'Personal' },
  { v: 'clan', label: 'Clan' },
  { v: 'both', label: 'Ambos' },
];

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

export default function DonationForm({
  value,
  onCancel,
  onSaved,
}: {
  value?: Donation;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();

  const initial: FormValue = useMemo<FormValue>(() => {
    if (value) {
      return {
        id: value.id,
        slug: value.slug,
        name: value.name,
        description: value.description,
        category: value.category,
        scope: value.scope,
        price: value.price,
        featured: !!value.featured,
        icon: value.icon,
        isSpecial: !!value.isSpecial,
        showItem: !!value.showItem,
        metadata: value.metadata,
      };
    }
    const nowIso = new Date().toISOString(); // no lo enviamos, es sólo para el tipo
    return {
      slug: '',
      name: { es: '', en: '' },
      description: { es: '', en: '' } as LocalizedString,
      category: 'item',
      scope: 'personal',
      price: { eur: 0, ne: undefined, neFake: undefined },
      featured: false,
      icon: undefined,
      isSpecial: false,
      showItem: true,
      metadata: undefined,
    };
  }, [value]);

  const [data, setData] = useState<FormValue>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // autogenerar slug desde el nombre ES si está vacío
  useEffect(() => {
    if (!data.slug?.trim() && data.name?.es?.trim()) {
      setData((d) => ({ ...d, slug: slugify(d.name.es) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.name?.es]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Normalizar payload
    const payload: any = {
      slug: data.slug.trim(),
      name: {
        es: data.name.es?.trim() || '',
        en: data.name.en?.trim() || '',
      },
      description: (data.description?.es || data.description?.en)
        ? { es: data.description?.es ?? '', en: data.description?.en ?? '' }
        : undefined,
      category: data.category,
      scope: data.scope,
      price: {
        eur: Number.isFinite(Number(data.price.eur)) ? Number(data.price.eur) : 0,
        ne: numOrUndef(String((data.price as any).ne ?? '')),
        neFake: numOrUndef(String((data.price as any).neFake ?? '')),
      },
      featured: !!data.featured,
      icon: data.icon?.trim() ? data.icon.trim() : undefined,
      isSpecial: !!data.isSpecial,
      showItem: !!data.showItem,
      metadata: data.metadata ?? undefined,
    };

    // Validaciones mínimas de UX (el backend igual valida con Zod)
    if (!payload.slug) return setErr('El slug es obligatorio.');
    if (!payload.name.es || !payload.name.en) return setErr('Completá ambos nombres (ES/EN).');
    if (!payload.category) return setErr('Seleccioná la categoría.');
    if (!payload.scope) return setErr('Seleccioná el ámbito.');
    if (payload.price.eur < 0 || (payload.price.ne ?? 0) < 0 || (payload.price.neFake ?? 0) < 0) {
      return setErr('Los precios no pueden ser negativos.');
    }

    setBusy(true);
    try {
      const isEdit = !!value?.id;
      const url = isEdit ? `/api/admin/donations/${value!.id}` : '/api/admin/donations';
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="tile-cta">
        <div>
          <div className="kicker">Donación</div>
          <h2 className="section-title">{value ? 'Editar' : 'Nueva'}</h2>
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
            onChange={(e) => setData((d) => ({ ...d, name: { ...d.name, es: e.target.value } }))}
          />
        </label>
        <label className="grid gap-1">
          <span>Name (EN)</span>
          <input
            className="input"
            value={data.name.en}
            onChange={(e) => setData((d) => ({ ...d, name: { ...d.name, en: e.target.value } }))}
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
            onChange={(e) => setData({ ...data, slug: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span>Icono (URL o path)</span>
          <input
            className="input"
            value={data.icon ?? ''}
            onChange={(e) => setData({ ...data, icon: e.target.value || undefined })}
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
            onChange={(e) =>
              setData((d) => ({
                ...d,
                description: { es: e.target.value, en: d.description?.en ?? '' },
              }))
            }
          />
        </label>
        <label className="grid gap-1">
          <span>Description (EN) — optional</span>
          <textarea
            className="input"
            rows={3}
            value={data.description?.en ?? ''}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                description: { es: d.description?.es ?? '', en: e.target.value },
              }))
            }
          />
        </label>
      </div>

      {/* Categoría / Ámbito */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span>Categoría</span>
          <select
            className="input admin-select"
            value={data.category}
            onChange={(e) => setData({ ...data, category: e.target.value as DonationCategory })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span>Ámbito</span>
          <select
            className="input admin-select"
            value={data.scope}
            onChange={(e) => setData({ ...data, scope: e.target.value as DonationScope })}
          >
            {SCOPES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span>Destacado</span>
            <select
              className="input admin-select"
              value={data.featured ? '1' : '0'}
              onChange={(e) => setData({ ...data, featured: e.target.value === '1' })}
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Especial</span>
            <select
              className="input admin-select"
              value={data.isSpecial ? '1' : '0'}
              onChange={(e) => setData({ ...data, isSpecial: e.target.value === '1' })}
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Visible</span>
            <select
              className="input admin-select"
              value={data.showItem ? '1' : '0'}
              onChange={(e) => setData({ ...data, showItem: e.target.value === '1' })}
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </label>
        </div>
      </div>

      {/* Precios */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span>Precio EUR</span>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={String(data.price.eur ?? 0)}
            onChange={(e) =>
              setData({ ...data, price: { ...data.price, eur: Number(e.target.value || 0) } })
            }
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
            onChange={(e) =>
              setData({
                ...data,
                price: { ...data.price, ne: numOrUndef(e.target.value) },
              })
            }
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
            onChange={(e) =>
              setData({
                ...data,
                price: { ...data.price, neFake: numOrUndef(e.target.value) },
              })
            }
          />
        </label>
      </div>

      {err && <div className="we-warning">{err}</div>}
    </form>
  );
}
