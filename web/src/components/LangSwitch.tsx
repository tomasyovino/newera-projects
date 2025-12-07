'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LangSwitch({ current }: { current: 'es'|'en' }) {
    const other = current === 'es' ? 'en' : 'es';
    const [hash, setHash] = useState('');
    useEffect(() => {
        setHash(window.location.hash || '');
    }, []);
    return (
        <Link
            href={`/${other}${hash}`}
            className="btn btn-ghost"
            aria-label={`Switch to ${other.toUpperCase()}`}
        >
            {other.toUpperCase()}
        </Link>
    );
}
