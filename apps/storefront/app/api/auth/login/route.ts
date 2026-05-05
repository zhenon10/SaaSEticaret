import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

const NAME_MAP: Record<string, string> = {
  st_at: 'st_at', st_rt: 'st_rt',
  ad_at: 'st_at', ad_rt: 'st_rt',
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const response = NextResponse.json(data);

  for (const raw of apiRes.headers.getSetCookie?.() ?? []) {
    const parts = raw.split(';').map((s) => s.trim());
    const eqIdx = parts[0].indexOf('=');
    const apiName = parts[0].slice(0, eqIdx);
    const value = parts[0].slice(eqIdx + 1);
    const targetName = NAME_MAP[apiName];
    if (!targetName) continue;
    response.headers.append('Set-Cookie', [targetName + '=' + value, ...parts.slice(1)].join('; '));
  }

  return response;
}
