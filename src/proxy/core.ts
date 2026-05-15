/**
 * 自动代理 Cookie 核心模块
 * 
 * 提供完整的开发环境代理解决方案，支持 HTTP 和 WebSocket 代理，
 * 自动从文件读取 Cookie 并注入到代理请求中。
 * 
 * @module core
 */
import * as http from 'http';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ViteDevServer } from 'vite';
import httpProxy from 'http-proxy';
import { CookieReader, CookieWatcher, watchCookieFile } from '../utils';
import { applyDevCookieHeader } from './apply-dev-cookie-header';

/**
 * 错误回调函数类型
 * @param err - 错误对象
 * @param req - 请求对象
 * @param res - 响应对象或 Socket
 */
export type ErrorCallback = (err: Error, req: IncomingMessage, res: ServerResponse | net.Socket) => void;

interface ProxyServer {
  web(req: IncomingMessage, res: ServerResponse, options?: ServerOptions): void;
  ws(req: IncomingMessage, socket: net.Socket, head: Buffer, options?: ServerOptions): void;
  on(event: 'proxyReq', listener: (proxyReq: any, req: IncomingMessage, res: ServerResponse, options: ServerOptions) => void): void;
  on(event: 'proxyRes', listener: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => void): void;
  on(event: 'error', listener: (err: Error, req: IncomingMessage, res: ServerResponse | net.Socket) => void): void;
  on(event: 'wsError', listener: (err: Error, req: IncomingMessage, socket: net.Socket) => void): void;
  close(): void;
}

interface ServerOptions {
  target: string;
  ws?: boolean;
  changeOrigin?: boolean;
  secure?: boolean;
  followRedirects?: boolean;
  autoRewrite?: boolean;
  protocolRewrite?: string;
  cookieDomainRewrite?: false | string | { [oldDomain: string]: string };
  cookiePathRewrite?: false | string | { [oldPath: string]: string };
  headers?: { [header: string]: string };
  ignorePath?: boolean;
}

export interface ProxyHooks {
  onProxyReq?: (proxyReq: any, req: IncomingMessage, res: ServerResponse) => void;
  onProxyRes?: (proxyRes: any, req: IncomingMessage, res: ServerResponse) => void;
  onError?: ErrorCallback;
  onWsError?: (err: Error, req: IncomingMessage, socket: net.Socket) => void;
}

export interface AutoProxyCookieOptions {
  cookieFile: string;
  target: string;
  debug?: boolean;
  autoRestart?: boolean;
  restartMarkerFile?: string;
  proxyMap?: Record<string, string>;
  ignorePaths?: string[];
  ws?: boolean;
  changeOrigin?: boolean;
  secure?: boolean;
  followRedirects?: boolean;
  autoRewrite?: boolean;
  protocolRewrite?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  cookieDomainRewrite?: false | string | { [oldDomain: string]: string };
  cookiePathRewrite?: false | string | { [oldPath: string]: string };
  headers?: { [header: string]: string };
  hooks?: ProxyHooks;
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
 * 自动代理 Cookie 类
 * 
 * 提供完整的开发环境代理解决方案，支持 HTTP 和 WebSocket 代理，
 * 自动从文件读取 Cookie 并注入到代理请求中。
 */
export class AutoProxyCookie {
  /** 合并后的配置选项 */
  private options: AutoProxyCookieOptions & { hooks: Required<ProxyHooks> };
  /** 当前 Cookie 值 */
  private currentCookie: string = '';
  /** Vite 开发服务器实例 */
  private server: ViteDevServer | null = null;
  /** HTTP 代理服务器实例 */
  private proxyServer: ProxyServer | null = null;
  /** Cookie 文件监听器 */
  private watcher: CookieWatcher | null = null;
  /** Cookie 文件读取器 */
  private cookieReader: CookieReader;

