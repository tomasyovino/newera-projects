'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function CommunityMenu({ lang }: { lang: 'es' | 'en' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        function onEsc(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, []);

    return (
        <div className="dropdown" ref={ref}>
            <button
                type="button"
                className="dropdown-btn"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
            >
                {lang === 'es' ? 'Comunidad' : 'Community'}
                <span className="caret-small" aria-hidden>▾</span>
            </button>

            {open && (
                <div className="dropdown-menu" role="menu">
                    <Link
                        role="menuitem"
                        href={`/${lang}/rules`}
                        className="dropdown-item"
                        onClick={() => setOpen(false)}
                    >
                        {lang === 'es' ? 'Reglas' : 'Rules'}
                    </Link>
                    <Link
                        role="menuitem"
                        href={`/${lang}/about`}
                        className="dropdown-item"
                        onClick={() => setOpen(false)}
                    >
                        {lang === 'es' ? 'Quiénes somos' : 'About us'}
                    </Link>
                </div>
            )}
        </div>
    );
}
