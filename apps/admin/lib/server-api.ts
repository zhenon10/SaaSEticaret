import { cookies } from 'next/headers';
import { createSaaSClient } from '@saas/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

export async function getServerApi() {
  const jar   = await cookies();
  const token = jar.get('ad_at')?.value;
  // Referer başlığı backend'e bu isteğin admin panelinden geldiğini bildirir
  // (backend ad_at cookie'sini tanımak için Origin/Referer'dan admin tespiti yapar)
  return createSaaSClient(
    baseUrl,
    token ? { Cookie: `ad_at=${token}`, Referer: 'http://localhost:3001/' } : undefined,
  );
}