  /**
   * 构造函数
   * @param options - 配置选项
   */
  constructor(options: AutoProxyCookieOptions) {
    const defaultHooks: Required<ProxyHooks> = {
      onProxyReq: () => {},
      onProxyRes: () => {},
      onError: () => {},
      onWsError: () => {},
    };

    const mergedOptions = {
      ...options,
      hooks: {
        ...defaultHooks,
        ...(options.hooks || {}),
      },
    };

    this.options = {
      debug: false,
      autoRestart: false,
      restartMarkerFile: '.cookie-restart-marker',
      proxyMap: {},
      ignorePaths: [],
      ws: true,
      changeOrigin: true,
      secure: false,
      followRedirects: true,
      autoRewrite: false,
      protocolRewrite: undefined,
      logLevel: 'info',
      cookieDomainRewrite: '*',
      cookiePathRewrite: false,
      headers: {},
      ...mergedOptions,
    };
    this.cookieReader = new CookieReader({ cookieFile: options.cookieFile });
  }

  /**
   * Cookie 变化处理函数
   * @param newCookie - 新的 Cookie 值
   */
  private handleCookieChange = (newCookie: string): void => {
    if (newCookie !== this.currentCookie) {
      this.currentCookie = newCookie;
      this.log('info', '[AutoProxyCookie] Cookie updated:', newCookie ? '(has cookie)' : '(empty)');

      if (this.options.autoRestart && this.options.restartMarkerFile) {
        const markerPath = path.resolve(this.options.restartMarkerFile);
        fs.writeFileSync(markerPath, JSON.stringify({
          timestamp: Date.now(),
          cookie: newCookie,
        }, null, 2));
        this.log('info', '[AutoProxyCookie] Restart marker written to:', markerPath);
        this.log('info', '[AutoProxyCookie] Please restart the dev server for changes to take effect');
      }
    }
  };

  /**
   * 根据请求路径获取代理目标 URL
   * @param req - HTTP 请求对象
   * @returns 代理目标 URL
   */
  private getProxyUrl(req: IncomingMessage): string {
    const pathname = req.url?.split('?')[0] || '/';
    const proxyMap = this.options.proxyMap || {};

    for (const [prefix, target] of Object.entries(proxyMap)) {
      if (pathname.startsWith(prefix)) {
        return target;
      }
    }

    return this.options.target;
  }

  /**
   * 判断路径是否应该被忽略（不代理）
   * @param pathname - 请求路径
   * @returns 是否忽略
   */
  private isIgnoredPath(pathname: string): boolean {
    const ignorePaths = this.options.ignorePaths || [];
    return ignorePaths.some(ignored =>
      pathname.startsWith(ignored)
    );
  }

  /**
   * 日志输出函数
   * @param level - 日志级别
   * @param args - 日志参数
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]): void {
    const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.options.logLevel || 'info'];
    const msgLevel = levels[level];

    if (msgLevel >= currentLevel) {
      if (level === 'error') {
        console.error(...args);
      } else if (level === 'warn') {
        console.warn(...args);
      } else {
        console.log(...args);
      }
    }
  }

  /**
   * 创建代理服务器配置选项
   * @param target - 代理目标地址
   * @returns 代理服务器配置
   */
  private createProxyOptions(target: string): ServerOptions {
    const {
      ws,
      changeOrigin,
      secure,
      followRedirects,
      autoRewrite,
      protocolRewrite,
      cookieDomainRewrite,
      cookiePathRewrite,
      headers,
    } = this.options;

    return {
      target,
      ws,
      changeOrigin,
      secure,
      followRedirects,
      autoRewrite,
      protocolRewrite,
      cookieDomainRewrite,
      cookiePathRewrite,
      headers: {
        ...headers,
      },
      ignorePath: false,
    };
  }

