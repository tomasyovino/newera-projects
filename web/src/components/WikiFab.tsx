'use client';

import Image from 'next/image';
import type { Locale } from '@/lib/types';
import { NEXT_PUBLIC_WIKI_URL } from '@/lib/constants';

export default function WikiFab({ lang }: { lang: Locale }) {
  const href = NEXT_PUBLIC_WIKI_URL || '#';
  const isDisabled = !NEXT_PUBLIC_WIKI_URL;

  return (
    <a
      href={href}
      target={isDisabled ? undefined : '_blank'}
      rel={isDisabled ? undefined : 'noopener noreferrer'}
      className={`fab wiki-fab ${isDisabled ? 'fab-disabled' : ''}`}
      aria-label={lang === 'es' ? 'Abrir wiki' : 'Open wiki'}
      title={
        isDisabled
          ? (lang === 'es' ? 'Wiki: pronto' : 'Wiki: coming soon')
          : (lang === 'es' ? 'Abrir wiki' : 'Open wiki')
      }
      onClick={e => { if (isDisabled) e.preventDefault(); }}
    >
      <Image src="/images/guide.svg" alt="" width={22} height={22} aria-hidden />
      <span className="fab-label">{lang === 'es' ? 'Wiki' : 'Wiki'}</span>
    </a>
  );
}
