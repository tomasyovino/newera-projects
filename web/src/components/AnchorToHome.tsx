'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AnchorToHome({
  lang,
  hash,
  className,
  children,
}: {
  lang: 'es' | 'en';
  hash: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const homeHref = `/${lang}#${hash}`;
  const hashHref = `#${hash}`;

  return isHome ? (
    <a href={hashHref} className={className}>{children}</a>
  ) : (
    <Link href={homeHref} className={className} prefetch={false}>
      {children}
    </Link>
  );
}
