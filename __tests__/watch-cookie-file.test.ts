import * as fs from 'fs';
import * as path from 'path';
import { watchCookieFile } from '../src/utils/cookie-watcher';

describe('watchCookieFile', () => {
  const testDir = path.join(__dirname, '__temp__');
  const cookieFile = path.join(testDir, 'cookie.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(cookieFile, 'JSESSIONID=initial');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should create watcher and start watching', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher).toBeDefined();
    expect(typeof watcher.stop).toBe('function');
    expect(typeof watcher.getCurrentCookie).toBe('function');

    watcher.stop();
  });

  test('should call onCookieChange when file changes', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    fs.writeFileSync(cookieFile, 'JSESSIONID=updated');
    watcher['handleChange']();

    expect(onCookieChange).toHaveBeenCalledWith('JSESSIONID=updated');

    watcher.stop();
  });

  test('should call onError when error occurs', () => {
    const onError = jest.fn();
    const watcher = watchCookieFile(cookieFile, jest.fn(), onError);

    const mockError = new Error('Test error');
    watcher['watcher']?.emit('error', mockError);

    expect(onError).toHaveBeenCalledWith(mockError);

    watcher.stop();
  });

  test('should get current cookie', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=initial');

    watcher.stop();
  });

  test('should auto create file if not exists', () => {
    const nonExistentFile = path.join(testDir, 'new-cookie.txt');
    const onCookieChange = jest.fn();

    expect(fs.existsSync(nonExistentFile)).toBe(false);

    const watcher = watchCookieFile(nonExistentFile, onCookieChange);

    expect(fs.existsSync(nonExistentFile)).toBe(true);

    watcher.stop();
  });

  test('should handle empty cookie file', () => {
    fs.writeFileSync(cookieFile, '');
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('');

    watcher.stop();
  });

  test('should handle comments and empty lines', () => {
    const content = `# Comment
JSESSIONID=abc123
user=admin`;
    fs.writeFileSync(cookieFile, content);

    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=abc123; user=admin');

    watcher.stop();
  });

  test('should not call onCookieChange when content is unchanged', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    // First change with same content does not trigger callback
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledTimes(0);

    // Second change with same content still does not trigger callback
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledTimes(0);

    watcher.stop();
  });

  test('should update currentCookie after file change', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=initial');

    fs.writeFileSync(cookieFile, 'JSESSIONID=updated');
    watcher['handleChange']();

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=updated');

    watcher.stop();
  });

  test('should stop watching and cleanup', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    watcher.stop();

    expect((watcher as any).watcher).toBeNull();
  });

  test('should handle multiple file changes', () => {
    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    fs.writeFileSync(cookieFile, 'JSESSIONID=change1');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledWith('JSESSIONID=change1');

    fs.writeFileSync(cookieFile, 'JSESSIONID=change2');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledWith('JSESSIONID=change2');

    fs.writeFileSync(cookieFile, 'JSESSIONID=change3');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledWith('JSESSIONID=change3');

    watcher.stop();
  });

  test('should handle multi-line cookie format', () => {
    const content = `JSESSIONID=abc123
user=admin
token=xyz789`;
    fs.writeFileSync(cookieFile, content);

    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=abc123; user=admin; token=xyz789');

    watcher.stop();
  });

  test('should handle single-line cookie format', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123; user=admin; token=xyz789');

    const onCookieChange = jest.fn();
    const watcher = watchCookieFile(cookieFile, onCookieChange);

    expect(watcher.getCurrentCookie()).toBe('JSESSIONID=abc123; user=admin; token=xyz789');

    watcher.stop();
  });
});