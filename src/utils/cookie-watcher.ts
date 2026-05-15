/**
 * Cookie 文件监听器模块
 * 
 * 使用 chokidar 监听 Cookie 文件变化，当文件内容改变时触发回调。
 * 支持自动创建文件和稳定性阈值配置。
 * 
 * @module cookie-watcher
 */
import * as fs from 'fs';
import * as path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import { CookieReader } from './cookie-reader';

/**
 * Cookie 监听器配置选项
 */
export interface CookieWatcherOptions {
  cookieFile: string;
  onCookieChange: (cookie: string) => void;
  onError?: (error: Error) => void;
  autoCreateFile?: boolean;
}

/**
 * Cookie 文件监听器类
 * 
 * 使用 chokidar 监听 Cookie 文件变化，当文件内容改变时触发回调。
 * 支持自动创建文件和稳定性阈值配置。
 */
export class CookieWatcher {
  /** 文件监听器实例 */
  private watcher: FSWatcher | null = null;
  /** 配置选项 */
  private options: CookieWatcherOptions;
  /** Cookie 读取器 */
  private cookieReader: CookieReader;
  /** 上次读取的 Cookie 内容 */
  private lastContent: string = '';

  /**
   * 构造函数
   * @param options - 配置选项
   */
  constructor(options: CookieWatcherOptions) {
    this.options = {
      autoCreateFile: true,
      ...options,
    };
    this.cookieReader = new CookieReader({ cookieFile: options.cookieFile });
  }

  /**
   * 文件变化处理函数
   * 
   * 读取新的 Cookie 内容，如果与上次不同则触发回调。
   */
  private handleChange = (): void => {
    const newContent = this.cookieReader.readCookie();
    if (newContent !== this.lastContent) {
      this.lastContent = newContent;
      this.options.onCookieChange(newContent);
      console.log(`[CookieWatcher] Cookie updated from file: ${this.options.cookieFile}`);
    }
  };

  /**
   * 启动文件监听
   */
  start(): void {
    if (this.options.autoCreateFile) {
      this.cookieReader.ensureCookieFile();
    }

    const watchPath = path.resolve(this.options.cookieFile);
    this.lastContent = this.cookieReader.readCookie();
    console.log(`[CookieWatcher] Started watching: ${watchPath}`);

    try {
      this.watcher = chokidar.watch(watchPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      // "add" covers atomic replace (unlink + rename) used by some editors; 
      // "change" covers in-place writes
      this.watcher.on('change', this.handleChange);
      this.watcher.on('add', this.handleChange);
      this.watcher.on('error', (error) => {
        this.options.onError?.(error);
      });
    } catch (error) {
      this.options.onError?.(error as Error);
    }
  }

  /**
   * 停止文件监听
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log(`[CookieWatcher] Stopped watching: ${this.options.cookieFile}`);
    }
  }

  /**
   * 获取当前 Cookie 值
   * @returns 当前 Cookie 字符串
   */
  getCurrentCookie(): string {
    return this.lastContent;
  }
}

/**
 * 创建并启动 Cookie 文件监听器
 * 
 * @param cookieFile - Cookie 文件路径
 * @param onCookieChange - Cookie 变化回调函数
 * @param onError - 错误回调函数（可选）
 * @returns CookieWatcher 实例
 */
export function watchCookieFile(
  cookieFile: string,
  onCookieChange: (cookie: string) => void,
  onError?: (error: Error) => void
): CookieWatcher {
  const watcher = new CookieWatcher({
    cookieFile,
    onCookieChange,
    onError,
  });
  watcher.start();
  return watcher;
}