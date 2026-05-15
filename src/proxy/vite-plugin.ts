/**
 * Vite 自动代理插件模块
 * 
 * 提供完整的 Vite 代理功能，集成 AutoProxyCookie 核心模块，
 * 支持 HTTP 和 WebSocket 代理，并自动注入 Cookie。
 * 
 * @module vite-plugin
 */
import type { Plugin, ViteDevServer } from 'vite';
import { AutoProxyCookie, createAutoProxyCookie, type AutoProxyCookieOptions } from './core';

/**
 * Vite 自动代理 Cookie 插件配置选项
 */
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

/**
 * 获取 Vite 开发服务器的 HTTP Server 实例
 * 兼容不同版本的 Vite API
 * @param server - Vite 开发服务器实例
 * @returns HTTP Server 实例或 null
 */
function getHttpServer(server: ViteDevServer): any {
  if ('httpServer' in server && server.httpServer) {
    return server.httpServer;
  }
  if ('_server' in server && server._server) {
    return server._server;
  }
  return null;
}

/**
 * 创建 Vite 自动代理 Cookie 插件
 * 
 * @param options - 插件配置选项
 * @returns Vite 插件对象
 */
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