import * as fs from 'fs';
import * as path from 'path';
import { createDevProxyCookie, getViteVersion, getViteMajorVersion } from '../src/proxy/vite-adapter';

describe('createDevProxyCookie', () => {
  const testDir = path.join(__dirname, '__temp__');
  const cookieFile = path.join(testDir, 'cookie.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(cookieFile, 'JSESSIONID=abc123');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should create plugin in auto mode with target', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      mode: 'auto',
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
    expect(plugin.apply).toBe('serve');
  });

  test('should create plugin in cookie mode without target', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      mode: 'cookie',
    });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
    expect(plugin.apply).toBe('serve');
  });

  test('should create plugin in proxy mode', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      mode: 'proxy',
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
    expect(plugin.apply).toBe('serve');
  });

  test('should create plugin with debug option', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      debug: true,
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });

  test('should create plugin with autoRestart option', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRestart: false,
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });

  test('should create plugin with proxyMap', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      proxyMap: {
        '/api/': 'http://api-server:8081',
      },
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });

  test('should create plugin with ignorePaths', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/', '/img/'],
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });

  test('should create plugin with onCookieChange callback', () => {
    const onCookieChange = jest.fn();
    const plugin = createDevProxyCookie({
      cookieFile,
      mode: 'cookie',
      onCookieChange,
    });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });

  test('should auto-detect cookie mode when target is not provided', () => {
    const plugin = createDevProxyCookie({
      cookieFile,
      mode: 'auto',
    });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });

  test('should create plugin with restartMarkerFile', () => {
    const markerFile = path.join(testDir, '.restart-marker');
    const plugin = createDevProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      restartMarkerFile: markerFile,
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });
});

describe('getViteVersion', () => {
  test('should return version string', () => {
    const version = getViteVersion();
    expect(typeof version).toBe('string');
  });

  test('should return null if vite package not found', () => {
    const version = getViteVersion();
    expect(version === null || typeof version === 'string').toBe(true);
  });
});

describe('getViteMajorVersion', () => {
  test('should return major version number', () => {
    const majorVersion = getViteMajorVersion();
    expect(typeof majorVersion).toBe('number');
    expect(majorVersion).toBeGreaterThan(0);
  });

  test('should return default version 5 if vite package not found', () => {
    const majorVersion = getViteMajorVersion();
    expect(majorVersion).toBeGreaterThanOrEqual(2);
    expect(majorVersion).toBeLessThanOrEqual(6);
  });
});