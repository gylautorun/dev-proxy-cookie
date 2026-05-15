/**
 * Cookie 文件读取器模块
 * 
 * 提供从文件读取 Cookie 的功能，支持注释过滤和自动文件创建。
 * 
 * @module cookie-reader
 */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Cookie 读取器配置选项
 */
export interface CookieReaderOptions {
  cookieFile: string;
  encoding?: BufferEncoding;
}

/**
 * Cookie 文件读取器类
 * 
 * 提供从文件读取 Cookie 的功能，支持注释过滤和自动文件创建。
 */
export class CookieReader {
  /** 配置选项 */
  protected options: CookieReaderOptions;

  /**
   * 构造函数
   * @param options - 配置选项
   */
  constructor(options: CookieReaderOptions) {
    this.options = {
      encoding: 'utf-8',
      ...options,
    };
  }

  /**
   * 读取 Cookie 文件内容
   * 
   * 支持过滤注释行（以 # 开头）和空行，将有效行用分号连接。
   * 
   * @returns Cookie 字符串
   */
  readCookie(): string {
    try {
      const filePath = path.resolve(this.options.cookieFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, this.options.encoding || 'utf-8');
        // 过滤注释行（以 # 开头）和空行，然后合并成一行
        const lines = content.split('\n');
        const cookieLines = lines
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        return cookieLines.join('; ');
      }
      return '';
    } catch {
      return '';
    }
  }

  /**
   * 确保 Cookie 文件存在
   * 
   * 如果文件不存在，会自动创建空文件。
   * 如果父目录不存在，会自动创建目录。
   */
  ensureCookieFile(): void {
    const filePath = path.resolve(this.options.cookieFile);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
  }
}

/**
 * 创建 Cookie 获取器函数
 * 
 * 返回一个函数，每次调用时从文件读取最新的 Cookie 值。
 * 
 * @param cookieFile - Cookie 文件路径
 * @returns Cookie 获取函数
 */
export function createCookieGetter(cookieFile: string): () => string {
  const reader = new CookieReader({ cookieFile });
  return () => reader.readCookie();
}