'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NewForm from '../NewForm';
import type { New } from '@/lib/types';

export default function AdminNewEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<New | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/news/${params.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('No encontrado');
        setItem(await res.json());
      } catch (e: any) {
        setErr(e?.message ?? 'No encontrado');
      }
    })();
  }, [params.id]);

  if (err) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="tile">
            <div className="we-warning">{err}</div>
          </div>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="tile">
            <div className="note">Cargando…</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="tile">
          <NewForm
            value={item}
            onCancel={() => router.push('/admin/news')}
            onSaved={() => router.push('/admin/news')}
          />
        </div>
      </div>
    </section>
  );
}
