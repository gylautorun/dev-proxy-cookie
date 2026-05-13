import type { IncomingMessage } from 'http';
import * as path from 'path';
import { CookieReader, watchCookieFile } from '../utils';
import { applyDevCookieHeader } from './apply-dev-cookie-header';

/** Options for {@link createFileCookieGetter}. */
export interface CreateFileCookieGetterOptions {
  /**
   * Watch the file for logging when it changes. Cookie value is always read from disk on each proxy request,
   * so you do not need a dev-server restart when this is false.
   * @default true
   */
  watch?: boolean;
  /** Log when the cookie file changes (only if `watch` is true). @default false */
  debug?: boolean;
}

export interface VueProxyConfigOptions {
  getCookie?: () => string;
  debug?: boolean;
  headers?: Record<string, string>;
  ws?: boolean;
  changeOrigin?: boolean;
  secure?: boolean;
  onError?: (err: Error) => void;
}

export interface ProxyConfig {
  ws: boolean;
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  onProxyReq: (proxyReq: any, req: IncomingMessage) => void;
  onProxyRes?: (proxyRes: any, req: IncomingMessage) => void;
  onError: (err: Error) => void;
  headers?: Record<string, string>;
}

export function createVueProxyConfig(
  target: string,
  options: VueProxyConfigOptions = {}
): ProxyConfig {
  const {
    getCookie,
    debug = false,
    headers = {},
    ws = false,
    changeOrigin = true,
    secure = false,
    onError: customOnError,
  } = options;

  const config: ProxyConfig = {
    ws,
    target,
    changeOrigin,
    secure,
    headers,
    onProxyReq: (proxyReq: any, req: IncomingMessage) => {
      const cookie = getCookie ? getCookie() : '';
      if (cookie) {
        applyDevCookieHeader(proxyReq, cookie);
      }
      if (debug) {
        const reqPath = req.url || '/';
        console.log('[Proxy Request]', reqPath, req.method, cookie ? '(with cookie)' : '(no cookie)');
      }
    },
    onError: customOnError || ((err: Error) => {
      console.error('\n[Proxy Error]', err.message);
    }),
  };

  return config;
}

export function createFileCookieGetter(
  cookieFile: string,
  options: CreateFileCookieGetterOptions = {}
): () => string {
  const { watch = true, debug = false } = options;
  const reader = new CookieReader({ cookieFile: path.resolve(cookieFile) });

  if (watch) {
    watchCookieFile(
      path.resolve(cookieFile),
      (newCookie) => {
        if (debug) {
          console.log('[CookieFile] Updated:', newCookie ? '(has cookie)' : '(empty)');
        }
      },
      (error) => {
        console.error('[CookieFile] Watch error:', error.message);
      }
    );
  }

  return () => reader.readCookie();
}

export interface AutoProxyConfigOptions extends VueProxyConfigOptions {
  target: string;
  ignorePaths?: string[];
  includePaths?: string[];
  additionalProxies?: Record<string, string>;
}

export function createAutoProxyConfig(options: AutoProxyConfigOptions): Record<string, ProxyConfig> {
  const { target, ignorePaths = [], includePaths = [], additionalProxies = {}, getCookie, debug, headers } = options;

  const result: Record<string, ProxyConfig> = {};

  if (includePaths.length > 0) {
    for (const proxyPath of includePaths) {
      result[proxyPath] = createVueProxyConfig(target, { getCookie, debug, headers });
    }
  } else {
    const defaultProxy: ProxyConfig = {
      ws: false,
      target,
      changeOrigin: true,
      secure: false,
      headers,
      onProxyReq: (proxyReq: any, req: IncomingMessage) => {
        const reqPath = req.url || '/';

        if (ignorePaths.some(p => reqPath.startsWith(p))) {
          return;
        }

        const cookie = getCookie ? getCookie() : '';
        if (cookie) {
          applyDevCookieHeader(proxyReq, cookie);
        }
        if (debug) {
          console.log('[Proxy Request]', reqPath, req.method, cookie ? '(with cookie)' : '(no cookie)');
        }
      },
      onError: (err: Error) => {
        console.error('\n[Proxy Error]', err.message);
      },
    };
    result['/'] = defaultProxy;
  }

  for (const [proxyPath, proxyTarget] of Object.entries(additionalProxies)) {
    result[proxyPath] = createVueProxyConfig(proxyTarget, { getCookie, debug, headers });
  }

  return result;
}