  /**
   * 代理请求处理函数
   * @param proxyReq - 代理请求对象
   * @param req - 原始请求对象
   * @param res - 响应对象
   * @param _options - 服务器选项
   */
  private handleOnProxyReq = (proxyReq: any, req: IncomingMessage, res: ServerResponse, _options: ServerOptions): void => {
    if (this.currentCookie) {
      applyDevCookieHeader(proxyReq, this.currentCookie);
    }

    this.log('debug', '[AutoProxyCookie] Proxy Request:', req.method, req.url);

    if (this.options.hooks.onProxyReq) {
      try {
        this.options.hooks.onProxyReq(proxyReq, req, res);
      } catch (err) {
        this.log('error', '[AutoProxyCookie] onProxyReq hook error:', (err as Error).message);
      }
    }
  };

  /**
   * 代理响应处理函数
   * @param proxyRes - 代理响应对象
   * @param req - 原始请求对象
   * @param res - 响应对象
   */
  private handleOnProxyRes = (proxyRes: any, req: IncomingMessage, res: ServerResponse): void => {
    const allowedHeaders = [
      'Content-Type',
      'Content-Length',
      'Authorization',
      'Set-Cookie',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
    ];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    this.log('debug', '[AutoProxyCookie] Proxy Response:', req.url, proxyRes.statusCode);

    if (this.options.hooks.onProxyRes) {
      try {
        this.options.hooks.onProxyRes(proxyRes, req, res);
      } catch (err) {
        this.log('error', '[AutoProxyCookie] onProxyRes hook error:', (err as Error).message);
      }
    }
  };

