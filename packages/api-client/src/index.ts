export * from './types';
export { createApiClient, ApiError } from './client';
export type { ApiClient } from './client';
export { createAuthService } from './services/auth';
export { createCatalogService } from './services/catalog';
export { createCartService } from './services/cart';
export { createOrderService } from './services/orders';

import { createApiClient } from './client';
import { createAuthService } from './services/auth';
import { createCatalogService } from './services/catalog';
import { createCartService } from './services/cart';
import { createOrderService } from './services/orders';

export function createSaaSClient(baseUrl: string, tenantSlug?: string) {
  const client = createApiClient(baseUrl, tenantSlug);
  return {
    auth:    createAuthService(client),
    catalog: createCatalogService(client),
    cart:    createCartService(client),
    orders:  createOrderService(client),
  };
}

export type SaaSClient = ReturnType<typeof createSaaSClient>;
