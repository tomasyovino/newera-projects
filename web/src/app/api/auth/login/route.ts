import { NextRequest, NextResponse } from 'next/server';

function getAdminCreds() {
  const user =
    process.env.ADMIN_USERNAME ||
    process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
    process.env.ADMIN_USER;

  const pass =
    process.env.ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    process.env.ADMIN_PASS;

  return { user, pass };
}

export async function POST(req: NextRequest) {
  const { user, pass } = getAdminCreds();
  if (!user || !pass) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 });
  }

  let username = '';
  let password = '';

  const ctype = req.headers.get('content-type') || '';
  if (ctype.includes('form')) {
    const fd = await req.formData();
    username = String(fd.get('username') ?? '');
    password = String(fd.get('password') ?? '');
  } else {
    try {
      const json = await req.json();
      username = json?.username ?? '';
      password = json?.password ?? '';
    } catch {}
  }

  if (username !== user || password !== pass) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/admin';

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set('ne_admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === 'production',
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
