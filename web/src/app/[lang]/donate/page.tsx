import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Locale } from '@/lib/types';
import { getDonations, getPacks } from '@/lib/data-source';
import { DonationBrowser } from '@/components';

function dict(lang: Locale) {
  const p = path.join(process.cwd(), 'i18n', `${lang}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export default async function DonatePage({ params }: { params: { lang: string } }) {
  const lang = (params.lang === 'en' ? 'en' : 'es') as Locale;
  const d = dict(lang);
  const items = await getDonations();
  const packs = await getPacks();

  return (
    <section className="section">
      <div className="container">
        <div className="tile">
          <div className="tile-cta">
            <div>
              <div className="kicker">{lang==='es' ? 'Donaciones' : 'Donations'}</div>
              <h1 className="section-title">
                {lang==='es' ? 'Apoya el servidor' : 'Support the server'}
              </h1>
              <p className="mt-2" style={{color:'var(--muted)'}}>
                {lang==='es'
                  ? 'Las donaciones ayudan al mantenimiento, soporte y desarrollo de New Era.'
                  : 'Donations help maintain, support and develop New Era.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <DonationBrowser items={items} packs={packs} lang={lang} />
        </div>
      </div>
    </section>
  );
}
