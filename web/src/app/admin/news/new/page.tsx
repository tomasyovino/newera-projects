'use client';

import { useRouter } from 'next/navigation';
import NewForm from '../NewForm';

export default function AdminNewNewPage() {
  const router = useRouter();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="tile">
          <NewForm
            onCancel={() => router.push('/admin/news')}
            onSaved={() => router.push('/admin/news')}
          />
        </div>
      </div>
    </section>
  );
}
