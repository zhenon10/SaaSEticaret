import { createSaaSClient } from '@saas/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5052';
const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'tenant1';

export const api = createSaaSClient(baseUrl, tenantSlug);
