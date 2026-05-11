import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';
const SECURE = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Request': '1' },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    const accessToken = data.AccessToken ?? data.accessToken;
    const refreshToken = data.RefreshToken ?? data.refreshToken;
    const user = data.User ?? data.user;
    const role: string = user?.role ?? user?.Role ?? '';

    if (role !== 'Admin' && role !== 'Staff') {
      return NextResponse.json(
        { error: 'Bu hesap yönetici paneline erişim yetkisine sahip değil.' },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ user });

    response.cookies.set('ad_at', accessToken, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SECURE ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    response.cookies.set('ad_rt', refreshToken, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SECURE ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (e) {
    console.error('[admin/login]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
