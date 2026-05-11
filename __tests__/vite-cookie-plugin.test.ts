import * as fs from 'fs';
import * as path from 'path';
import { viteDevProxyCookie } from '../src/proxy/vite-cookie-plugin';

describe('viteDevProxyCookie', () => {
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

  test('should create Vite plugin with default options', () => {
    const plugin = viteDevProxyCookie({ cookieFile });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
    expect(plugin.apply).toBe('serve');
    expect(typeof plugin.configureServer).toBe('function');
    expect(typeof plugin.closeBundle).toBe('function');
  });

  test('should create plugin with debug mode enabled', () => {
    const plugin = viteDevProxyCookie({ cookieFile, debug: true });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });

  test('should create plugin with onCookieChange callback', () => {
    const onCookieChange = jest.fn();
    const plugin = viteDevProxyCookie({ cookieFile, onCookieChange });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });

  test('should handle empty cookie file', () => {
    fs.writeFileSync(cookieFile, '');
    const plugin = viteDevProxyCookie({ cookieFile });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });

  test('should handle non-existent cookie file', () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.txt');
    const plugin = viteDevProxyCookie({ cookieFile: nonExistentFile });

    expect(plugin.name).toBe('vite-dev-proxy-cookie');
  });
});