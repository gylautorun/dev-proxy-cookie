import { defineConfig } from 'tsup';

export default defineConfig([
  // 未压缩版本 - 匹配 package.json 配置
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    clean: true,
    external: ['vite'],
    minify: false,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.mjs',
      };
    },
  },
  // 压缩版本
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    splitting: false,
    clean: false,
    external: ['vite'],
    minify: true,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.min.js' : '.min.mjs',
      };
    },
  },
]);
