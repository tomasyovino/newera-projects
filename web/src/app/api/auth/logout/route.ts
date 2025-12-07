import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const url = new URL('/admin/login', req.url);
  const res = NextResponse.redirect(url);

  res.cookies.set('ne_admin', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });

  res.headers.set('Cache-Control', 'no-store');
  return res;
}
