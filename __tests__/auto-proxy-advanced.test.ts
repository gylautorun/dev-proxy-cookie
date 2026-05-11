import * as fs from 'fs';
import * as path from 'path';
import { AutoProxyCookie, createAutoProxyCookie } from '../src/proxy/core';

describe('AutoProxyCookie advanced features', () => {
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
  });

  test('should support ws option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ws: true,
    });

    expect((autoProxy as any).options.ws).toBe(true);
  });

  test('should support changeOrigin option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      changeOrigin: false,
    });

    expect((autoProxy as any).options.changeOrigin).toBe(false);
  });

  test('should support secure option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      secure: true,
    });

    expect((autoProxy as any).options.secure).toBe(true);
  });

  test('should support followRedirects option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      followRedirects: false,
    });

    expect((autoProxy as any).options.followRedirects).toBe(false);
  });

  test('should support autoRewrite option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRewrite: true,
    });

    expect((autoProxy as any).options.autoRewrite).toBe(true);
  });

  test('should support protocolRewrite option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      protocolRewrite: 'https',
    });

    expect((autoProxy as any).options.protocolRewrite).toBe('https');
  });

  test('should support cookieDomainRewrite option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookieDomainRewrite: { 'old.com': 'new.com' },
    });

    expect((autoProxy as any).options.cookieDomainRewrite).toEqual({ 'old.com': 'new.com' });
  });

  test('should support cookiePathRewrite option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookiePathRewrite: { '/old': '/new' },
    });

    expect((autoProxy as any).options.cookiePathRewrite).toEqual({ '/old': '/new' });
  });

  test('should support headers option', () => {
    const headers = { host: 'example.com', origin: 'http://example.com' };
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      headers,
    });

    expect((autoProxy as any).options.headers).toEqual(headers);
  });

  test('should create proxy options with all settings', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ws: true,
      changeOrigin: true,
      secure: false,
      followRedirects: true,
      autoRewrite: false,
      protocolRewrite: 'https',
      cookieDomainRewrite: '*',
      cookiePathRewrite: false,
      headers: { 'X-Custom': 'value' },
    });

    const proxyOptions = (autoProxy as any).createProxyOptions('http://localhost:8080');

    expect(proxyOptions.ws).toBe(true);
    expect(proxyOptions.changeOrigin).toBe(true);
    expect(proxyOptions.secure).toBe(false);
    expect(proxyOptions.followRedirects).toBe(true);
    expect(proxyOptions.autoRewrite).toBe(false);
    expect(proxyOptions.protocolRewrite).toBe('https');
    expect(proxyOptions.cookieDomainRewrite).toBe('*');
    expect(proxyOptions.cookiePathRewrite).toBe(false);
    expect(proxyOptions.headers['X-Custom']).toBe('value');
  });

  test('should handle proxyMap with multiple paths', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/': 'http://api-server:8081',
        '/mock/': 'http://mock-server:3000',
        '/ws/': 'http://ws-server:9000',
      },
    });

    expect((autoProxy as any).getProxyUrl({ url: '/api/users' } as any)).toBe('http://api-server:8081');
    expect((autoProxy as any).getProxyUrl({ url: '/mock/data' } as any)).toBe('http://mock-server:3000');
    expect((autoProxy as any).getProxyUrl({ url: '/ws/socket' } as any)).toBe('http://ws-server:9000');
    expect((autoProxy as any).getProxyUrl({ url: '/other/path' } as any)).toBe('http://localhost:8080');
  });

  test('should match path prefix in proxyMap order', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/v2/': 'http://api-v2-server:8082',
        '/api/': 'http://api-server:8081',
      },
    });

    expect((autoProxy as any).getProxyUrl({ url: '/api/v2/users' } as any)).toBe('http://api-v2-server:8082');
    expect((autoProxy as any).getProxyUrl({ url: '/api/users' } as any)).toBe('http://api-server:8081');
  });

  test('should handle ignorePaths with multiple patterns', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/', '/img/', '/css/', '/js/', '/favicon.ico'],
    });

    expect((autoProxy as any).isIgnoredPath('/assets/style.css')).toBe(true);
    expect((autoProxy as any).isIgnoredPath('/img/logo.png')).toBe(true);
    expect((autoProxy as any).isIgnoredPath('/css/main.css')).toBe(true);
    expect((autoProxy as any).isIgnoredPath('/js/app.js')).toBe(true);
    expect((autoProxy as any).isIgnoredPath('/favicon.ico')).toBe(true);
    expect((autoProxy as any).isIgnoredPath('/api/users')).toBe(false);
    expect((autoProxy as any).isIgnoredPath('/')).toBe(false);
  });

  test('should handle empty ignorePaths array', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ignorePaths: [],
    });

    expect((autoProxy as any).isIgnoredPath('/api/users')).toBe(false);
    expect((autoProxy as any).isIgnoredPath('/assets/style.css')).toBe(false);
  });

  test('should handle undefined ignorePaths', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect((autoProxy as any).isIgnoredPath('/api/users')).toBe(false);
    expect((autoProxy as any).isIgnoredPath('/assets/style.css')).toBe(false);
  });

  test('should handle URL with query parameters in getProxyUrl', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/': 'http://api-server:8081',
      },
    });

    expect((autoProxy as any).getProxyUrl({ url: '/api/users?limit=10' } as any)).toBe('http://api-server:8081');
    expect((autoProxy as any).getProxyUrl({ url: '/api/users?page=1&limit=10' } as any)).toBe('http://api-server:8081');
  });

  test('should handle URL with hash in getProxyUrl', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/': 'http://api-server:8081',
      },
    });

    expect((autoProxy as any).getProxyUrl({ url: '/api/users#section' } as any)).toBe('http://api-server:8081');
  });

  test('should handle empty URL in getProxyUrl', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect((autoProxy as any).getProxyUrl({ url: '' } as any)).toBe('http://localhost:8080');
  });

  test('should handle undefined URL in getProxyUrl', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect((autoProxy as any).getProxyUrl({ url: undefined } as any)).toBe('http://localhost:8080');
  });

  test('should stop and cleanup resources', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    autoProxy.stop();

    expect((autoProxy as any).watcher).toBeNull();
    expect((autoProxy as any).proxyServer).toBeNull();
  });

  test('should handle stop when already stopped', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    autoProxy.stop();
    autoProxy.stop();

    expect((autoProxy as any).watcher).toBeNull();
    expect((autoProxy as any).proxyServer).toBeNull();
  });

  test('should handle cookie change with empty string', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    (autoProxy as any).handleCookieChange('');

    expect(autoProxy.getCurrentCookie()).toBe('');
  });

  test('should handle cookie change with new value', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    (autoProxy as any).handleCookieChange('JSESSIONID=new');

    expect(autoProxy.getCurrentCookie()).toBe('JSESSIONID=new');
  });

  test('should not update when cookie is unchanged', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    (autoProxy as any).currentCookie = 'JSESSIONID=same';
    (autoProxy as any).handleCookieChange('JSESSIONID=same');

    expect(autoProxy.getCurrentCookie()).toBe('JSESSIONID=same');
  });

  test('should handle cookieDomainRewrite as string', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookieDomainRewrite: 'localhost',
    });

    expect((autoProxy as any).options.cookieDomainRewrite).toBe('localhost');
  });

  test('should handle cookieDomainRewrite as false', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookieDomainRewrite: false,
    });

    expect((autoProxy as any).options.cookieDomainRewrite).toBe(false);
  });

  test('should handle cookiePathRewrite as string', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookiePathRewrite: '/new-path',
    });

    expect((autoProxy as any).options.cookiePathRewrite).toBe('/new-path');
  });

  test('should handle cookiePathRewrite as false', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      cookiePathRewrite: false,
    });

    expect((autoProxy as any).options.cookiePathRewrite).toBe(false);
  });

  test('should handle protocolRewrite as undefined', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect((autoProxy as any).options.protocolRewrite).toBeUndefined();
  });
});