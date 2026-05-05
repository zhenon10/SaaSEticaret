import { createSaaSClient } from '@saas/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';

export const api = createSaaSClient(baseUrl, { 'X-Admin-Client': '1' });
