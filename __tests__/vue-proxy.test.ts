import * as fs from 'fs';
import * as path from 'path';
import { createFileCookieGetter, createVueProxyConfig } from '../src/proxy';
import { CookieReader, CookieWatcher } from '../src/utils';

describe('CookieReader', () => {
  const testDir = path.join(__dirname, '__temp__');
  const cookieFile = path.join(testDir, 'cookie.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(cookieFile, '');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should read cookie from file', () => {
    const cookieValue = 'JSESSIONID=abc123; user=admin';
    fs.writeFileSync(cookieFile, cookieValue);

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe(cookieValue);
  });

  test('should return empty string if file is empty', () => {
    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('');
  });

  test('should return empty string if file does not exist', () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.txt');
    const reader = new CookieReader({ cookieFile: nonExistentFile });
    expect(reader.readCookie()).toBe('');
  });

  test('should filter comments and empty lines', () => {
    const content = `# ============================================================
# 开发环境 Cookie 配置文件
# ============================================================

# IRS 会话凭证
irs-session-id=YTFmYjk0YmQtNTdhZS00ZGFkLThiYTYtNDM3NDc4MzJmYTg4

# 用户会话前缀
uc_session_pre=ttcm1f6JnH2lPpMVLNvHg4bP3LaK6DcQ42O1FoE1xXLBoZNq24qmrcoAlLrYL7M1Y6KG/tOuzcw7TMuXL80orQ==

# DOS 会话凭证
dos-session-id=YWQxMWUwMTktZjI4Yi00NzNmLTkzOTItMWFmMzBiZTYzZTBm
`;
    fs.writeFileSync(cookieFile, content);

    const reader = new CookieReader({ cookieFile });
    const result = reader.readCookie();
    
    expect(result).toBe('irs-session-id=YTFmYjk0YmQtNTdhZS00ZGFkLThiYTYtNDM3NDc4MzJmYTg4; uc_session_pre=ttcm1f6JnH2lPpMVLNvHg4bP3LaK6DcQ42O1FoE1xXLBoZNq24qmrcoAlLrYL7M1Y6KG/tOuzcw7TMuXL80orQ==; dos-session-id=YWQxMWUwMTktZjI4Yi00NzNmLTkzOTItMWFmMzBiZTYzZTBm');
    expect(result).not.toContain('#');
  });

  test('should handle single line format', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123; user=admin; token=xyz789');

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('JSESSIONID=abc123; user=admin; token=xyz789');
  });

  test('should handle multi-line format without semicolons', () => {
    const content = `JSESSIONID=abc123
user=admin
token=xyz789`;
    fs.writeFileSync(cookieFile, content);

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('JSESSIONID=abc123; user=admin; token=xyz789');
  });

  test('should ensure cookie file exists', () => {
    const nonExistentFile = path.join(testDir, 'new-cookie.txt');
    const reader = new CookieReader({ cookieFile: nonExistentFile });
    
    expect(fs.existsSync(nonExistentFile)).toBe(false);
    reader.ensureCookieFile();
    expect(fs.existsSync(nonExistentFile)).toBe(true);
    expect(fs.readFileSync(nonExistentFile, 'utf-8')).toBe('');
  });
});

describe('CookieWatcher', () => {
  const testDir = path.join(__dirname, '__temp__');
  const cookieFile = path.join(testDir, 'cookie.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(cookieFile, '');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should detect cookie changes', () => {
    const onCookieChange = jest.fn();
    const watcher = new CookieWatcher({
      cookieFile,
      onCookieChange,
      autoCreateFile: false,
    });

    fs.writeFileSync(cookieFile, 'cookie1');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledWith('cookie1');

    fs.writeFileSync(cookieFile, 'cookie2');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledWith('cookie2');

    watcher.stop();
  });

  test('should start and stop watching', () => {
    fs.writeFileSync(cookieFile, 'initial');
    const watcher = new CookieWatcher({
      cookieFile,
      onCookieChange: jest.fn(),
    });

    watcher.start();
    expect(watcher.getCurrentCookie()).toBe('initial');

    watcher.stop();
  });

  test('should not trigger callback when content is unchanged', () => {
    const onCookieChange = jest.fn();
    const watcher = new CookieWatcher({
      cookieFile,
      onCookieChange,
      autoCreateFile: false,
    });

    fs.writeFileSync(cookieFile, 'same-cookie');
    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledTimes(1);

    watcher['handleChange']();
    expect(onCookieChange).toHaveBeenCalledTimes(1);

    watcher.stop();
  });

  test('should handle comments and empty lines in watched file', () => {
    const onCookieChange = jest.fn();
    const watcher = new CookieWatcher({
      cookieFile,
      onCookieChange,
      autoCreateFile: false,
    });

    const content = `# Comment
JSESSIONID=abc123
user=admin`;
    fs.writeFileSync(cookieFile, content);
    watcher['handleChange']();
    
    expect(onCookieChange).toHaveBeenCalledWith('JSESSIONID=abc123; user=admin');
    watcher.stop();
  });

  test('should auto create file when autoCreateFile is true', () => {
    const nonExistentFile = path.join(testDir, 'new-watch.txt');
    const onCookieChange = jest.fn();
    
    expect(fs.existsSync(nonExistentFile)).toBe(false);
    
    const watcher = new CookieWatcher({
      cookieFile: nonExistentFile,
      onCookieChange,
      autoCreateFile: true,
    });
    
    watcher.start();
    expect(fs.existsSync(nonExistentFile)).toBe(true);
    watcher.stop();
  });
});

