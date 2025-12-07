'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Donation, DonationCategory, DonationScope } from '@/lib/types';
import DonationForm from './DonationForm';

export default function AdminDonationsPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<DonationCategory | ''>('');
  const [scope, setScope] = useState<DonationScope | ''>('');
  const [editing, setEditing] = useState<Donation | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/donations', { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
      } else {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      setItems([]);      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return items.filter(d => {
      if (category && d.category !== category) return false;
      if (scope && !(d.scope === scope || d.scope === 'both')) return false;
      if (q) {
        const t = q.toLowerCase();
        const hit =
          d.name.es.toLowerCase().includes(t) ||
          d.name.en.toLowerCase().includes(t) ||
          (d.description?.es?.toLowerCase().includes(t) ?? false) ||
          (d.description?.en?.toLowerCase().includes(t) ?? false);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, q, category, scope]);

  return (
    <div className="container py-8">
      <h1 className="section-title">Admin · Donaciones</h1>

      <div className="tile mt-4">
        <div className="tile-cta">
          <div className="flex gap-2 flex-wrap">
            <input className="input" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
            <select className="input admin-select" value={category} onChange={e => setCategory(e.target.value as any)}>
              <option value="">Categoría</option>
              <option value="item">Objetos</option>
              <option value="stat_boost">Mejora de Personaje</option>
              <option value="land_mine">Minas</option>
              <option value="land_house">Casas</option>
              <option value="mount">Monturas</option>
            </select>
            <select className="input admin-select" value={scope} onChange={e => setScope(e.target.value as any)}>
              <option value="">Ámbito</option>
              <option value="personal">Personal</option>
              <option value="clan">Clan</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <Link className="btn btn-primary" href="/admin/donations/new">+ Nuevo</Link>
        </div>

        {loading ? <div className="note mt-2">Cargando…</div> : (
          <div className="mt-2 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ textAlign:'left', color:'var(--muted)' }}>
                  <th>Nombre (ES)</th>
                  <th>Nombre (EN)</th>
                  <th>Categoría</th>
                  <th>Ámbito</th>
                  <th>EUR</th>
                  <th>NE</th>
                  <th>NEF</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>{d.name.es}</td>
                    <td>{d.name.en}</td>
                    <td>{d.category}</td>
                    <td>{d.scope}</td>
                    <td>{d.price.eur}</td>
                    <td>{d.price.ne ?? '—'}</td>
                    <td>{d.price.neFake ?? '—'}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link className="btn btn-ghost" href={`/admin/donations/${d.id}`}>Editar</Link>
                        <button className="btn btn-ghost" onClick={async () => {
                          if (!confirm('¿Eliminar donación?')) return;
                          await fetch(`/api/admin/donations/${d.id}`, { method:'DELETE' });
                          reload();
                        }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ color:'var(--muted)', padding:'8px 0' }}>Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="tile mt-4">
          <DonationForm
            value={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); reload(); }}
          />
        </div>
      )}
    </div>
  );
}
