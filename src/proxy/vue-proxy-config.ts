/**
 * Vue CLI 代理配置模块
 * 
 * 提供 Vue CLI 开发服务器的代理配置功能，支持从文件读取 Cookie 并注入代理请求。
 * 核心函数包括 createFileCookieGetter 和 createVueProxyConfig。
 * 
 * @module vue-proxy-config
 */
import type { IncomingMessage } from 'http';
import * as path from 'path';
import { CookieReader, watchCookieFile, shouldEnableWatch } from '../utils';
import { applyDevCookieHeader } from './apply-dev-cookie-header';
import { applyDevAuthentications, type AuthenticationItem } from './apply-dev-authentications';

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

/**
 * Vue 代理配置选项
 */
export interface VueProxyConfigOptions {
  /** Cookie 获取函数 */
  getCookie?: () => string;
  /** 是否输出调试日志 */
  debug?: boolean;
  /** 
   * 是否使用 Cookie 文件中的 Cookie 注入到请求中
   * - true: 使用文件中的 Cookie（默认）
   * - false: 不注入 Cookie，使用浏览器发送的 Cookie
   * 
   * 当使用账号密码登录时，设置为 false，避免覆盖浏览器的登录 Cookie
   */
  useCookie?: boolean;
  /** 
   * 自定义鉴权信息数组，每个元素是一个键值对对象，会被注入到请求头中
   * 例如: [{ 'ticket': 'xxxx' }, { 'X-Custom-Token': 'yyyy' }]
   */
  authentications?: AuthenticationItem[];
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 是否启用 WebSocket 代理 */
  ws?: boolean;
  /** 是否修改请求头中的 Origin */
  changeOrigin?: boolean;
  /** 是否验证 SSL 证书 */
  secure?: boolean;
  /** 错误回调函数 */
  onError?: (err: Error) => void;
}

/**
 * Vue CLI 代理配置接口
 * 
 * 符合 Vue CLI 代理配置格式的对象结构
 */
export interface ProxyConfig {
  /** 是否启用 WebSocket 代理 */
  ws: boolean;
  /** 代理目标地址 */
  target: string;
  /** 是否修改请求头中的 Origin */
  changeOrigin: boolean;
  /** 是否验证 SSL 证书 */
  secure: boolean;
  /** 代理请求前的回调函数 */
  onProxyReq: (proxyReq: any, req: IncomingMessage) => void;
  /** 代理响应后的回调函数（可选） */
  onProxyRes?: (proxyRes: any, req: IncomingMessage) => void;
  /** 错误处理回调函数 */
  onError: (err: Error) => void;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/**
 * 创建 Vue CLI 代理配置
 * 
 * @param target - 代理目标地址
 * @param options - 配置选项
 * @returns Vue CLI 代理配置对象
 */
export function createVueProxyConfig(
  target: string,
  options: VueProxyConfigOptions = {}
): ProxyConfig {
  const {
    getCookie,
    debug = false,
    useCookie = true,
    authentications = [],
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
      const reqPath = req.url || '/';
      
      if (useCookie) {
        const cookie = getCookie ? getCookie() : '';
        if (cookie) {
          applyDevCookieHeader(proxyReq, cookie);
        }
        if (debug) {
          console.log('[Proxy Request]', reqPath, req.method, cookie ? '(with cookie)' : '(no cookie)');
        }
      } else if (debug) {
        console.log('[Proxy Request]', reqPath, req.method, '(useCookie is false, skipping cookie injection)');
      }

      if (authentications && authentications.length > 0) {
        applyDevAuthentications(proxyReq, authentications);
        if (debug) {
          console.log('[Proxy Request]', reqPath, req.method, '(with authentications)');
        }
      }
    },
    onError: customOnError || ((err: Error) => {
      console.error('\n[Proxy Error]', err.message);
    }),
  };

  return config;
}

/**
 * 创建文件 Cookie 获取器
 * 
 * 从指定文件读取 Cookie 值，支持文件监听功能。
 * 
 * @param cookieFile - Cookie 文件路径
 * @param options - 配置选项
 * @returns Cookie 获取函数
 */
export function createFileCookieGetter(
  cookieFile: string,
  options: CreateFileCookieGetterOptions = {}
): () => string {
  const { 
    watch = 'auto', 
    debug = true,
    productionEnvs = [],
    isDev 
  } = options;
  const reader = new CookieReader({ cookieFile: path.resolve(cookieFile) }, debug);

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

/**
 * 自动代理配置选项
 */
export interface AutoProxyConfigOptions extends VueProxyConfigOptions {
  /** 代理目标地址 */
  target: string;
  /** 忽略的路径列表（不代理这些路径） */
  ignorePaths?: string[];
  /** 包含的路径列表（只代理这些路径） */
  includePaths?: string[];
  /** 额外的代理配置 */
  additionalProxies?: Record<string, string>;
}

/**
 * 创建自动代理配置
 * 
 * 根据配置自动生成 Vue CLI 代理配置对象，支持忽略路径和包含路径两种模式。
 * 
 * @param options - 配置选项
 * @returns Vue CLI 代理配置对象映射
 */
export function createAutoProxyConfig(options: AutoProxyConfigOptions): Record<string, ProxyConfig> {
  const { target, ignorePaths = [], includePaths = [], additionalProxies = {}, getCookie, debug, headers, useCookie = true, authentications = [] } = options;

  const result: Record<string, ProxyConfig> = {};

  if (includePaths.length > 0) {
    for (const proxyPath of includePaths) {
      result[proxyPath] = createVueProxyConfig(target, { getCookie, debug, headers, useCookie, authentications });
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

        if (useCookie) {
          const cookie = getCookie ? getCookie() : '';
          if (cookie) {
            applyDevCookieHeader(proxyReq, cookie);
          }
          if (debug) {
            console.log('[Proxy Request]', reqPath, req.method, cookie ? '(with cookie)' : '(no cookie)');
          }
        } else if (debug) {
          console.log('[Proxy Request]', reqPath, req.method, '(useCookie is false, skipping cookie injection)');
        }

        if (authentications && authentications.length > 0) {
          applyDevAuthentications(proxyReq, authentications);
          if (debug) {
            console.log('[Proxy Request]', reqPath, req.method, '(with authentications)');
          }
        }
      },
      onError: (err: Error) => {
        console.error('\n[Proxy Error]', err.message);
      },
    };
    result['/'] = defaultProxy;
  }

  for (const [proxyPath, proxyTarget] of Object.entries(additionalProxies)) {
    result[proxyPath] = createVueProxyConfig(proxyTarget, { getCookie, debug, headers, useCookie, authentications });
  }

  return result;
}
