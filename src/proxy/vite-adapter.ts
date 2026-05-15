/**
 * Vite 适配器模块
 * 
 * 提供统一的 Vite 插件入口，自动检测 Vite 版本并选择合适的实现。
 * 支持两种模式：完整代理模式和仅 Cookie 注入模式。
 * 
 * @module vite-adapter
 */
import type { Plugin } from 'vite';
import { viteAutoProxyCookie, type ViteAutoProxyCookiePluginOptions } from './vite-plugin';
import { viteDevProxyCookie, type ViteDevProxyCookieOptions } from './vite-cookie-plugin';

/** Vite 版本号 */
let viteVersion: string = '';
/** Vite 主版本号 */
let majorVersion: number | null = null;

/**
 * 检测 Vite 版本
 * 
 * 从 vite/package.json 中读取版本号，提取主版本号。
 * 如果读取失败，默认返回 5。
 * 
 * @returns Vite 主版本号
 */
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

/**
 * 统一代理 Cookie 配置选项
 */
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

/**
 * 创建统一的开发代理 Cookie 插件
 * 
 * 根据配置自动选择合适的实现模式：
 * - 当 mode='cookie' 或 mode='auto' 且未设置 target 时，使用轻量级 Cookie 注入模式
 * - 其他情况使用完整代理模式
 * 
 * @param options - 配置选项
 * @returns Vite 插件对象
 */
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