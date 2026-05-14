import type { Plugin, ViteDevServer } from 'vite';
import { CookieReader, watchCookieFile, shouldEnableWatch } from '../utils';

export interface ViteDevProxyCookieOptions {
  cookieFile: string;
  debug?: boolean;
  onCookieChange?: (cookie: string) => void;
  /**
   * 是否监听文件变化
   * - true: 始终监听
   * - false: 从不监听
   * - 'auto': 根据环境自动判断（默认）
   * @default 'auto'
   */
  watch?: boolean | 'auto';
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

export function viteDevProxyCookie(options: ViteDevProxyCookieOptions): Plugin {
  const { cookieFile, debug = false, onCookieChange, watch = 'auto', isDev } = options;
  let watcher: any = null;
  let currentCookie: string = '';

  const cookieReader = new CookieReader({ cookieFile });

  return {
    name: 'vite-dev-proxy-cookie',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      currentCookie = cookieReader.readCookie();
      if (debug) {
        console.log('[vite-dev-proxy-cookie] Initial cookie loaded');
      }

      const middlewares = server.middlewares || 
        (server as any)._middlewares || 
        (server as any).app;

      if (middlewares && typeof middlewares.use === 'function') {
        middlewares.use((req: any, _res: any, next: any) => {
          if (currentCookie && req.url?.startsWith('/')) {
            req.headers = req.headers || {};
            req.headers['cookie'] = currentCookie;
          }
          next();
        });
      } else {
        console.warn('[vite-dev-proxy-cookie] Could not access middleware stack, cookie injection disabled');
      }

      // 判断是否应该启用监听
      // isDev 参数优先级最高
      let shouldWatch: boolean;
      
      if (isDev !== undefined) {
        shouldWatch = isDev;
        if (debug) {
          console.log(`[vite-dev-proxy-cookie] isDev=${isDev}, ${shouldWatch ? 'enabling' : 'disabling'} watch`);
        }
      } else {
        shouldWatch = shouldEnableWatch(watch, [], debug, '[vite-dev-proxy-cookie]');
      }
      
      if (shouldWatch) {
        watcher = watchCookieFile(
          cookieFile,
          (newCookie) => {
            currentCookie = newCookie;
            onCookieChange?.(newCookie);
            console.log('[vite-dev-proxy-cookie] Cookie changed, please restart server for full effect');
          },
          (error) => {
            console.error('[vite-dev-proxy-cookie] Watch error:', error.message);
          }
        );
      } else if (debug) {
        console.log('[vite-dev-proxy-cookie] File watch disabled');
      }
    },

    closeBundle() {
      watcher?.stop();
    },
  };
}
