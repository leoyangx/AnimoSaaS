'use client';

import { useCallback, useEffect, useRef } from 'react';

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf');
  const data = await res.json();
  cachedToken = data.csrfToken as string;
  return cachedToken!;
}

function getCsrfToken(): Promise<string> {
  if (cachedToken) return Promise.resolve(cachedToken);
  if (!tokenPromise) {
    tokenPromise = fetchCsrfToken().finally(() => {
      tokenPromise = null;
    });
  }
  return tokenPromise;
}

/**
 * Hook: returns a fetch wrapper that automatically includes CSRF token.
 * Use for POST/PUT/DELETE requests.
 */
export function useCsrf() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      getCsrfToken().catch(() => {});
    }
  }, []);

  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getCsrfToken();
      const headers = new Headers(options.headers);
      headers.set('x-csrf-token', token);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url, { ...options, headers });
      // If CSRF fails, refresh token and retry once
      if (res.status === 403) {
        const body = await res.clone().json().catch(() => null);
        if (body?.error?.includes('CSRF')) {
          cachedToken = null;
          const newToken = await getCsrfToken();
          headers.set('x-csrf-token', newToken);
          return fetch(url, { ...options, headers });
        }
      }
      return res;
    },
    []
  );

  return { csrfFetch };
}
