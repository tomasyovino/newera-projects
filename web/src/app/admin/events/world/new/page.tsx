'use client';

import { useRouter } from 'next/navigation';
import EventForm from '../EventForm';

export default function NewWorldEventPage() {
  const router = useRouter();

  return (
    <section className="section">
      <div className="container" style={{maxWidth: 880}}>
        <div className="tile">
          <div className="kicker">Eventos de mundo</div>
          <h2 className="section-title">Nuevo</h2>

          <EventForm
            submitLabel="Crear"
            onSubmit={async (data) => {
              const res = await fetch('/api/admin/world-events', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (!res.ok) throw new Error('No se pudo crear');
              router.push('/admin/events/world');
            }}
          />
        </div>
      </div>
    </section>
  );
}
