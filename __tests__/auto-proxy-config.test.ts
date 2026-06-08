import { createAutoProxyConfig } from '../src/proxy/vue-proxy-config';

describe('createAutoProxyConfig', () => {
  test('should create auto proxy config with default options', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
    });

    expect(config['/']).toBeDefined();
    expect(config['/'].target).toBe('http://localhost:8080');
    expect(config['/'].ws).toBe(false);
    expect(config['/'].changeOrigin).toBe(true);
    expect(config['/'].secure).toBe(false);
  });

  test('should create config with ignorePaths', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/', '/img/'],
    });

    expect(config['/']).toBeDefined();
    expect(config['/'].target).toBe('http://localhost:8080');
  });

  test('should create config with includePaths', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      includePaths: ['/api/'],
    });

    expect(config['/']).toBeUndefined();
    expect(config['/api/']).toBeDefined();
    expect(config['/api/'].target).toBe('http://localhost:8080');
  });

  test('should create config with getCookie', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
    });

    expect(config['/']).toBeDefined();
    expect(config['/'].target).toBe('http://localhost:8080');
  });

  test('should create config with debug mode', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      debug: true,
    });

    expect(config['/']).toBeDefined();
    expect(config['/'].target).toBe('http://localhost:8080');
  });

  test('should create config with custom headers', () => {
    const headers = { host: 'example.com', origin: 'http://example.com' };
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      headers,
    });

    expect(config['/']).toBeDefined();
    expect(config['/'].headers).toEqual(headers);
  });

  test('should create config with additional proxies', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      additionalProxies: {
        '/api/': 'http://api-server:8081',
        '/mock/': 'http://mock-server:3000',
      },
    });

    expect(config['/']).toBeDefined();
    expect(config['/api/']).toBeDefined();
    expect(config['/mock/']).toBeDefined();
    expect(config['/'].target).toBe('http://localhost:8080');
    expect(config['/api/'].target).toBe('http://api-server:8081');
    expect(config['/mock/'].target).toBe('http://mock-server:3000');
  });

  test('should inject cookie for included paths', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      includePaths: ['/api/'],
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/api/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should create multiple include paths', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      includePaths: ['/api/', '/digital-op/', '/examine/'],
    });

    expect(config['/']).toBeUndefined();
    expect(config['/api/']).toBeDefined();
    expect(config['/digital-op/']).toBeDefined();
    expect(config['/examine/']).toBeDefined();
    expect(config['/api/'].target).toBe('http://localhost:8080');
    expect(config['/digital-op/'].target).toBe('http://localhost:8080');
    expect(config['/examine/'].target).toBe('http://localhost:8080');
  });

  test('should skip ignored paths', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/'],
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/assets/style.css', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should inject cookie for non-ignored paths', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      ignorePaths: ['/assets/'],
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should handle empty includePaths array', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      includePaths: [],
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should handle empty ignorePaths array', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      ignorePaths: [],
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should not inject cookie when getCookie returns empty string', () => {
    const mockGetCookie = jest.fn().mockReturnValue('');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should not inject cookie when getCookie is not provided', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should create additional proxies with getCookie', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      additionalProxies: {
        '/api/': 'http://api-server:8081',
      },
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/api/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should create additional proxies with headers', () => {
    const headers = { host: 'api.example.com' };
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      additionalProxies: {
        '/api/': 'http://api-server:8081',
      },
      headers,
    });

    expect(config['/api/'].headers).toEqual(headers);
  });

  test('should handle onError callback', () => {
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
    });

    const mockErr = new Error('Test error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    config['/'].onError?.(mockErr);

    expect(consoleSpy).toHaveBeenCalledWith('\n[Proxy Error]', 'Test error');
    consoleSpy.mockRestore();
  });

  test('should inject cookie when useCookie is true (default)', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
      useCookie: true,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should not inject cookie when useCookie is false', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
      useCookie: false,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should default useCookie to true when not specified', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockGetCookie).toHaveBeenCalled();
    expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'test-cookie');
  });

  test('should respect useCookie: false for includePaths', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
      useCookie: false,
      includePaths: ['/api/'],
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/api/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('should respect useCookie: false for additionalProxies', () => {
    const mockGetCookie = jest.fn().mockReturnValue('test-cookie');
    const config = createAutoProxyConfig({
      target: 'http://localhost:8080',
      getCookie: mockGetCookie,
      useCookie: false,
      additionalProxies: {
        '/api/': 'http://api-server:8081',
      },
    });

    const mockProxyReq = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const mockReq = { url: '/api/users', method: 'GET' } as any;

    config['/api/'].onProxyReq(mockProxyReq, mockReq);

    expect(mockProxyReq.setHeader).not.toHaveBeenCalled();
  });
});
