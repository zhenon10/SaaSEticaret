import { cookies } from 'next/headers';
import { createSaaSClient } from '@saas/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

export async function getServerApi() {
  const cookieStore = await cookies();
  const token = cookieStore.get('st_at')?.value;
  const defaultHeaders: Record<string, string> = token
    ? { Cookie: `st_at=${token}` }
    : {};
  return createSaaSClient(baseUrl, defaultHeaders);
}
