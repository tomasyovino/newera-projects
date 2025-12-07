'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { WeeklyEvent } from '@/lib/types';

const DAYS = [
    { v: 1, es: 'Lunes',    en: 'Monday'    },
    { v: 2, es: 'Martes',   en: 'Tuesday'   },
    { v: 3, es: 'Miércoles',en: 'Wednesday' },
    { v: 4, es: 'Jueves',   en: 'Thursday'  },
    { v: 5, es: 'Viernes',  en: 'Friday'    },
    { v: 6, es: 'Sábado',   en: 'Saturday'  },
    { v: 7, es: 'Domingo',  en: 'Sunday'    },
];

export default function AdminWeeklyList() {
  const [items, setItems] = useState<WeeklyEvent[] | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/weekly-events', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar la lista');
    const data = await res.json();
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar evento?')) return;
    const res = await fetch(`/api/admin/weekly-events/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('No se pudo eliminar');
      return;
    }
    load();
  };

  return (
    <section className="section">
      <div className="container">
        <div className="tile">
          <div className="tile-cta">
            <div>
              <div className="kicker">Eventos semanales</div>
              <h2 className="section-title">Listado</h2>
            </div>
            <Link className="btn btn-primary" href="/admin/events/weekly/new">+ Nuevo</Link>
          </div>

          {!items
            ? <div className="note mt-2">Cargando…</div>
            : items.length === 0
              ? <div className="note mt-2">No hay eventos todavía.</div>
              :
              (
                <div className="mt-3 grid gap-2">
                  {items.map(ev => {
                    const dayNameES = DAYS.find(d => d.v === ev.dayOfWeek)?.es ?? `D${ev.dayOfWeek}`;
                    
                    return (
                      <div key={ev.id} className="list-soft">
                        <div className="flex items-center justify-between p-2">
                          <div className="flex flex-col">
                            <strong>{ev.name.es} <span style={{color:'var(--muted)'}}> / {ev.name.en}</span></strong>
                            <span className="note">
                              {dayNameES} · {ev.times.join(', ')} {ev.featured ? '· ★' : ''}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link className="btn btn-ghost" href={`/admin/events/weekly/${ev.id}`}>Editar</Link>
                            <button className="btn btn-ghost" onClick={() => onDelete(ev.id)}>Eliminar</button>
                          </div>
                        </div>
                      </div>
                  )})}
                </div>
              )
          }
        </div>
      </div>
    </section>
  );
}
