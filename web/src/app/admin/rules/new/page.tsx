'use client';

import { useRouter } from 'next/navigation';
import RuleForm from '../RuleForm';

export default function AdminRuleNewPage() {
    const router = useRouter();
    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 880 }}>
                <div className="tile">
                    <RuleForm
                        onCancel={() => router.push('/admin/rules')}
                        onSaved={() => router.push('/admin/rules')}
                    />
                </div>
            </div>
        </section>
    );
}
