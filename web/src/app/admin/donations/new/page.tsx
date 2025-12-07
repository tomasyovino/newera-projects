'use client';

import { useRouter } from 'next/navigation';
import DonationForm from '../DonationForm';

export default function AdminDonationNewPage() {
  const router = useRouter();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="tile">
          <DonationForm
            onCancel={() => router.push('/admin/donations')}
            onSaved={() => router.push('/admin/donations')}
          />
        </div>
      </div>
    </section>
  );
}
