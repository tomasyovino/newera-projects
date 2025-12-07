'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Rule } from '@/lib/types';

export default function AdminRulesPage() {
    const [items, setItems] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [onlyActive, setOnlyActive] = useState<'all' | 'active' | 'inactive'>('all');

    const reload = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/rules', { cache: 'no-store' });
        const data = await res.json();
        setItems(data);
        setLoading(false);
    };

    useEffect(() => { reload(); }, []);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        let base = items;
        if (onlyActive !== 'all') {
            base = base.filter(r => onlyActive === 'active' ? r.active : !r.active);
        }
        if (!t) return base;
        return base.filter(r => {
            const hay = [
                r.slug,
                r.title.es, r.title.en,
                r.category ?? '',
                (r.tags ?? []).join(' '),
                r.body.es, r.body.en,
            ].join(' ').toLowerCase();
            return hay.includes(t);
        });
    }, [items, q, onlyActive]);

    const onDelete = async (id: string) => {
        if (!confirm('¿Eliminar la regla?')) return;
        await fetch(`/api/admin/rules/${id}`, { method: 'DELETE' });
        reload();
    };

    return (
        <div className="container py-8">
            <h1 className="section-title">Admin · Reglas</h1>

            <div className="tile mt-4">
                <div className="tile-cta">
                    <div className="flex gap-2 flex-wrap">
                        <input
                            className="input"
                            placeholder="Buscar por título, texto, categoría o tag…"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                        <select
                            className="input admin-select"
                            value={onlyActive}
                            onChange={e => setOnlyActive(e.target.value as any)}
                        >
                            <option value="all">Todas</option>
                            <option value="active">Sólo activas</option>
                            <option value="inactive">Sólo inactivas</option>
                        </select>
                    </div>
                    <Link className="btn btn-primary" href="/admin/rules/new">+ Nueva</Link>
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
                                    <th>Categoría</th>
                                    <th>Orden</th>
                                    <th>Activa</th>
                                    <th>Actualizada</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.title.es}</td>
                                        <td>{r.title.en}</td>
                                        <td style={{ color: 'var(--muted)' }}>{r.slug}</td>
                                        <td>{r.category ?? '—'}</td>
                                        <td>{r.sort}</td>
                                        <td>{r.active ? 'Sí' : 'No'}</td>
                                        <td>{new Date(r.updatedAt).toLocaleString()}</td>
                                        <td className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Link className="btn btn-ghost" href={`/admin/rules/${r.id}`}>Editar</Link>
                                                <button className="btn btn-ghost" onClick={() => onDelete(r.id)}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} style={{ color: 'var(--muted)', padding: '8px 0' }}>
                                            Sin resultados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
