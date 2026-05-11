import * as fs from 'fs';
import * as path from 'path';
import { viteAutoProxyCookie } from '../src/proxy/vite-plugin';
import { createAutoProxyCookie } from '../src/proxy/core';

describe('viteAutoProxyCookie', () => {
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
    const plugin = viteAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
    expect(plugin.apply).toBe('serve');
    expect(typeof plugin.configureServer).toBe('function');
    expect(typeof plugin.closeBundle).toBe('function');
  });

  test('should create Vite plugin with custom name', () => {
    const plugin = viteAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      name: 'custom-proxy-plugin',
    });

    expect(plugin.name).toBe('custom-proxy-plugin');
  });

  test('should create plugin with debug mode enabled', () => {
    const plugin = viteAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      debug: true,
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });

  test('should create plugin with autoRestart disabled', () => {
    const plugin = viteAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRestart: false,
    });

    expect(plugin.name).toBe('vite-auto-proxy-cookie');
  });
});

describe('AutoProxyCookie hooks', () => {
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

  test('should call onProxyReq hook', () => {
    const onProxyReq = jest.fn();
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      hooks: { onProxyReq },
    });

    const mockProxyReq = { setHeader: jest.fn(), getHeader: jest.fn().mockReturnValue(null) };
    const mockReq = { url: '/api/test', method: 'GET' } as any;
    const mockRes = {} as any;

    (autoProxy as any).handleOnProxyReq(mockProxyReq, mockReq, mockRes, {});

    expect(onProxyReq).toHaveBeenCalled();
  });

  test('should call onProxyRes hook', () => {
    const onProxyRes = jest.fn();
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      hooks: { onProxyRes },
    });

    const mockProxyRes = { statusCode: 200 };
    const mockReq = { url: '/api/test' } as any;
    const mockRes = { setHeader: jest.fn() } as any;

    (autoProxy as any).handleOnProxyRes(mockProxyRes, mockReq, mockRes);

    expect(onProxyRes).toHaveBeenCalled();
  });

  test('should call onError hook', () => {
    const onError = jest.fn();
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      hooks: { onError },
    });

    const mockErr = new Error('Test error');
    const mockReq = { url: '/api/test' } as any;
    const mockRes = {} as any;

    (autoProxy as any).handleOnError(mockErr, mockReq, mockRes);

    expect(onError).toHaveBeenCalled();
  });

  test('should call onWsError hook', () => {
    const onWsError = jest.fn();
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      hooks: { onWsError },
    });

    const mockErr = new Error('WebSocket error');
    const mockReq = { url: '/ws/test' } as any;
    const mockSocket = { close: jest.fn() };

    (autoProxy as any).handleOnWsError(mockErr, mockReq, mockSocket);

    expect(onWsError).toHaveBeenCalled();
  });

  test('should merge custom hooks with default hooks', () => {
    const onProxyReq = jest.fn();
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      hooks: { onProxyReq },
    });

    expect((autoProxy as any).options.hooks.onProxyReq).toBe(onProxyReq);
    expect((autoProxy as any).options.hooks.onProxyRes).toBeDefined();
    expect((autoProxy as any).options.hooks.onError).toBeDefined();
    expect((autoProxy as any).options.hooks.onWsError).toBeDefined();
  });
});

describe('AutoProxyCookie logging', () => {
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
    jest.restoreAllMocks();
  });

  test('should respect logLevel option', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      logLevel: 'error',
    });

    expect((autoProxy as any).options.logLevel).toBe('error');
  });

  test('should set default logLevel to info', () => {
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
    });

    expect((autoProxy as any).options.logLevel).toBe('info');
  });

  test('should handle cookie change with autoRestart', () => {
    const markerFile = path.join(testDir, '.restart-marker');
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRestart: true,
      restartMarkerFile: markerFile,
    });

    (autoProxy as any).handleCookieChange('JSESSIONID=new');

    expect(fs.existsSync(markerFile)).toBe(true);
    const markerContent = JSON.parse(fs.readFileSync(markerFile, 'utf-8'));
    expect(markerContent.cookie).toBe('JSESSIONID=new');
    expect(markerContent.timestamp).toBeDefined();
  });

  test('should not write marker when cookie is unchanged', () => {
    const markerFile = path.join(testDir, '.restart-marker');
    const autoProxy = createAutoProxyCookie({
      cookieFile,
      target: 'http://localhost:8080',
      autoRestart: true,
      restartMarkerFile: markerFile,
    });

    (autoProxy as any).currentCookie = 'JSESSIONID=same';
    (autoProxy as any).handleCookieChange('JSESSIONID=same');

    expect(fs.existsSync(markerFile)).toBe(false);
  });
});