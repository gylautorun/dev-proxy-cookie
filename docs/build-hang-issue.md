# 构建进程不退出问题解决方案

## 问题描述

在使用 `dev-proxy-cookie` 时，构建完成后进程不退出，一直挂起。

## 问题原因

### 根本原因

文件监听器（基于 `chokidar`）在生产环境下仍然运行，导致 Node.js 进程无法正常退出。

### 技术细节

`chokidar` 默认使用 `persistent: true`，这会保持进程运行：

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch(cookieFile, {
  persistent: true,  // ⚠️ 导致进程不退出
});
```

### 触发场景

1. **Vue CLI 项目**：执行 `npm run build` 时
2. **Vite 项目**：执行 `npm run build` 时
3. **配置错误**：在生产环境设置了 `watch: true`

## 解决方案

### 方案一：使用 `isDev` 参数（推荐）

**优点**：
- 最直接、最明确
- 不依赖环境变量检测
- 代码可读性高

**Vue CLI 项目**：

```javascript
const { createFileCookieGetter } = require('dev-proxy-cookie');

const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: process.env.NODE_ENV === 'development',
  debug: true,
});
```

**Vite 项目**：

```typescript
import { viteDevProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteDevProxyCookie({
      cookieFile: './cookie.txt',
      isDev: process.env.NODE_ENV === 'development',
    }),
  ],
});
```

### 方案二：设置 `watch: false`

**适用场景**：
- 明确知道不需要文件监听
- 生产环境配置

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: false,  // 禁用文件监听
});
```

### 方案三：使用智能检测（默认行为）

**优点**：
- 无需手动配置
- 自动判断环境

**工作原理**：

智能检测会检查以下内容：

1. **环境变量**：
   - `NODE_ENV`
   - `BUILD_MODE`
   - `VUE_APP_ENV`
   - `VITE_NODE_ENV`
   - `WEBPACK_MODE`
   - `CI_ENV`
   - `APP_ENV`
   - `ENV`
   - `DEPLOY_ENV`
   - `RUN_MODE`

2. **CI/CD 环境标识**：
   - `CI` 环境变量

3. **npm 生命周期事件**：
   - `npm_lifecycle_event` 包含 `build`、`prod`、`prd`、`release`

4. **进程参数**：
   - `process.argv` 包含 `build`、`production`、`--mode=production`、`--prod`、`--release`

**配置方式**：

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: 'auto',  // 默认值，自动判断环境
  debug: true,
});
```

## 参数优先级

```
isDev (最高) → watch (中等) → 智能检测 (最低)
```

### 优先级示例

| isDev | watch | 智能检测 | 最终结果 |
|-------|-------|----------|----------|
| `true` | - | - | ✅ 启用监听 |
| `false` | - | - | ❌ 禁用监听 |
| - | `true` | - | ✅ 启用监听 |
| - | `false` | - | ❌ 禁用监听 |
| - | `'auto'` | 生产环境 | ❌ 禁用监听 |
| - | `'auto'` | 开发环境 | ✅ 启用监听 |

## 环境配置建议

### 开发环境

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: process.env.NODE_ENV === 'development',
  debug: true,
});
```

### 预发布环境（需要调试）

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: true,  // 强制启用监听
  debug: true,
});
```

### 生产环境

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: false,  // 强制禁用监听
  debug: false,
});
```

## 调试方法

### 启用调试日志

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: 'auto',
  debug: true,  // 输出环境检测日志
});
```

### 日志输出示例

**生产环境**：
```
[env-detector] Auto-detected production mode - disabling watch
[CookieFile] File watch disabled
```

**开发环境**：
```
[env-detector] Auto-detected development mode - enabling watch
[CookieFile] isDev=true, enabling watch
```

### 自定义环境变量检测

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  productionEnvs: ['MY_APP_ENV', 'BUILD_TYPE'],
  debug: true,
});
```

## 常见问题

### Q: 为什么智能检测没有生效？

A: 请检查：

1. 是否启用了 `debug: true` 查看日志
2. 环境变量是否正确设置
3. 是否被 `isDev` 或 `watch` 参数覆盖

### Q: 预发布环境（staging/uat）如何配置？

A: 预发布环境通常需要调试，建议：

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: true,  // 强制启用监听
  debug: true,
});
```

### Q: 如何验证文件监听是否禁用？

A: 启用 `debug: true`，查看日志输出：

- 看到 `File watch disabled` 表示已禁用
- 看到 `enabling watch` 表示已启用

## 技术实现

### 环境检测函数

```typescript
export function shouldEnableWatch(
  watch: boolean | 'auto',
  customEnvs: string[] = [],
  debug: boolean = false,
  loggerPrefix: string = '[env-detector]'
): boolean {
  // 用户显式设置为 true 或 false，直接返回
  if (typeof watch === 'boolean') {
    return watch;
  }

  // 'auto' 模式：智能检测环境
  const isProduction = detectProductionEnvironment(customEnvs, debug, loggerPrefix);
  return !isProduction;
}
```

### 使用 isDev 参数

```typescript
export function createFileCookieGetter(
  cookieFile: string,
  options: CreateFileCookieGetterOptions = {}
): () => string {
  const { watch = 'auto', debug = false, productionEnvs = [], isDev } = options;
  
  let shouldWatch: boolean;
  
  if (isDev !== undefined) {
    // 用户显式设置了 isDev 参数
    shouldWatch = isDev;
  } else {
    // 使用智能环境检测
    shouldWatch = shouldEnableWatch(watch, productionEnvs, debug, '[CookieFile]');
  }
  
  if (shouldWatch) {
    watchCookieFile(cookieFile, onCookieChange, onError);
  }
  
  return () => reader.readCookie();
}
```

## 总结

1. **推荐使用 `isDev` 参数**：最直接、最明确
2. **默认使用智能检测**：无需手动配置，自动判断环境
3. **预发布环境需要调试**：显式设置 `isDev: true`
4. **生产环境禁用监听**：避免构建进程不退出
5. **启用调试日志**：方便排查问题

## 相关文档

- [README.md](../README.md) - 完整使用文档
- [env-detector.ts](../src/utils/env-detector.ts) - 环境检测实现