  /**
   * HTTP 代理错误处理函数
   * @param err - 错误对象
   * @param req - 请求对象
   * @param res - 响应对象或 Socket
   */
  private handleOnError = (err: Error, req: IncomingMessage, res: ServerResponse | net.Socket): void => {
    this.log('error', '[AutoProxyCookie] Proxy Error:', err.message);
    this.log('error', '[AutoProxyCookie] URL:', req.url);

    if (res instanceof http.ServerResponse && !res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: '服务暂不可用，请稍后重试',
        error: err.message,
      }));
    }

    if (this.options.hooks.onError) {
      try {
        this.options.hooks.onError(err, req, res);
      } catch (hookErr) {
        this.log('error', '[AutoProxyCookie] onError hook error:', (hookErr as Error).message);
      }
    }
  };

  /**
   * WebSocket 代理错误处理函数
   * @param err - 错误对象
   * @param req - 请求对象
   * @param socket - WebSocket 连接的 Socket
   */
  private handleOnWsError = (err: Error, req: IncomingMessage, socket: any): void => {
    this.log('error', '[AutoProxyCookie] WebSocket Proxy Error:', err.message);
    this.log('error', '[AutoProxyCookie] WebSocket URL:', req.url);

    if (socket) {
      socket.close();
    }

    if (this.options.hooks.onWsError) {
      try {
        this.options.hooks.onWsError(err, req, socket);
      } catch (hookErr) {
        this.log('error', '[AutoProxyCookie] onWsError hook error:', (hookErr as Error).message);
      }
    }
  };

  /**
   * 初始化代理中间件
   * @param server - Vite 开发服务器实例
   */
  async setup(server: ViteDevServer): Promise<void> {
    this.server = server;
    this.currentCookie = this.cookieReader.readCookie();

    try {
      const baseOptions: ServerOptions = {
        target: this.options.target,
        changeOrigin: this.options.changeOrigin,
        secure: this.options.secure,
        followRedirects: this.options.followRedirects,
        autoRewrite: this.options.autoRewrite,
        protocolRewrite: this.options.protocolRewrite,
        cookieDomainRewrite: this.options.cookieDomainRewrite,
        cookiePathRewrite: this.options.cookiePathRewrite,
        ws: this.options.ws,
      };

      this.proxyServer = httpProxy.createProxyServer(baseOptions) as unknown as ProxyServer;

      this.proxyServer.on('proxyReq', this.handleOnProxyReq);
      this.proxyServer.on('proxyRes', this.handleOnProxyRes);
      this.proxyServer.on('error', this.handleOnError);
      if (this.options.ws) {
        (this.proxyServer as any).on('wsError', this.handleOnWsError);
      }

      this.log('info', '[AutoProxyCookie] Proxy server created with WebSocket support');
    } catch (err) {
      this.log('warn', '[AutoProxyCookie] http-proxy create failed, using basic mode:', (err as Error).message);
    }

    server.middlewares.use((req: any, res: any, next: any) => {
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;

      if (this.isIgnoredPath(pathname)) {
        next();
        return;
      }

      this.currentCookie = this.cookieReader.readCookie();

      if (this.proxyServer) {
        const target = this.getProxyUrl(req);
        if (this.options.debug || this.options.logLevel === 'debug') {
          this.log('info', `[AutoProxyCookie] ${pathname} -> ${target}`);
        }

        const proxyOptions = this.createProxyOptions(target);

        try {
          this.proxyServer.web(req, res, proxyOptions);
        } catch (err: any) {
          this.log('error', '[AutoProxyCookie] Proxy web error:', err.message);
          next(err);
        }
      } else {
        next();
      }
    });

    if (this.options.ws && this.server.httpServer && this.proxyServer) {
      this.server.httpServer.on('upgrade', (req: IncomingMessage, socket: any, head: Buffer) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;

        if (this.isIgnoredPath(pathname)) {
          socket.destroy();
          return;
        }

        const target = this.getProxyUrl(req);

        this.proxyServer?.ws(req, socket, head, {
          target,
          ws: true,
          changeOrigin: this.options.changeOrigin,
          secure: this.options.secure,
        });
      });

      this.log('info', '[AutoProxyCookie] WebSocket upgrade handler registered');
    }

    this.startFileWatch();

    this.log('info', '[AutoProxyCookie] Auto-proxy middleware enabled');
    this.log('info', '[AutoProxyCookie] Target:', this.options.target);
    this.log('info', '[AutoProxyCookie] Cookie file:', this.options.cookieFile);
    if (this.options.autoRestart) {
      this.log('info', '[AutoProxyCookie] Auto-restart enabled');
    }
    if (this.options.ws) {
      this.log('info', '[AutoProxyCookie] WebSocket support enabled');
    }
  }

  /**
   * 启动 Cookie 文件监听
   */
  private startFileWatch(): void {
    // 判断是否应该启用监听
    // isDev 参数优先级最高
    let shouldWatch: boolean;
    
    if (this.options.isDev !== undefined) {
      shouldWatch = this.options.isDev;
      if (this.options.debug) {
        console.log(`[AutoProxyCookie] isDev=${this.options.isDev}, ${shouldWatch ? 'enabling' : 'disabling'} watch`);
      }
    } else {
      // 默认启用监听（因为 AutoProxyCookie 主要用于开发环境）
      shouldWatch = true;
      if (this.options.debug) {
        console.log('[AutoProxyCookie] Default behavior: enabling watch (dev mode)');
      }
    }
    
    if (shouldWatch) {
      this.watcher = watchCookieFile(
        this.options.cookieFile,
        this.handleCookieChange,
        (error) => {
          this.log('error', '[AutoProxyCookie] File watch error:', error.message);
        }
      );
    } else if (this.options.debug) {
      console.log('[AutoProxyCookie] File watch disabled');
    }
  }

  /**
   * 停止代理服务
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.stop();
      this.watcher = null;
    }
    if (this.proxyServer) {
      this.proxyServer.close();
      this.proxyServer = null;
    }
    this.log('info', '[AutoProxyCookie] Stopped');
  }

  /**
   * 获取当前 Cookie 值
   * @returns 当前 Cookie 字符串
   */
  getCurrentCookie(): string {
    return this.currentCookie;
  }
}

/**
 * 创建 AutoProxyCookie 实例
 * @param options - 配置选项
 * @returns AutoProxyCookie 实例
 */
export function createAutoProxyCookie(options: AutoProxyCookieOptions): AutoProxyCookie {
  return new AutoProxyCookie(options);
}
