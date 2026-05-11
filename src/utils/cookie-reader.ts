import * as fs from 'fs';
import * as path from 'path';

export interface CookieReaderOptions {
  cookieFile: string;
  encoding?: BufferEncoding;
}

export class CookieReader {
  protected options: CookieReaderOptions;

  constructor(options: CookieReaderOptions) {
    this.options = {
      encoding: 'utf-8',
      ...options,
    };
  }

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

export function createCookieGetter(cookieFile: string): () => string {
  const reader = new CookieReader({ cookieFile });
  return () => reader.readCookie();
}