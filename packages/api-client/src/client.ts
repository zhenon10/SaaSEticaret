export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export function createApiClient(baseUrl: string, defaultHeaders?: Record<string, string>) {
  async function request<T>(path: string, options: RequestOptions = {}, _retry = true): Promise<T> {
    const { body, params, headers, ...rest } = options;

    let url = `${baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      const queryString = qs.toString();
      if (queryString) url += `?${queryString}`;
    }

    const res = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(defaultHeaders ?? {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string>),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && _retry && path !== '/auth/refresh') {
      const refreshed = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...(defaultHeaders ?? {}) },
      });
      if (refreshed.ok) {
        return request<T>(path, options, false);
      }
    }

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      let errorBody: unknown;
      try {
        errorBody = await res.json();
        errorMessage = (errorBody as { error?: string })?.error ?? errorMessage;
      } catch {
        errorMessage = await res.text().catch(() => errorMessage);
      }
      throw new ApiError(res.status, errorMessage, errorBody);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    get:    <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
    post:   <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'POST', body }),
    put:    <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'PUT', body }),
    delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
    request,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
