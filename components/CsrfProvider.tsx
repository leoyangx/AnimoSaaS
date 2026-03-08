'use client';

import { useEffect, createContext, useContext, useRef } from 'react';

// Global CSRF state shared across all components
let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf');
  const data = await res.json();
  csrfToken = data.csrfToken as string;
  return csrfToken!;
}

export function getCsrfToken(): Promise<string> {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (!csrfPromise) {
    csrfPromise = fetchCsrfToken().finally(() => {
      csrfPromise = null;
    });
  }
  return csrfPromise;
}

export function clearCsrfToken() {
  csrfToken = null;
}

/**
 * Provider component that initializes CSRF token on mount
 * and patches global fetch to auto-include CSRF header on mutations.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const patched = useRef(false);

  useEffect(() => {
    // Fetch CSRF token immediately
    getCsrfToken().catch(() => {});

    // Patch global fetch to auto-include CSRF header for mutations
    if (!patched.current) {
      patched.current = true;
      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        const method = (init?.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const token = await getCsrfToken();
          const headers = new Headers(init?.headers);
          if (!headers.has('x-csrf-token')) {
            headers.set('x-csrf-token', token);
          }
          init = { ...init, headers };
        }
        const res = await originalFetch(input, init);
        // If CSRF validation fails, refresh and retry once
        if (res.status === 403) {
          const body = await res.clone().json().catch(() => null);
          if (body?.error?.includes('CSRF')) {
            clearCsrfToken();
            const newToken = await getCsrfToken();
            const headers = new Headers(init?.headers);
            headers.set('x-csrf-token', newToken);
            return originalFetch(input, { ...init, headers });
          }
        }
        return res;
      };
    }
  }, []);

  return <>{children}</>;
}
