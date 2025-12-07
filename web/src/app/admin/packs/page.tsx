'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Pack } from '@/lib/types';
import PackForm from './PackForm';

export default function AdminPacksPage() {
  const [items, setItems] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyFeatured, setOnlyFeatured] = useState<'all'|'featured'|'nonfeatured'>('all');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/packs', { cache: 'no-store' });
      if(!res.ok) {
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
    return items.filter(p => {
      if (onlyFeatured === 'featured' && !p.featured) return false;
      if (onlyFeatured === 'nonfeatured' && p.featured) return false;
      if (q) {
        const t = q.toLowerCase();
        const hit =
          p.name.es.toLowerCase().includes(t) ||
          p.name.en.toLowerCase().includes(t) ||
          (p.description?.es?.toLowerCase().includes(t) ?? false) ||
          (p.description?.en?.toLowerCase().includes(t) ?? false);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, q, onlyFeatured]);

  return (
    <div className="container py-8">
      <h1 className="section-title">Admin · Packs</h1>

      <div className="tile mt-4">
        <div className="tile-cta">
          <div className="flex gap-2 flex-wrap">
            <input
              className="input"
              placeholder="Buscar..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <select
              className="input admin-select"
              value={onlyFeatured}
              onChange={e => setOnlyFeatured(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="featured">Solo destacados</option>
              <option value="nonfeatured">Solo NO destacados</option>
            </select>
          </div>

          {/* Podés usar editor embebido o navegar a /new */}
          <div className="flex gap-2">
            <Link className="btn btn-ghost" href="/admin/packs/new">+ Nuevo</Link>
          </div>
        </div>

        {loading ? <div className="note mt-2">Cargando…</div> : (
          <div className="mt-2 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ textAlign:'left', color:'var(--muted)' }}>
                  <th>Nombre (ES)</th>
                  <th>Nombre (EN)</th>
                  <th>EUR</th>
                  <th>NE</th>
                  <th>NEF</th>
                  <th>Items</th>
                  <th>Destacado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.name.es}</td>
                    <td>{p.name.en}</td>
                    <td>{p.price.eur ?? '—'}</td>
                    <td>{p.price.ne ?? '—'}</td>
                    <td>{p.price.neFake ?? '—'}</td>
                    <td>{p.items?.length ?? 0}</td>
                    <td>{p.featured ? 'Sí' : 'No'}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link className="btn btn-ghost" href={`/admin/packs/${p.id}`}>Editar</Link>
                        <button
                          className="btn btn-ghost"
                          onClick={async () => {
                            if (!confirm('¿Eliminar pack?')) return;
                            await fetch(`/api/admin/packs/${p.id}`, { method:'DELETE' });
                            reload();
                          }}
                        >
                          Eliminar
                        </button>
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
    </div>
  );
}
