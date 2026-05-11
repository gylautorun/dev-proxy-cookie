import type { IncomingMessage } from 'http';
import { CookieReader, CookieWatcher, watchCookieFile } from '../utils';

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
        proxyReq.setHeader('Cookie', cookie);
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

export function createFileCookieGetter(cookieFile: string): () => string {
  const reader = new CookieReader({ cookieFile });
  let currentCookie = reader.readCookie();

  const watcher = watchCookieFile(
    cookieFile,
    (newCookie) => {
      currentCookie = newCookie;
      console.log('[CookieFile] Updated:', newCookie ? '(has cookie)' : '(empty)');
    },
    (error) => {
      console.error('[CookieFile] Watch error:', error.message);
    }
  );

  return () => currentCookie;
}

export interface AutoProxyConfigOptions extends VueProxyConfigOptions {
  target: string;
  ignorePaths?: string[];
  includePaths?: string[];
  additionalProxies?: Record<string, string>;
}

export function createAutoProxyConfig(options: AutoProxyConfigOptions): Record<string, ProxyConfig> {
  const { target, ignorePaths = [], includePaths = [], additionalProxies = {}, getCookie, debug, headers } = options;

  const defaultProxy: ProxyConfig = {
    ws: false,
    target,
    changeOrigin: true,
    secure: false,
    headers,
    onProxyReq: (proxyReq: any, req: IncomingMessage) => {
      const reqPath = req.url || '/';
      
      if (includePaths.length > 0) {
        if (!includePaths.some(path => reqPath.startsWith(path))) {
          return;
        }
      } else {
        if (ignorePaths.some(path => reqPath.startsWith(path))) {
          return;
        }
      }
      
      const cookie = getCookie ? getCookie() : '';
      if (cookie) {
        proxyReq.setHeader('Cookie', cookie);
      }
      if (debug) {
        console.log('[Proxy Request]', reqPath, req.method, cookie ? '(with cookie)' : '(no cookie)');
      }
    },
    onError: (err: Error) => {
      console.error('\n[Proxy Error]', err.message);
    },
  };

  const result: Record<string, ProxyConfig> = {
    '/': defaultProxy,
  };

  for (const [proxyPath, proxyTarget] of Object.entries(additionalProxies)) {
    result[proxyPath] = createVueProxyConfig(proxyTarget, { getCookie, debug, headers });
  }

  return result;
}