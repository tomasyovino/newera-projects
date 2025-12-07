import { NextRequest, NextResponse } from 'next/server';

export function requireAdminAuth(req: NextRequest): NextResponse | null {
  const okCookie = req.cookies.get('ne_admin')?.value === '1';
  if (okCookie) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
