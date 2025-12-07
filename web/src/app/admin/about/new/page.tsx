'use client';

import { useRouter } from 'next/navigation';
import AboutForm from '../AboutForm';

export default function AdminAboutNewPage() {
    const router = useRouter();
    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 880 }}>
                <div className="tile">
                    <AboutForm
                        onCancel={() => router.push('/admin/about')}
                        onSaved={() => router.push('/admin/about')}
                    />
                </div>
            </div>
        </section>
    );
}
