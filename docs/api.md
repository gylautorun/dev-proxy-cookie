# API 文档

## 导出模块

### Vite 插件

```javascript
import { viteMiddlewareProxy } from 'dev-proxy-cookie'
```

### Vue CLI 工具

```javascript
const { createVueProxyConfig, createFileCookieGetter, FileCookieReader } = require('dev-proxy-cookie')
```

---

## viteMiddlewareProxy

Vite 中间件代理插件，用于自动代理和 Cookie 注入。**兼容所有 Vite 版本**。

### 类型定义

```typescript
interface ViteMiddlewareProxyOptions {
  cookieFile: string;
  target: string;
  debug?: boolean;
  proxyMap?: Record<string, string>;
  proxyPaths?: string[];
  ignorePaths?: string[];
}

function viteMiddlewareProxy(options: ViteMiddlewareProxyOptions): Plugin;
```

### 参数说明

| 参数          | 类型     | 必填 | 说明                              |
| ------------- | -------- | ---- | --------------------------------- |
| `cookieFile`  | string   | 是   | Cookie 文件路径                   |
| `target`      | string   | 是   | 默认代理目标地址                  |
| `debug`       | boolean  | 否   | 是否启用调试模式，默认 `false`   |
| `proxyMap`    | object   | 否   | 自定义代理映射表                  |
| `proxyPaths`  | string[] | 否   | 需要代理的路径前缀列表            |
| `ignorePaths` | string[] | 否   | 需要忽略的路径列表（不代理）      |

### 使用示例

```javascript
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  debug: true,
  proxyMap: { '/mock/': 'http://localhost:3000' },
  proxyPaths: ['/api', '/cas'],
  ignorePaths: ['/assets/', '/public/'],
})
```

---

## createVueProxyConfig

创建 Vue CLI devServer 代理配置。

### 类型定义

```typescript
interface VueProxyConfigOptions {
  getCookie?: () => string;
  debug?: boolean;
  headers?: Record<string, string>;
}

function createVueProxyConfig(
  target: string,
  options?: VueProxyConfigOptions
): ProxyConfig;
```

### 参数说明

| 参数          | 类型     | 必填 | 说明                             |
| ------------- | -------- | ---- | -------------------------------- |
| `target`    | string   | 是   | 代理目标地址                     |
| `getCookie` | function | 否   | Cookie 获取函数                  |
| `debug`     | boolean  | 否   | 是否启用调试模式，默认 `false` |
| `headers`   | object   | 否   | 自定义请求头                     |

### 返回值

返回标准的 Webpack devServer proxy 配置对象。

### 使用示例

```javascript
const { createVueProxyConfig } = require('dev-proxy-cookie')

createVueProxyConfig('http://localhost:8080', {
  getCookie: () => 'JSESSIONID=abc123',
  debug: true,
  headers: { host: 'localhost:8080' },
})
```

---

## createAutoProxyConfig

创建自动代理配置，代理所有请求到目标服务器。

### 类型定义

```typescript
interface AutoProxyConfigOptions extends VueProxyConfigOptions {
  target: string;
  ignorePaths?: string[];
  additionalProxies?: Record<string, string>;
}

function createAutoProxyConfig(
  options: AutoProxyConfigOptions
): Record<string, ProxyConfig>;
```

### 参数说明

| 参数                  | 类型     | 必填 | 说明                             |
| --------------------- | -------- | ---- | -------------------------------- |
| `target`            | string   | 是   | 默认代理目标地址                 |
| `getCookie`         | function | 否   | Cookie 获取函数                  |
| `debug`             | boolean  | 否   | 是否启用调试模式，默认 `false` |
| `headers`           | object   | 否   | 自定义请求头                     |
| `includePaths`      | string[] | 否   | 只代理这些路径（白名单模式）     |
| `ignorePaths`       | string[] | 否   | 忽略这些路径（黑名单模式）       |
| `additionalProxies` | object   | 否   | 额外的代理配置                   |

### 返回值

返回代理配置对象，包含默认代理（`/`）和额外代理。

### 使用示例

```javascript
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt')

const proxyConfig = createAutoProxyConfig({
  target: 'http://localhost:8080',
  getCookie,
  debug: true,
  ignorePaths: ['/assets/', '/img/'],
  additionalProxies: {
    '/mock/': 'http://localhost:3000',
  },
})

// 在 vue.config.js 中使用
module.exports = {
  devServer: {
    proxy: proxyConfig,
  },
}
```

---

## createFileCookieGetter

创建 Cookie 文件读取器，支持文件监听。

### 类型定义

```typescript
interface FileCookieGetterOptions {
  watch?: boolean;
  debug?: boolean;
}

function createFileCookieGetter(
  filePath: string,
  options?: FileCookieGetterOptions
): () => string;
```

### 参数说明

| 参数         | 类型    | 必填 | 说明                             |
| ------------ | ------- | ---- | -------------------------------- |
| `filePath` | string  | 是   | Cookie 文件路径                  |
| `watch`    | boolean | 否   | 是否监听文件变化，默认 `false` |
| `debug`    | boolean | 否   | 是否输出调试日志，默认 `false` |

### 返回值

返回一个函数，调用时返回当前 Cookie 字符串。

### 使用示例

```javascript
const { createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,
  debug: true,
})

// 获取 Cookie
console.log(getCookie())
```

---

## FileCookieReader

Cookie 文件读取器类。

### 类型定义

```typescript
class FileCookieReader {
  constructor(options: { cookieFile: string }, debug?: boolean);
  readCookie(): string;
}
```

### 方法说明

| 方法             | 说明                     |
| ---------------- | ------------------------ |
| `readCookie()` | 读取并返回 Cookie 字符串 |

### 使用示例

```javascript
const { FileCookieReader } = require('dev-proxy-cookie')

const reader = new FileCookieReader({ cookieFile: './cookie.txt' }, true)

// 读取 Cookie
console.log(reader.readCookie())
```

---

## 类型定义汇总

### ViteMiddlewareProxyOptions

```typescript
interface ViteMiddlewareProxyOptions {
  cookieFile: string;
  target: string;
  debug?: boolean;
  proxyMap?: Record<string, string>;
  proxyPaths?: string[];
  ignorePaths?: string[];
}
```

### VueProxyConfigOptions

```typescript
interface VueProxyConfigOptions {
  getCookie?: () => string;
  debug?: boolean;
  headers?: Record<string, string>;
}
```

### FileCookieGetterOptions

```typescript
interface FileCookieGetterOptions {
  watch?: boolean;
  debug?: boolean;
}
```

---

## 导出清单

| 导出名称                   | 类型     | 说明                     |
| -------------------------- | -------- | ------------------------ |
| `viteMiddlewareProxy`     | function | Vite 中间件代理插件      |
| `createVueProxyConfig`    | function | 创建 Vue CLI 代理配置    |
| `createFileCookieGetter`  | function | 创建 Cookie 获取器       |
| `FileCookieReader`        | class    | Cookie 文件读取器        |
| `createAutoProxyConfig`   | function | 创建自动代理配置         |
