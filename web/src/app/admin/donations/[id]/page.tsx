'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DonationForm from '../DonationForm';
import type { Donation } from '@/lib/types';

export default function AdminDonationEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Donation | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/donations/${params.id}`, { cache: 'no-store' });
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
          <DonationForm
            value={item}
            onCancel={() => router.push('/admin/donations')}
            onSaved={() => router.push('/admin/donations')}
          />
        </div>
      </div>
    </section>
  );
}
