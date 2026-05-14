import type { Plugin } from 'vite';
import { viteAutoProxyCookie, type ViteAutoProxyCookiePluginOptions } from './vite-plugin';
import { viteDevProxyCookie, type ViteDevProxyCookieOptions } from './vite-cookie-plugin';

let viteVersion: string = '';
let majorVersion: number | null = null;

function detectViteVersion(): number {
  if (majorVersion !== null) {
    return majorVersion;
  }

  try {
    const pkg = require('vite/package.json');
    viteVersion = pkg.version;
    majorVersion = parseInt(viteVersion.split('.')[0], 10);
  } catch {
    majorVersion = 5;
  }

  return majorVersion;
}

export interface UnifiedProxyCookieOptions {
  cookieFile: string;
  target?: string;
  debug?: boolean;
  autoRestart?: boolean;
  restartMarkerFile?: string;
  proxyMap?: Record<string, string>;
  ignorePaths?: string[];
  includePaths?: string[];
  onCookieChange?: (cookie: string) => void;
  mode?: 'auto' | 'proxy' | 'cookie';
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

export function createDevProxyCookie(options: UnifiedProxyCookieOptions): Plugin {
  const {
    mode = 'auto',
    watch = 'auto',
    isDev,
    ...restOptions
  } = options;

  const version = detectViteVersion();
  
  if (options.debug) {
    console.log(`[dev-proxy-cookie] Detected Vite ${version}.x`);
  }

  if (mode === 'cookie' || (mode === 'auto' && !options.target)) {
    return viteDevProxyCookie({
      cookieFile: options.cookieFile,
      debug: options.debug,
      onCookieChange: options.onCookieChange,
      watch,
      isDev,
    });
  }

  const pluginOptions: ViteAutoProxyCookiePluginOptions = {
    cookieFile: options.cookieFile,
    target: options.target!,
    debug: options.debug,
    autoRestart: options.autoRestart ?? true,
    restartMarkerFile: options.restartMarkerFile,
    proxyMap: options.proxyMap,
    ignorePaths: options.ignorePaths,
  };

  return viteAutoProxyCookie(pluginOptions);
}

export function getViteVersion(): string | null {
  detectViteVersion();
  return viteVersion;
}

export function getViteMajorVersion(): number {
  return detectViteVersion();
}