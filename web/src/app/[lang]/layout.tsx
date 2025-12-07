import '../../styles/global.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { LangSwitch, WikiFab, DiscordFab, AnchorToHome, PaypalFab, CommunityMenu } from '@/components';
import Image from 'next/image';

function t(lang: 'es' | 'en') {
  const p = path.join(process.cwd(), 'i18n', `${lang}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export default function RootLayout({ children, params }: { children: ReactNode; params: { lang: string } }) {
  const lang = (params.lang === 'en' ? 'en' : 'es') as 'es' | 'en';
  const dict = t(lang);

  return (
    <html lang={lang}>
      <head>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/favicon-512.png" />
        <title>{dict.brand}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="bg-scene"></div>
        <div className="bg-dots"></div>
        <div className="vignette"></div>

        {/* Header capsule */}
        <div className="header-wrap">
          <div className="header">
            {/* IZQ: menú/idioma */}
            <div className="flex items-center gap-8">
              <LangSwitch current={lang} />
              {/* nav pills (anchor links) */}
              <nav className="nav">
                <Link href={`/${lang}/news`}>{dict.nav.news}</Link>
                <AnchorToHome lang={lang} hash="events" className="">{dict.nav.events}</AnchorToHome>
                <Link href={`/${lang}/donate`}>{dict.nav.donate}</Link>
                <CommunityMenu lang={lang} />
              </nav>
            </div>

            {/* CENTRO: brand compacto */}
            <Link href={`/${lang}`} className="brand" style={{ color: '#bcd7ff' }}>
              <Image src="/images/logo.png" alt="New Era" width={40} height={40} className="icon-glow" />
            </Link>

            {/* DER: CTA */}
            <AnchorToHome
              lang={lang}
              hash="download"
              className="btn btn-primary w-[120px] justify-center whitespace-nowrap"
            >
              {dict.cta.playDownload}
            </AnchorToHome>
          </div>
        </div>

        <main className="main-pad">
          <div className="container">
            {children}
          </div>
        </main>

        <footer className="container mt-16 py-8 text-sm" id="footer">
          <div style={{ borderTop: '1px solid var(--stroke)', paddingTop: '16px', color: 'var(--muted)' }}>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> New Era
          </div>
        </footer>
        <div className="fab-stack">
          <PaypalFab lang={lang} />
          <DiscordFab lang={lang} />
          <WikiFab lang={lang} />
        </div>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}
