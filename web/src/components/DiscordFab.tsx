'use client';

import Image from 'next/image';
import type { Locale } from '@/lib/types';
import { NEXT_PUBLIC_DISCORD_URL } from '@/lib/constants';

export default function DiscordFab({ lang }: { lang: Locale }) {
  const href = NEXT_PUBLIC_DISCORD_URL || '#';
  const isDisabled = !NEXT_PUBLIC_DISCORD_URL;

  return (
    <a
      href={href}
      target={isDisabled ? undefined : '_blank'}
      rel={isDisabled ? undefined : 'noopener noreferrer'}
      className={`fab discord-fab ${isDisabled ? 'fab-disabled' : ''}`}
      aria-label={lang === 'es' ? 'Abrir discord' : 'Open discord'}
      title={
        isDisabled
          ? (lang === 'es' ? 'Discord: pronto' : 'Discord: coming soon')
          : (lang === 'es' ? 'Abrir discord' : 'Open discord')
      }
      onClick={e => { if (isDisabled) e.preventDefault(); }}
    >
      {/* Asegúrate de que guide.svg use fill="currentColor" (o lo hiciste antes) */}
      <Image src="/images/discord.svg" alt="" width={22} height={22} aria-hidden />
      <span className="fab-label">{lang === 'es' ? 'Discord' : 'Discord'}</span>
    </a>
  );
}
