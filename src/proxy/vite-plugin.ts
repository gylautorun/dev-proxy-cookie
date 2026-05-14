import type { Plugin, ViteDevServer } from 'vite';
import { AutoProxyCookie, createAutoProxyCookie, type AutoProxyCookieOptions } from './core';

export interface ViteAutoProxyCookiePluginOptions extends AutoProxyCookieOptions {
  name?: string;
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
    isDev,
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
        isDev,
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