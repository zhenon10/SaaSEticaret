import type { ApiClient } from '../client';
import type { RegisterRequest, LoginRequest, WebLoginResponse, UserInfo, RefreshRequest, UpdateProfileRequest, ChangeEmailRequest, ChangePasswordRequest } from '../types';

export function createAuthService(client: ApiClient) {
  return {
    register: (data: RegisterRequest) =>
      client.post<WebLoginResponse>('/auth/register', data),

    login: (data: LoginRequest) =>
      client.post<WebLoginResponse>('/auth/login', data),

    refresh: (data?: RefreshRequest) =>
      client.post<void>('/auth/refresh', data ?? {}),

    logout: () =>
      client.post<void>('/auth/logout'),

    me: () =>
      client.get<UserInfo>('/auth/me'),

    updateProfile: (data: UpdateProfileRequest) =>
      client.put<UserInfo>('/auth/me', data),

    changeEmail: (data: ChangeEmailRequest) =>
      client.put<{ message: string }>('/auth/me/email', data),

    changePassword: (data: ChangePasswordRequest) =>
      client.put<{ message: string }>('/auth/me/password', data),
  };
}
