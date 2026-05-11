import type { Plugin, ViteDevServer } from 'vite';
import { AutoProxyCookie, createAutoProxyCookie, type AutoProxyCookieOptions } from './core';

export interface ViteAutoProxyCookiePluginOptions extends AutoProxyCookieOptions {
  name?: string;
}

function getHttpServer(server: ViteDevServer): any {
  if ('httpServer' in server && server.httpServer) {
    return server.httpServer;
  }
  if ('_server' in server && server._server) {
    return server._server;
  }
  return null;
}

export function viteAutoProxyCookie(options: ViteAutoProxyCookiePluginOptions): Plugin {
  const {
    name = 'vite-auto-proxy-cookie',
    ...autoProxyOptions
  } = options;

  let autoProxy: AutoProxyCookie | null = null;

  return {
    name,
    apply: 'serve',

    async configureServer(server: ViteDevServer) {
      autoProxy = createAutoProxyCookie({
        ...autoProxyOptions,
        debug: options.debug ?? false,
        autoRestart: options.autoRestart ?? true,
      });

      try {
        await autoProxy.setup(server);
      } catch (error) {
        console.error('[vite-auto-proxy-cookie] Failed to setup proxy:', error);
        
        if (options.debug) {
          console.log('[vite-auto-proxy-cookie] Falling back to middleware mode');
        }
      }
    },

    closeBundle() {
      autoProxy?.stop();
    },
  };
}

export { AutoProxyCookie, createAutoProxyCookie };
export type { AutoProxyCookieOptions };