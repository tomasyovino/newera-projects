import { NextResponse, NextRequest } from 'next/server';

const SUPPORTED = new Set(['es', 'en']);
const FALLBACK = 'es';

function detectLang(req: NextRequest): string {
  const c = req.cookies.get('lang')?.value;
  if (c && SUPPORTED.has(c)) return c;

  const al = req.headers.get('accept-language') ?? '';
  const first = al.split(',')[0]?.trim().toLowerCase();
  if (first?.startsWith('es')) return 'es';
  if (first?.startsWith('en')) return 'en';

  return FALLBACK;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const lang = detectLang(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}`;
    const res = NextResponse.redirect(url);
    res.cookies.set('lang', lang, { path: '/', sameSite: 'lax' });
    return res;
  }

  const protects =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin/');

  if (!protects) return NextResponse.next();

  const hasCookie = req.cookies.get('ne_admin')?.value === '1';
  if (hasCookie) return NextResponse.next();

  if (pathname.startsWith('/api/admin/')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*', '/api/admin/:path*'],
};
