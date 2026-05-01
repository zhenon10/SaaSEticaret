import type { ApiClient } from '../client';
import type { LoginRequest, WebLoginResponse, UserInfo, RefreshRequest } from '../types';

export function createAuthService(client: ApiClient) {
  return {
    login: (data: LoginRequest) =>
      client.post<WebLoginResponse>('/auth/login', data),

    refresh: (data?: RefreshRequest) =>
      client.post<void>('/auth/refresh', data ?? {}),

    logout: () =>
      client.post<void>('/auth/logout'),

    me: () =>
      client.get<UserInfo>('/auth/me'),
  };
}
