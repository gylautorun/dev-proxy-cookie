/**
 * Vite 中间件代理插件模块
 * 
 * 提供基于中间件的 Vite 代理功能，支持自动注入 Cookie。
 * 此实现使用 http-proxy 直接处理请求，确保 Cookie 正确注入。
 * 
 * @module vite-middleware-plugin
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { CookieReader } from '../utils/cookie-reader';
import { applyDevCookieHeader } from './apply-dev-cookie-header';
import { applyDevAuthentications, type AuthenticationItem } from './apply-dev-authentications';

/**
 * Vite 中间件代理 Cookie 插件配置选项
 */
export interface ViteMiddlewareProxyOptions {
  /** Cookie 文件路径， 使用文件方便监听cookie 变化，避免手动启动更新 */
  cookieFile: string;
  /** 默认代理目标地址 */
  target: string;
  /** 是否启用调试日志 */
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
  /** 
   * 代理路径映射表
   * 键：路径前缀，值：代理目标地址
   */
  proxyMap?: Record<string, string>;
  /** 
   * 需要代理的路径前缀列表（使用默认 target）
   */
  proxyPaths?: string[];
  /** 
   * 需要忽略的路径前缀列表（不代理）
   */
  ignorePaths?: string[];
}

/**
 * 判断路径是否应该被忽略（不代理）
 */
function isIgnoredPath(pathname: string, ignorePaths: string[]): boolean {
  return ignorePaths.some(ignored => pathname.startsWith(ignored));
}

/**
 * 判断路径是否应该被代理
 */
function shouldProxy(pathname: string, proxyPrefixes: string[]): boolean {
  return proxyPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * 获取代理目标地址
 */
function getProxyTarget(pathname: string, proxyMap: Record<string, string>, defaultTarget: string): string {
  for (const [prefix, target] of Object.entries(proxyMap)) {
    if (pathname.startsWith(prefix)) {
      return target;
    }
  }
  return defaultTarget;
}

/**
 * 创建 Vite 中间件代理 Cookie 插件
 * 
 * @param options - 插件配置选项
 * @returns Vite 插件对象
 */
export function viteMiddlewareProxy(options: ViteMiddlewareProxyOptions): any {
  const {
    cookieFile,
    target,
    debug = false,
    useCookie = true,
    authentications = [],
    proxyMap = {},
    proxyPaths = [],
    ignorePaths = [],
  } = options;

  // 创建 Cookie 读取器
  const cookieReader = new CookieReader({ cookieFile }, debug);
  let currentCookie = '';

  // 如果启用 Cookie，读取初始 Cookie
  if (useCookie) {
    currentCookie = cookieReader.readCookie();
  }

  // 合并所有代理路径前缀
  const allProxyPrefixes = [
    ...Object.keys(proxyMap),
    ...proxyPaths,
  ];

  return {
    name: 'vite-middleware-proxy',
    apply: 'serve',

    configureServer(server: any) {
      // 延迟加载 http-proxy 以避免启动时的兼容性问题
      const httpProxy = require('http-proxy');
      const proxyServer = httpProxy.createProxyServer({});

      // 监听 Cookie 文件变化
      if (useCookie && debug) {
        console.log('[ViteMiddlewareProxy] Watching cookie file:', cookieFile);
      }

      // 添加中间件
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;

        // 检查是否需要忽略
        if (isIgnoredPath(pathname, ignorePaths)) {
          if (debug) {
            console.log('[ViteMiddlewareProxy] Ignoring:', pathname);
          }
          next();
          return;
        }

        // 检查是否需要代理
        if (!shouldProxy(pathname, allProxyPrefixes)) {
          next();
          return;
        }

        // 获取代理目标
        const proxyTarget = getProxyTarget(pathname, proxyMap, target);

        if (debug) {
          console.log('[ViteMiddlewareProxy] Proxying:', req.method, pathname, '->', proxyTarget);
        }

        // 代理请求
        proxyServer.web(req, res, {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ignorePath: false,
        });
      });

      // 代理请求前的回调 - 注入 Cookie 和自定义鉴权信息
      proxyServer.on('proxyReq', (proxyReq: any, req: IncomingMessage) => {
        if (useCookie) {
          currentCookie = cookieReader.readCookie();

          if (currentCookie) {
            if (debug) {
              console.log('[ViteMiddlewareProxy] Injecting cookie:', `(length: ${currentCookie.length})`);
            }
            applyDevCookieHeader(proxyReq, currentCookie);
          } else if (debug) {
            console.log('[ViteMiddlewareProxy] Cookie file is empty');
          }
        } else if (debug) {
          console.log('[ViteMiddlewareProxy] useCookie is false, skipping cookie injection');
        }

        if (authentications && authentications.length > 0) {
          applyDevAuthentications(proxyReq, authentications);
          if (debug) {
            console.log('[ViteMiddlewareProxy] Injecting authentications:', JSON.stringify(authentications));
          }
        }
      });

      // 错误处理
      proxyServer.on('error', (err: Error, req: IncomingMessage) => {
        console.error('[ViteMiddlewareProxy] Proxy error:', err.message, 'for', req.url);
      });
    },
  };
}

export default viteMiddlewareProxy;
