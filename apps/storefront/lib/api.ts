import { createSaaSClient } from '@saas/api-client';

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052')
  : '/api/proxy';

export const api = createSaaSClient(baseUrl);
