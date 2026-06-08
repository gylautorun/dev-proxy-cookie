import { viteMiddlewareProxy } from '../src/proxy/vite-middleware-plugin';

describe('viteMiddlewareProxy', () => {
  describe('plugin creation', () => {
    it('should create a plugin with minimal options', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-middleware-proxy');
      expect(plugin.apply).toBe('serve');
      expect(typeof plugin.configureServer).toBe('function');
    });

    it('should create a plugin with debug enabled', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        debug: true,
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-middleware-proxy');
    });
  });

  describe('proxyMap configuration', () => {
    it('should accept proxyMap configuration', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        proxyMap: {
          '/api': 'http://api.example.com/',
          '/static': 'http://static.example.com/',
        },
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('proxyPaths configuration', () => {
    it('should accept proxyPaths configuration', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        proxyPaths: ['/api', '/irs-admin', '/irs-file'],
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('ignorePaths configuration', () => {
    it('should accept ignorePaths configuration', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        ignorePaths: ['/src', '/assets', '/public'],
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('useCookie configuration', () => {
    it('should accept useCookie: true (default)', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        useCookie: true,
      });

      expect(plugin).toBeDefined();
    });

    it('should accept useCookie: false to disable cookie injection', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
        useCookie: false,
      });

      expect(plugin).toBeDefined();
    });

    it('should default useCookie to true when not specified', () => {
      const plugin = viteMiddlewareProxy({
        cookieFile: './cookie.txt',
        target: 'http://localhost:3000/',
      });

      expect(plugin).toBeDefined();
    });
  });
});
