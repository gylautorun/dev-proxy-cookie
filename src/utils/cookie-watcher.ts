import * as fs from 'fs';
import * as path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import { CookieReader } from './cookie-reader';

export interface CookieWatcherOptions {
  cookieFile: string;
  onCookieChange: (cookie: string) => void;
  onError?: (error: Error) => void;
  autoCreateFile?: boolean;
}

export class CookieWatcher {
  private watcher: FSWatcher | null = null;
  private options: CookieWatcherOptions;
  private cookieReader: CookieReader;
  private lastContent: string = '';

  constructor(options: CookieWatcherOptions) {
    this.options = {
      autoCreateFile: true,
      ...options,
    };
    this.cookieReader = new CookieReader({ cookieFile: options.cookieFile });
  }

  private handleChange = (): void => {
    const newContent = this.cookieReader.readCookie();
    if (newContent !== this.lastContent) {
      this.lastContent = newContent;
      this.options.onCookieChange(newContent);
      console.log(`[CookieWatcher] Cookie updated from file: ${this.options.cookieFile}`);
    }
  };

  start(): void {
    if (this.options.autoCreateFile) {
      this.cookieReader.ensureCookieFile();
    }

    this.lastContent = this.cookieReader.readCookie();
    console.log(`[CookieWatcher] Started watching: ${this.options.cookieFile}`);

    try {
      this.watcher = chokidar.watch(this.options.cookieFile, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      this.watcher.on('change', this.handleChange);
      this.watcher.on('error', (error) => {
        this.options.onError?.(error);
      });
    } catch (error) {
      this.options.onError?.(error as Error);
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log(`[CookieWatcher] Stopped watching: ${this.options.cookieFile}`);
    }
  }

  getCurrentCookie(): string {
    return this.lastContent;
  }
}

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