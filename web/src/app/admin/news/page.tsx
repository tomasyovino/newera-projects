'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { New } from '@/lib/types';

export default function AdminNewsPage() {
  const [items, setItems] = useState<New[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/news', { cache: 'no-store' });
      if(!res.ok) {
        setItems([])
      } else {
        const data = await res.json();
        setItems(data);
      }
      
    } catch (error) {
      setItems([])
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(n => {
      const hay = [
        n.slug,
        n.title.es, n.title.en,
        n.excerpt?.es ?? '', n.excerpt?.en ?? '',
        n.body.es, n.body.en,
        (n.tags ?? []).join(' ')
      ].join(' ').toLowerCase();
      return hay.includes(t);
    });
  }, [items, q]);

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar la novedad?')) return;
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    reload();
  };

  return (
    <div className="container py-8">
      <h1 className="section-title">Admin · Novedades</h1>

      <div className="tile mt-4">
        <div className="tile-cta">
          <div className="flex gap-2 flex-wrap">
            <input
              className="input"
              placeholder="Buscar por título, texto o tag…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <Link className="btn btn-primary" href="/admin/news/new">+ Nuevo</Link>
        </div>

        {loading ? (
          <div className="note mt-2">Cargando…</div>
        ) : (
          <div className="mt-2 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                  <th>Título (ES)</th>
                  <th>Título (EN)</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>★</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => {
                  const published = n.publishedAt ? new Date(n.publishedAt) : null;
                  const estado = !n.publishedAt
                    ? 'Borrador'
                    : (Date.now() < Date.parse(n.publishedAt) ? 'Programada' : 'Publicada');
                  const fecha = n.publishedAt
                    ? new Date(n.publishedAt).toLocaleString()
                    : '—';
                  return (
                    <tr key={n.id}>
                      <td>{n.title.es}</td>
                      <td>{n.title.en}</td>
                      <td style={{ color: 'var(--muted)' }}>{n.slug}</td>
                      <td>{estado}</td>
                      <td>{fecha}</td>
                      <td>{n.featured ? '★' : ''}</td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link className="btn btn-ghost" href={`/admin/news/${n.id}`}>Editar</Link>
                          <button className="btn btn-ghost" onClick={() => onDelete(n.id)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ color: 'var(--muted)', padding: '8px 0' }}>Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
