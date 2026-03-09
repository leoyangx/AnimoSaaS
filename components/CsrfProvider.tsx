'use client';

import { useEffect, useRef } from 'react';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Read the csrf_token cookie value directly from document.cookie.
 */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + CSRF_COOKIE_NAME + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Write the csrf_token cookie from JavaScript.
 * This guarantees the cookie is set regardless of whether the
 * server's Set-Cookie header was processed by the browser.
 */
function writeCsrfCookie(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    CSRF_COOKIE_NAME +
    '=' +
    encodeURIComponent(token) +
    '; path=/; max-age=3600; SameSite=Lax' +
    secure;
}

/**
 * Fetch /api/csrf to get a fresh token, then write it to
 * document.cookie ourselves (belt-and-suspenders).
 */
async function refreshCsrfCookie(
  rawFetch: typeof window.fetch
): Promise<string> {
  const res = await rawFetch('/api/csrf', { credentials: 'same-origin' });
  const data = await res.json();
  const token = data.csrfToken as string;
  // Set the cookie from JS — don't rely on Set-Cookie header alone
  writeCsrfCookie(token);
  return token;
}

/**
 * Provider component that patches global fetch to auto-include
 * X-CSRF-Token header on mutation requests.
 *
 * Strategy: always read the token from document.cookie so the header
 * value is guaranteed to equal the cookie the browser sends.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const patched = useRef(false);

  useEffect(() => {
    if (patched.current) return;
    patched.current = true;

    const originalFetch = window.fetch;

    // Seed the cookie immediately
    refreshCsrfCookie(originalFetch).catch(() => {});

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      const method = (init?.method || 'GET').toUpperCase();

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        let token = readCsrfCookie();
        if (!token) {
          // Cookie missing — fetch + write, then re-read
          await refreshCsrfCookie(originalFetch);
          token = readCsrfCookie();
        }
        if (token) {
          const headers = new Headers(init?.headers);
          if (!headers.has(CSRF_HEADER_NAME)) {
            headers.set(CSRF_HEADER_NAME, token);
          }
          init = { ...init, headers };
        }
      }

      const res = await originalFetch(input, init);

      // If CSRF validation still fails, refresh cookie and retry once
      if (res.status === 403) {
        const body = await res.clone().json().catch(() => null);
        if (body?.error?.includes?.('CSRF')) {
          await refreshCsrfCookie(originalFetch);
          const token = readCsrfCookie();
          if (token) {
            const headers = new Headers(init?.headers);
            headers.set(CSRF_HEADER_NAME, token);
            return originalFetch(input, { ...init, headers });
          }
        }
      }

      return res;
    };
  }, []);

  return <>{children}</>;
}
