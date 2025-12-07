'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { WorldEvent } from '@/lib/types';

export default function AdminWorldList() {
  const [items, setItems] = useState<WorldEvent[] | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/world-events', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar');
      setItems(await res.json());
    } catch {
      setItems([]);
    }
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar evento de mundo?')) return;
    await fetch(`/api/admin/world-events/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <section className="section">
      <div className="container">
        <div className="tile">
          <div className="tile-cta">
            <div>
              <div className="kicker">Eventos de mundo</div>
              <h2 className="section-title">Listado</h2>
            </div>
            <Link className="btn btn-primary" href="/admin/events/world/new">+ Nuevo</Link>
          </div>

          {!items
            ? <div className="note mt-2">Cargando…</div>
            : items.length === 0
              ? <div className="note mt-2">No hay eventos todavía.</div>
              : (
                <div className="mt-3 grid gap-2">
                  {items.map(ev => {
                    const now = Date.now();
                    const s = Date.parse(ev.startsAt);
                    const e = Date.parse(ev.endsAt);
                    const state = now < s ? 'upcoming' : now > e ? 'finished' : 'live';
                    const stateLabel = state === 'live'
                      ? 'En curso'
                      : state === 'upcoming'
                      ? 'Próximo'
                      : 'Finalizado';
                    return (
                      <div key={ev.id} className="list-soft">
                        <div className="flex items-center justify-between p-2">
                          <div className="flex flex-col">
                            <strong>{ev.name.es} <span style={{color:'var(--muted)'}}>/ {ev.name.en}</span></strong>
                            <span className="note">
                              {new Date(ev.startsAt).toLocaleString()} → {new Date(ev.endsAt).toLocaleString()} · {stateLabel}{ev.featured?' · ★':''}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link className="btn btn-ghost" href={`/admin/events/world/${ev.id}`}>Editar</Link>
                            <button className="btn btn-ghost" onClick={() => onDelete(ev.id)}>Eliminar</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          }
        </div>
      </div>
    </section>
  );
}
