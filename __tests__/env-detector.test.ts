import { isProductionValue, detectProductionEnvironment, shouldEnableWatch } from '../src/utils/env-detector';

describe('env-detector', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isProductionValue', () => {
    test('should return true for production values', () => {
      expect(isProductionValue('production')).toBe(true);
      expect(isProductionValue('PRODUCTION')).toBe(true);
      expect(isProductionValue('Production')).toBe(true);
      expect(isProductionValue('  production  ')).toBe(true);
      expect(isProductionValue('prod')).toBe(true);
      expect(isProductionValue('prd')).toBe(true);
      expect(isProductionValue('release')).toBe(true);
    });

    test('should return false for non-production values', () => {
      expect(isProductionValue('development')).toBe(false);
      expect(isProductionValue('dev')).toBe(false);
      expect(isProductionValue('test')).toBe(false);
      expect(isProductionValue('local')).toBe(false);
      expect(isProductionValue('')).toBe(false);
    });

    test('should handle case insensitive', () => {
      expect(isProductionValue('PRODUCTION')).toBe(true);
      expect(isProductionValue('Production')).toBe(true);
      expect(isProductionValue('pRoDuCtIoN')).toBe(true);
    });

    test('should handle whitespace', () => {
      expect(isProductionValue('  production  ')).toBe(true);
      expect(isProductionValue('\tproduction\t')).toBe(true);
      expect(isProductionValue('\nproduction\n')).toBe(true);
    });
  });

  describe('detectProductionEnvironment', () => {
    test('should detect production via NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      expect(detectProductionEnvironment()).toBe(true);
    });

    test('should detect production via custom env', () => {
      process.env.MY_APP_ENV = 'production';
      expect(detectProductionEnvironment(['MY_APP_ENV'])).toBe(true);
    });

    test('should detect production via BUILD_MODE', () => {
      process.env.BUILD_MODE = 'prod';
      expect(detectProductionEnvironment()).toBe(true);
    });

    test('should detect production via CI env', () => {
      process.env.CI = 'true';
      expect(detectProductionEnvironment()).toBe(true);
    });

    test('should detect production via npm_lifecycle_event', () => {
      process.env.npm_lifecycle_event = 'build';
      expect(detectProductionEnvironment()).toBe(true);
    });

    test('should detect production via process arguments', () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--mode=production'];
      expect(detectProductionEnvironment()).toBe(true);
      process.argv = originalArgv;
    });

    test('should return false for development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(detectProductionEnvironment()).toBe(false);
    });

    test('should return false when no production indicators found', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUILD_MODE;
      delete process.env.CI;
      expect(detectProductionEnvironment()).toBe(false);
    });

    test('should log debug messages when debug is true', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.NODE_ENV = 'production';
      detectProductionEnvironment([], true, '[test]');
      expect(consoleLogSpy).toHaveBeenCalledWith('[test] Detected production via env: NODE_ENV=production');
      consoleLogSpy.mockRestore();
    });

    test('should check multiple common env names', () => {
      process.env.VUE_APP_ENV = 'production';
      expect(detectProductionEnvironment()).toBe(true);

      process.env.VUE_APP_ENV = undefined;
      process.env.VITE_NODE_ENV = 'prod';
      expect(detectProductionEnvironment()).toBe(true);
    });
  });

  describe('shouldEnableWatch', () => {
    test('should return true when watch is true', () => {
      expect(shouldEnableWatch(true)).toBe(true);
    });

    test('should return false when watch is false', () => {
      expect(shouldEnableWatch(false)).toBe(false);
    });

    test('should auto-detect and enable watch in development', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldEnableWatch('auto')).toBe(true);
    });

    test('should auto-detect and disable watch in production', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldEnableWatch('auto')).toBe(false);
    });

    test('should respect custom production envs', () => {
      process.env.MY_ENV = 'production';
      expect(shouldEnableWatch('auto', ['MY_ENV'])).toBe(false);
    });

    test('should log debug messages when debug is true', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.NODE_ENV = 'production';
      shouldEnableWatch('auto', [], true, '[test]');
      expect(consoleLogSpy).toHaveBeenCalledWith('[test] Auto-detected production mode - disabling watch');
      consoleLogSpy.mockRestore();
    });

    test('should prioritize watch over auto-detection', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldEnableWatch(true)).toBe(true);
      expect(shouldEnableWatch(false)).toBe(false);
    });

    test('should handle CI environment', () => {
      process.env.CI = 'true';
      expect(shouldEnableWatch('auto')).toBe(false);
    });

    test('should handle npm build event', () => {
      process.env.npm_lifecycle_event = 'build';
      expect(shouldEnableWatch('auto')).toBe(false);
    });
  });
});