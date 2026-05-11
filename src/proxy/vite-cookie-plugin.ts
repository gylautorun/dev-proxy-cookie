import type { Plugin, ViteDevServer } from 'vite';
import { CookieReader, CookieWatcher, watchCookieFile } from '../utils';

export interface ViteDevProxyCookieOptions {
  cookieFile: string;
  debug?: boolean;
  onCookieChange?: (cookie: string) => void;
}

export function viteDevProxyCookie(options: ViteDevProxyCookieOptions): Plugin {
  const { cookieFile, debug = false, onCookieChange } = options;
  let watcher: CookieWatcher | null = null;
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
    },

    closeBundle() {
      watcher?.stop();
    },
  };
}