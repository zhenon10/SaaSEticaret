import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';
const SECURE = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Proxy-Request': '1' },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { accessToken, refreshToken, user } = data;

  const response = NextResponse.json({ user });

  response.cookies.set('st_at', accessToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: SECURE ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  response.cookies.set('st_rt', refreshToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: SECURE ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
