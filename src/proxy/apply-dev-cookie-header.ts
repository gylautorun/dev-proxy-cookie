/**
 * Replace outbound Cookie with the dev file cookie.
 * Browsers send `Cookie` when `withCredentials` is true; merging with file cookie often yields duplicate
 * names (e.g. two JSESSIONID) and many servers honor the first value — the stale browser session.
 */
export function applyDevCookieHeader(
  proxyReq: { removeHeader(name: string): void; setHeader(name: string, value: string): void },
  cookie: string
): void {
  if (!cookie) return;
  proxyReq.removeHeader('cookie');
  proxyReq.removeHeader('Cookie');
  proxyReq.setHeader('Cookie', cookie);
}
