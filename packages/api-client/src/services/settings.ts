import type { ApiClient } from '../client';

export function createSettingsService(client: ApiClient) {
  return {
    getAll: () =>
      client.get<Record<string, string>>('/site-settings'),

    update: (settings: Record<string, string>) =>
      client.put<Record<string, string>>('/site-settings', settings),
  };
}
