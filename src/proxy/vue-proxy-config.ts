import type { IncomingMessage } from 'http';
import * as path from 'path';
import { CookieReader, watchCookieFile, shouldEnableWatch } from '../utils';
import { applyDevCookieHeader } from './apply-dev-cookie-header';

/** Options for {@link createFileCookieGetter}. */
export interface CreateFileCookieGetterOptions {
  /**
   * 是否监听文件变化
   * - true: 始终监听
   * - false: 从不监听
   * - 'auto': 根据环境自动判断（默认）
   * 
   * Cookie 值每次代理请求时都会从磁盘读取，因此即使 watch 为 false，
   * 修改 cookie 文件后也不需要重启开发服务器。
   * @default 'auto'
   */
  watch?: boolean | 'auto';
  /** Log when the cookie file changes (only if `watch` is true). @default false */
  debug?: boolean;
  /** 
   * 自定义生产环境变量名称列表，用于判断是否禁用监听
   * 例如: ['MY_APP_ENV', 'BUILD_TYPE']
   */
  productionEnvs?: string[];
  /**
   * 是否为开发环境（优先级最高）
   * 设置此参数后，将直接决定是否启用文件监听：
   * - true: 启用监听（开发模式）
   * - false: 禁用监听（生产模式）
   * 
   * 使用示例: isDev: process.env.NODE_ENV === 'development'
   */
  isDev?: boolean;
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
  const { 
    watch = 'auto', 
    debug = false,
    productionEnvs = [],
    isDev 
  } = options;
  const reader = new CookieReader({ cookieFile: path.resolve(cookieFile) });

  // 判断是否应该启用监听
  // isDev 参数优先级最高，直接决定是否启用监听
  let shouldWatch: boolean;
  
  if (isDev !== undefined) {
    // 用户显式设置了 isDev 参数
    shouldWatch = isDev;
    if (debug) {
      console.log(`[CookieFile] isDev=${isDev}, ${shouldWatch ? 'enabling' : 'disabling'} watch`);
    }
  } else {
    // 使用智能环境检测
    shouldWatch = shouldEnableWatch(watch, productionEnvs, debug, '[CookieFile]');
  }
  
  if (shouldWatch) {
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
  } else if (debug) {
    console.log('[CookieFile] File watch disabled');
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
