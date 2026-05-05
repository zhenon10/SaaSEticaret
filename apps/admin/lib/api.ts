import { createSaaSClient } from '@saas/api-client';

// Client-side calls go through the same-origin proxy which forwards
// the ad_at cookie server-side — avoids cross-domain cookie issues.
const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052')
  : '/api/proxy';

export const api = createSaaSClient(baseUrl);
