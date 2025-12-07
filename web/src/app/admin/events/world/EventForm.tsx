'use client';

import { useState } from 'react';
import type { WorldEvent, LocalizedString } from '@/lib/types';
import { worldEventsCreateSchema } from '@/app/api/_utils/worldEventSchemas';

type Payload = Omit<WorldEvent, 'id'> & { id?: string };

const emptyLS = (v?: Partial<LocalizedString>): LocalizedString => ({
  es: v?.es ?? '', en: v?.en ?? '',
});

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toISO = (local: string) => new Date(local).toISOString();

function ListEditor({
  label, value, onChange,
}: {
  label: string;
  value: LocalizedString[];
  onChange: (next: LocalizedString[]) => void;
}) {
  const [es, setEs] = useState(''); const [en, setEn] = useState('');
  const add = () => {
    if (!es.trim() && !en.trim()) return;
    onChange([...value, { es: es.trim(), en: en.trim() }]);
    setEs(''); setEn('');
  };
  const del = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div className="grid gap-2">
      <span>{label}</span>
      <div className="grid md:grid-cols-2 gap-2">
        <input className="input" placeholder="ES…" value={es} onChange={e => setEs(e.target.value)} />
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="EN…" value={en} onChange={e => setEn(e.target.value)} />
          <button type="button" className="btn btn-ghost" onClick={add}>Añadir</button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {value.map((ls, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded border border-[var(--stroke)]">
            <div>
              <div><strong>ES:</strong> {ls.es}</div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}><strong>EN:</strong> {ls.en}</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => del(i)}>Eliminar</button>
          </div>
        ))}
        {value.length === 0 && <span className="note">— vacío —</span>}
      </div>
    </div>
  );
}

export default function EventForm({
  initial, onSubmit, submitLabel = 'Guardar',
}: {
  initial?: WorldEvent;
  onSubmit: (data: Payload) => Promise<void>;
  submitLabel?: string;
}) {
  const [data, setData] = useState<Payload>(() => initial ?? {
    name: { es: '', en: '' },
    description: { es: '', en: '' },
    headline: undefined,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: undefined,
    featured: false,
    banner: undefined,
    highlights: [],
    rewards: [],
    warnings: [],
    sphereStartCmd: '',
    sphereEndCmd: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const payload: Payload = {
      ...data,
      banner: (data.banner && data.banner.trim().length ? data.banner.trim() : undefined),
      highlights: data.highlights ?? [],
      rewards: data.rewards ?? [],
      warnings: data.warnings ?? [],
      sphereStartCmd: data.sphereStartCmd?.trim() ? data.sphereStartCmd.trim() : undefined,
      sphereEndCmd: data.sphereEndCmd?.trim() ? data.sphereEndCmd.trim() : undefined,
    };

    try {
      worldEventsCreateSchema.parse(payload);
    } catch (e: any) {
      setErr('Revisá los campos. ' + (e?.issues?.[0]?.message ?? ''));
      return;
    }
    setBusy(true);
    try {
      await onSubmit(payload);
    } catch (e: any) {
      setErr(e?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Títulos */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Nombre (ES)</span>
          <input className="input" value={data.name.es}
            onChange={e => setData(d => ({ ...d, name: { es: e.target.value, en: d.name.en } }))} />
        </label>
        <label className="grid gap-1">
          <span>Name (EN)</span>
          <input className="input" value={data.name.en}
            onChange={e => setData(d => ({ ...d, name: { es: d.name.es, en: e.target.value } }))} />
        </label>
      </div>

      {/* Headline opcional */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Headline (ES) — opcional</span>
          <input className="input" value={data.headline?.es ?? ''}
            onChange={e => setData(d => ({ ...d, headline: emptyLS({ ...d.headline, es: e.target.value }) }))} />
        </label>
        <label className="grid gap-1">
          <span>Headline (EN) — optional</span>
          <input className="input" value={data.headline?.en ?? ''}
            onChange={e => setData(d => ({ ...d, headline: emptyLS({ ...d.headline, en: e.target.value }) }))} />
        </label>
      </div>

      {/* Descripción */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Descripción (ES)</span>
          <textarea className="input" rows={3} value={data.description?.es ?? ''}
            onChange={e => setData(d => ({ ...d, description: { es: e.target.value, en: d.description?.en ?? '' } }))} />
        </label>
        <label className="grid gap-1">
          <span>Description (EN)</span>
          <textarea className="input" rows={3} value={data.description?.en ?? ''}
            onChange={e => setData(d => ({ ...d, description: { es: d.description?.es ?? '', en: e.target.value } }))} />
        </label>
      </div>

      {/* Ubicación opcional */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Ubicación (ES) — opcional</span>
          <input className="input" value={data.location?.es ?? ''}
            onChange={e => setData(d => ({ ...d, location: emptyLS({ ...d.location, es: e.target.value }) }))} />
        </label>
        <label className="grid gap-1">
          <span>Location (EN) — optional</span>
          <input className="input" value={data.location?.en ?? ''}
            onChange={e => setData(d => ({ ...d, location: emptyLS({ ...d.location, en: e.target.value }) }))} />
        </label>
      </div>

      {/* Fechas y featured */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span>Inicio</span>
          <input className="input" type="datetime-local"
            value={toLocalInput(data.startsAt)}
            onChange={e => setData({ ...data, startsAt: toISO(e.target.value) })} />
        </label>
        <label className="grid gap-1">
          <span>Fin</span>
          <input className="input" type="datetime-local"
            value={toLocalInput(data.endsAt)}
            onChange={e => setData({ ...data, endsAt: toISO(e.target.value) })} />
        </label>
        <label className="grid gap-1">
          <span>Destacado</span>
          <select className="input admin-select" value={data.featured ? '1' : '0'}
            onChange={e => setData({ ...data, featured: e.target.value === '1' })}>
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </label>
      </div>

      {/* Banner (URL opcional) */}
      <label className="grid gap-1">
        <span>Banner (URL — opcional)</span>
        <input
          className="input"
          placeholder="https://…/banner.webp"
          value={data.banner ?? ''}
          onChange={e => setData({ ...data, banner: e.target.value })}
        />
      </label>

      {/* Listas: highlights / rewards / warnings */}
      <ListEditor
        label="Puntos destacados"
        value={data.highlights ?? []}
        onChange={next => setData({ ...data, highlights: next })}
      />
      <ListEditor
        label="Recompensas"
        value={data.rewards ?? []}
        onChange={next => setData({ ...data, rewards: next })}
      />
      <ListEditor
        label="Advertencias"
        value={data.warnings ?? []}
        onChange={next => setData({ ...data, warnings: next })}
      />

      {/* Comandos Sphere */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Comando Sphere al iniciar (opcional)</span>
          <input
            className="input"
            placeholder=".addnpc orc ... / script ..."
            value={data.sphereStartCmd ?? ''}
            onChange={e => setData(d => ({ ...d, sphereStartCmd: e.target.value }))}
          />
          <span className="note text-xs">
            Se ejecuta cuando comienza el evento (startsAt).
          </span>
        </label>
        <label className="grid gap-1">
          <span>Comando Sphere al finalizar (opcional)</span>
          <input
            className="input"
            placeholder="comando para limpiar / cerrar evento"
            value={data.sphereEndCmd ?? ''}
            onChange={e => setData(d => ({ ...d, sphereEndCmd: e.target.value }))}
          />
          <span className="note text-xs">
            Se ejecuta cuando termina el evento (endsAt).
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary w-[160px] justify-center" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </div>

      {err && <div className="we-warning">{err}</div>}
    </form>
  );
}
