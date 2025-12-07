'use client';

import { useRouter } from 'next/navigation';
import EventForm from '../EventForm';

export default function NewWeeklyEventPage() {
  const router = useRouter();

  return (
    <section className="section">
      <div className="container" style={{maxWidth: 820}}>
        <div className="tile">
          <div className="kicker">Eventos semanales</div>
          <h2 className="section-title">Nuevo evento</h2>

          <EventForm
            submitLabel="Crear"
            onSubmit={async (data) => {
              const res = await fetch('/api/admin/weekly-events', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (!res.ok) throw new Error('No se pudo crear');
              router.push('/admin/events/weekly');
            }}
          />
        </div>
      </div>
    </section>
  );
}
