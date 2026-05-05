import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

export async function POST(request: NextRequest) {
  const cookies = request.headers.get('cookie') ?? '';

  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { cookie: cookies },
  }).catch(() => {});

  const response = NextResponse.json({ ok: true });

  for (const name of ['st_at', 'st_rt']) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' });
  }

  return response;
}
