import * as fs from 'fs';
import * as path from 'path';
import { AutoProxyCookie, createAutoProxyCookie } from '../src/proxy';
import { CookieReader } from '../src/utils';

describe('AutoProxyCookie', () => {
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

  test('should create instance with options', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      debug: true,
      autoRestart: false,
    });

    expect(autoProxy).toBeInstanceOf(AutoProxyCookie);
    expect(autoProxy.getCurrentCookie()).toBe('');
  });

  test('should read cookie using CookieReader', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123');

    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    const reader = new CookieReader({ cookieFile });
    const cookie = reader.readCookie();
    expect(cookie).toBe('JSESSIONID=abc123');
  });

  test('should get correct proxy url based on path', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/mock/': 'http://mock-server:3000',
        '/api/': 'http://api-server:8081',
      },
    });

    expect(autoProxy['getProxyUrl']({ url: '/mock/test' } as any)).toBe('http://mock-server:3000');
    expect(autoProxy['getProxyUrl']({ url: '/api/users' } as any)).toBe('http://api-server:8081');
    expect(autoProxy['getProxyUrl']({ url: '/other/path' } as any)).toBe('http://localhost:8080');
  });

  test('should check ignored paths', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/', '/img/', '/favicon.ico'],
    });

    expect(autoProxy['isIgnoredPath']('/assets/style.css')).toBe(true);
    expect(autoProxy['isIgnoredPath']('/img/logo.png')).toBe(true);
    expect(autoProxy['isIgnoredPath']('/favicon.ico')).toBe(true);
    expect(autoProxy['isIgnoredPath']('/api/users')).toBe(false);
  });

  test('should support includePaths option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/': 'http://api-server:8081',
      },
    });

    expect(autoProxy['getProxyUrl']({ url: '/api/users' } as any)).toBe('http://api-server:8081');
    expect(autoProxy['getProxyUrl']({ url: '/other/path' } as any)).toBe('http://localhost:8080');
  });

  test('should handle cookie file content', () => {
    const content = 'JSESSIONID=abc123;user=admin';
    fs.writeFileSync(cookieFile, content);

    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe(content);
  });

  test('should support autoRestart option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRestart: true,
    });

    expect(autoProxy['options'].autoRestart).toBe(true);
  });

  test('should support debug option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      debug: true,
    });

    expect(autoProxy['options'].debug).toBe(true);
  });

  test('should handle empty cookie file', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect(autoProxy.getCurrentCookie()).toBe('');
  });

  test('should handle non-existent cookie file', () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.txt');
    const autoProxy = createAutoProxyCookie({
      cookieFile: nonExistentFile,
      target: 'http://localhost:8080',
    });

    expect(autoProxy.getCurrentCookie()).toBe('');
  });

  test('should read cookie on initialization', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=initial');
    
    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('JSESSIONID=initial');
  });

  test('should read updated cookie from file', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=initial');
    
    const reader = new CookieReader({ cookieFile });
    expect(reader.readCookie()).toBe('JSESSIONID=initial');

    fs.writeFileSync(cookieFile, 'JSESSIONID=updated');
    expect(reader.readCookie()).toBe('JSESSIONID=updated');
  });

  test('should support authentications option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      authentications: [{ 'ticket': 'xxxx' }, { 'X-Custom-Token': 'yyyy' }],
    });

    expect(autoProxy).toBeInstanceOf(AutoProxyCookie);
    expect(autoProxy['options'].authentications).toEqual([{ 'ticket': 'xxxx' }, { 'X-Custom-Token': 'yyyy' }]);
  });

  test('should support empty authentications array', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      authentications: [],
    });

    expect(autoProxy['options'].authentications).toEqual([]);
  });

  test('should work with both cookie and authentications', () => {
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123');
    
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      useCookie: true,
      authentications: [{ 'ticket': 'xxxx' }],
    });

    expect(autoProxy).toBeInstanceOf(AutoProxyCookie);
    expect(autoProxy['options'].useCookie).toBe(true);
    expect(autoProxy['options'].authentications).toEqual([{ 'ticket': 'xxxx' }]);
  });
});