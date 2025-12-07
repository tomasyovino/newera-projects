'use client';

import { useRouter } from 'next/navigation';
import PackForm from '../PackForm';

export default function AdminPackNewPage() {
  const router = useRouter();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="tile">
          <PackForm
            onCancel={() => router.push('/admin/packs')}
            onSaved={() => router.push('/admin/packs')}
          />
        </div>
      </div>
    </section>
  );
}
