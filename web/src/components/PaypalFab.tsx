'use client';

import Image from 'next/image';
import type { Locale } from '@/lib/types';
import { NEXT_PUBLIC_PAYPAL_URL } from '@/lib/constants';

export default function PaypalFab({ lang }: { lang: Locale }) {
  const href = NEXT_PUBLIC_PAYPAL_URL || '#';
  const isDisabled = !NEXT_PUBLIC_PAYPAL_URL;

  return (
    <a
      href={href}
      target={isDisabled ? undefined : '_blank'}
      rel={isDisabled ? undefined : 'noopener noreferrer'}
      className={`fab paypal-fab ${isDisabled ? 'fab-disabled' : ''}`}
      aria-label={lang === 'es' ? 'Abrir PayPal' : 'Open PayPal'}
      title={
        isDisabled
          ? (lang === 'es' ? 'PayPal: pronto' : 'PayPal: coming soon')
          : (lang === 'es' ? 'Abrir PayPal' : 'Open PayPal')
      }
      onClick={e => { if (isDisabled) e.preventDefault(); }}
    >
      <Image src="/images/paypal.svg" alt="" width={28} height={28} aria-hidden />
      <span className="fab-label">PayPal</span>
    </a>
  );
}
