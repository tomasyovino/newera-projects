'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import type { New, Locale } from '@/lib/types';

export default function FloatingNews({
    items,
    lang,
    max = 4,
}: { items: New[]; lang: Locale; max?: number }) {
    const [isDesktop, setIsDesktop] = useState(true);
    useEffect(() => {
        const mql = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setIsDesktop(mql.matches);
        onChange();
        mql.addEventListener?.('change', onChange);
        return () => mql.removeEventListener?.('change', onChange);
    }, []);

    const [open, setOpen] = useState(true);
    const latest = useMemo(() => items.slice(0, max), [items, max]);
    if (!isDesktop || latest.length === 0) return null;

    const GOLD = '#f5d06f';
    const GOLD_SOFT = 'rgba(245,208,111,.12)';
    const GOLD_SOFTER = 'rgba(245,208,111,.06)';
    const GOLD_BORDER = 'rgba(245,208,111,.25)';
    const GOLD_GLOW = '0 0 36px rgba(245,208,111,.12)';

    return (
        <div
            style={{
                position: 'absolute',
                right: 24,
                top: 24,
                zIndex: 5,
                pointerEvents: 'none',
            }}
        >
            {/* Panel */}
            <div
                aria-live="polite"
                style={{
                    pointerEvents: 'auto',
                    width: 360,
                    maxWidth: 'calc(100vw - 48px)',
                    borderRadius: 16,
                    background: 'rgba(18,18,22,0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow:
                        `0 18px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04) inset, ${GOLD_GLOW}`,
                    border: `1px solid ${GOLD_BORDER}`,
                    transform: open ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(.96)',
                    opacity: open ? 1 : 0,
                    transition: 'opacity .25s ease, transform .25s ease',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    className="tile-cta"
                    style={{
                        padding: '12px 14px',
                        background: `linear-gradient(180deg, ${GOLD_SOFT}, rgba(0,0,0,0))`,
                        borderBottom: `1px solid ${GOLD_BORDER}`,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <span
                                className="kicker"
                                style={{
                                    margin: 0,
                                    letterSpacing: '.08em',
                                    color: GOLD,
                                    textShadow: '0 0 12px rgba(245,208,111,.25)',
                                }}
                            >
                                {lang === 'es' ? 'NOVEDADES' : 'NEWS'}
                            </span>

                            {/* chip dorado */}
                            <span
                                className="chip"
                                style={{
                                    marginLeft: 'auto',
                                    background: GOLD_SOFT,
                                    border: `1px solid ${GOLD_BORDER}`,
                                    color: GOLD,
                                }}
                            >
                                {latest.length}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <Link
                                href={`/${lang}/news`}
                                className="btn btn-ghost btn-sm"
                                style={{ borderColor: GOLD_BORDER, display: open ? "block" : "none" }}
                            >
                                {lang === 'es' ? 'Ver todo' : 'See all'}
                            </Link>

                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setOpen(false)}
                                aria-label={lang === 'es' ? 'Cerrar novedades' : 'Close news'}
                                title={lang === 'es' ? 'Cerrar' : 'Close'}
                                style={{ borderColor: GOLD_BORDER, display: open ? "block" : "none" }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div style={{ display: 'grid', gap: 8, padding: 12 }}>
                    {latest.map((n) => (
                        <Link
                            key={n.id}
                            href={`/${lang}/news/${n.slug}`}
                            className="list-soft"
                            style={{
                                display: open ? 'flex' : "none",
                                gap: 10,
                                alignItems: 'stretch',
                                padding: 8,
                                borderRadius: 12,
                                background: GOLD_SOFTER,
                                border: `1px solid ${GOLD_BORDER}`,
                            }}
                        >
                            {n.cover && (
                                <Image
                                    src={n.cover}
                                    alt={n.title[lang]}
                                    width={64}
                                    height={64}
                                    className="rounded object-cover"
                                    style={{ flex: '0 0 64px' }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: GOLD, fontSize: 12 }}>
                                    {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString()}
                                </div>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        lineHeight: 1.15,
                                        marginTop: 2,
                                        marginBottom: 2,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical' as any,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {n.title[lang]}
                                </div>
                                {n.excerpt?.[lang] && (
                                    <div
                                        style={{
                                            color: 'var(--muted)',
                                            fontSize: 13,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical' as any,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {n.excerpt[lang]}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Botón de reabrir (queda en la misma esquina, ya no se “sube” fuera del hero) */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="btn"
                    style={{
                        pointerEvents: 'auto',
                        position: 'absolute',
                        right: 24,
                        top: 24,
                        borderRadius: 999,
                        background: `linear-gradient(180deg, ${GOLD}, #d8a93a)`,
                        color: '#111',
                        border: 'none',
                        boxShadow: `0 10px 24px rgba(0,0,0,.35), ${GOLD_GLOW}`,
                        fontWeight: 700,
                    }}
                    aria-label={lang === 'es' ? 'Abrir novedades' : 'Open news'}
                >
                    {lang === 'es' ? 'Novedades' : 'News'}
                </button>
            )}
        </div>
    );
}