describe('createFileCookieGetter', () => {
  const testDir = path.join(__dirname, '__temp__');
  const cookieFile = path.join(testDir, 'cookie.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(cookieFile, 'JSESSIONID=test');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    jest.useRealTimers();
  });

  test('should return function that gets cookie', () => {
    jest.useFakeTimers();
    const getCookie = createFileCookieGetter(cookieFile);
    expect(typeof getCookie).toBe('function');
    expect(getCookie()).toBe('JSESSIONID=test');
    jest.runAllTimers();
  });

  test('should return updated cookie after file changes', () => {
    jest.useFakeTimers();
    const getCookie = createFileCookieGetter(cookieFile);

    expect(getCookie()).toBe('JSESSIONID=test');

    fs.writeFileSync(cookieFile, 'JSESSIONID=updated');
    jest.runAllTimers();

    expect(getCookie()).toBe('JSESSIONID=updated');
    jest.useRealTimers();
  });

  test('should handle empty cookie file', () => {
    fs.writeFileSync(cookieFile, '');
    jest.useFakeTimers();
    const getCookie = createFileCookieGetter(cookieFile);
    
    expect(getCookie()).toBe('');
    jest.runAllTimers();
  });

  test('should handle non-existent file', () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.txt');
    jest.useFakeTimers();
    const getCookie = createFileCookieGetter(nonExistentFile);
    
    expect(getCookie()).toBe('');
    jest.runAllTimers();
  });

  test('should filter comments in cookie file', () => {
    const content = `# Comment
JSESSIONID=abc123
user=admin`;
    fs.writeFileSync(cookieFile, content);
    jest.useFakeTimers();
    const getCookie = createFileCookieGetter(cookieFile);
    
    expect(getCookie()).toBe('JSESSIONID=abc123; user=admin');
    jest.runAllTimers();
  });

  test('should enable watch when isDev is true', () => {
    jest.useFakeTimers();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const getCookie = createFileCookieGetter(cookieFile, {
      isDev: true,
      debug: true,
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('[CookieFile] isDev=true, enabling watch');
    expect(getCookie()).toBe('JSESSIONID=test');
    
    consoleLogSpy.mockRestore();
    jest.runAllTimers();
  });

  test('should disable watch when isDev is false', () => {
    jest.useFakeTimers();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const getCookie = createFileCookieGetter(cookieFile, {
      isDev: false,
      debug: true,
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('[CookieFile] isDev=false, disabling watch');
    expect(getCookie()).toBe('JSESSIONID=test');
    
    consoleLogSpy.mockRestore();
    jest.runAllTimers();
  });

  test('should respect isDev over watch parameter', () => {
    jest.useFakeTimers();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const getCookie = createFileCookieGetter(cookieFile, {
      watch: true,  // This should be ignored
      isDev: false,  // This takes priority
      debug: true,
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('[CookieFile] isDev=false, disabling watch');
    
    consoleLogSpy.mockRestore();
    jest.runAllTimers();
  });

  test('should use watch parameter when isDev is not set', () => {
    jest.useFakeTimers();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const getCookie = createFileCookieGetter(cookieFile, {
      watch: false,
      debug: true,
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('[CookieFile] Watch disabled by user setting');
    
    consoleLogSpy.mockRestore();
    jest.runAllTimers();
  });

  test('should use auto-detection when both isDev and watch are not set', () => {
    jest.useFakeTimers();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const getCookie = createFileCookieGetter(cookieFile, {
      debug: true,
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Auto-detected'));
    
    consoleLogSpy.mockRestore();
    jest.runAllTimers();
  });
});

describe('createVueProxyConfig', () => {
  test('should create proxy config with default options', () => {
    const config = createVueProxyConfig('http://localhost:8080');

    expect(config).toEqual({
      ws: false,
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      headers: {},
      onProxyReq: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  test('should create proxy config with custom headers', () => {
    const headers = { host: 'example.com', origin: 'http://example.com' };
    const config = createVueProxyConfig('http://localhost:8080', { headers });

    expect(config.headers).toEqual(headers);
  });

  test('should inject cookie when getCookie is provided', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createVueProxyConfig('http://localhost:8080', { getCookie: mockGetCookie });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/test', method: 'GET' };

    config.onProxyReq(mockProxyReq, mockReq as any);

    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should not inject cookie when getCookie returns empty string', () => {
    const mockGetCookie = jest.fn().mockReturnValue('');
    const config = createVueProxyConfig('http://localhost:8080', { getCookie: mockGetCookie });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/test', method: 'GET' };

    config.onProxyReq(mockProxyReq, mockReq as any);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should support WebSocket option', () => {
    const config = createVueProxyConfig('http://localhost:8080', { ws: true });
    expect(config.ws).toBe(true);
  });

  test('should support changeOrigin option', () => {
    const config = createVueProxyConfig('http://localhost:8080', { changeOrigin: false });
    expect(config.changeOrigin).toBe(false);
  });

  test('should support secure option', () => {
    const config = createVueProxyConfig('http://localhost:8080', { secure: true });
    expect(config.secure).toBe(true);
  });

  test('should call custom onError when error occurs', () => {
    const mockOnError = jest.fn();
    const config = createVueProxyConfig('http://localhost:8080', { onError: mockOnError });

    const mockErr = new Error('Test error');

    config.onError(mockErr);

    expect(mockOnError).toHaveBeenCalledWith(mockErr);
  });

  test('should set cookie header when getCookie returns value', () => {
    const mockGetCookie = jest.fn().mockReturnValue('new-cookie=value');
    const config = createVueProxyConfig('http://localhost:8080', { getCookie: mockGetCookie });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn(), getHeader: jest.fn().mockReturnValue(null) };
    const mockReq = { url: '/api/test', method: 'GET' };

    config.onProxyReq(mockProxyReq, mockReq as any);

    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'new-cookie=value');
  });

  test('should support debug option', () => {
    const config = createVueProxyConfig('http://localhost:8080', { debug: true });
    // debug option doesn't change the returned config directly, but should be handled internally
    expect(config.target).toBe('http://localhost:8080');
  });

  test('should handle null getCookie function', () => {
    const config = createVueProxyConfig('http://localhost:8080', { getCookie: null as any });
    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn(), getHeader: jest.fn().mockReturnValue(null) };
    const mockReq = { url: '/api/test', method: 'GET' };

    config.onProxyReq(mockProxyReq, mockReq as any);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });
});

describe('CookieReader edge cases', () => {
  const testDir = path.join(__dirname, '__temp__');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should handle file with only comments', () => {
    const cookieFile = path.join(testDir, 'comments-only.txt');
    const content = `# This is a comment
# Another comment
#`;
    fs.writeFileSync(cookieFile, content);

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('');
  });

  test('should handle file with trailing newlines', () => {
    const cookieFile = path.join(testDir, 'trailing-newline.txt');
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123\n\n');

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('JSESSIONID=abc123');
  });

  test('should handle file with BOM', () => {
    const cookieFile = path.join(testDir, 'bom.txt');
    const content = '\uFEFFJSESSIONID=abc123';
    fs.writeFileSync(cookieFile, content);

    const reader = new CookieReader({ cookieFile });
    const result = reader.readCookie();
    expect(result).toBe('JSESSIONID=abc123');
  });

  test('should create nested directory for ensureCookieFile', () => {
    const nestedFile = path.join(testDir, 'nested', 'deep', 'cookie.txt');
    
    expect(fs.existsSync(nestedFile)).toBe(false);
    
    const reader = new CookieReader({ cookieFile: nestedFile });
    reader.ensureCookieFile();
    
    expect(fs.existsSync(nestedFile)).toBe(true);
  });

  test('should use specified encoding', () => {
    const cookieFile = path.join(testDir, 'encoding.txt');
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123');

    const reader = new CookieReader({ cookieFile, encoding: 'utf-8' });
    expect(reader.readCookie()).toBe('JSESSIONID=abc123');
  });
});

describe('createCookieGetter', () => {
  const testDir = path.join(__dirname, '__temp__');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should create a function that reads cookie on demand', () => {
    const cookieFile = path.join(testDir, 'getter-test.txt');
    fs.writeFileSync(cookieFile, 'JSESSIONID=initial');

    const getCookie = require('../src/utils/cookie-reader').createCookieGetter(cookieFile);
    
    expect(typeof getCookie).toBe('function');
    expect(getCookie()).toBe('JSESSIONID=initial');

    fs.writeFileSync(cookieFile, 'JSESSIONID=updated');
    expect(getCookie()).toBe('JSESSIONID=updated');
  });

  test('should return empty string for non-existent file', () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.txt');
    const getCookie = require('../src/utils/cookie-reader').createCookieGetter(nonExistentFile);
    
    expect(getCookie()).toBe('');
  });
});