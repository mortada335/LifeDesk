import { RefObject } from 'react';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin fetch wrapper used throughout the app.
 *
 * tokenRef — when provided (from AuthContext), the token is read from the ref
 *            rather than localStorage so there is a single source of truth.
 *            Falls back to localStorage for call-sites outside of React
 *            (e.g. server actions, plain scripts).
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {},
  tokenRef?: RefObject<string | null>,
): Promise<T> {
  // Prefer the in-memory ref; fall back to localStorage only when ref is absent
  const token =
    tokenRef !== undefined
      ? tokenRef.current
      : typeof window !== 'undefined'
        ? localStorage.getItem('lifedesk_token')
        : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorMessage = `HTTP Error ${res.status}`;
    let errorData = null;
    try {
      errorData = await res.json();
      if (errorData.message) {
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message;
      }
    } catch {
      // ignore parse error
    }

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/me')
    ) {
      window.dispatchEvent(new CustomEvent('lifedesk:unauthorized'));
    }
    throw new ApiError(res.status, errorMessage, errorData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
