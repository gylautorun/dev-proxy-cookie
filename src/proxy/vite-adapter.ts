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
}

export function createDevProxyCookie(options: UnifiedProxyCookieOptions): Plugin {
  const {
    mode = 'auto',
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