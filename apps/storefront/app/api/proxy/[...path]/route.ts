import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const apiPath = path.join('/');

  const url = new URL(`${API_URL}/${apiPath}`);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const cookieStore = await cookies();
  const token = cookieStore.get('st_at')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const body = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  const apiRes = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  });

  const resBody = await apiRes.arrayBuffer();

  return new NextResponse(resBody, {
    status: apiRes.status,
    headers: {
      'Content-Type': apiRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;
export const PATCH  = handler;
