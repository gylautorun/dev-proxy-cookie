# dev-proxy-cookie

开发环境代理 Cookie 注入工具，支持文件监听自动重载和自动代理。

## 功能特性

- 🚀 **Vue CLI 兼容**：提供 `createVueProxyConfig`，完美兼容 vue.config.js 的代理配置方式
- ⚡ **Vite 插件支持**：开箱即用的 Vite 插件，支持自动代理所有请求
- 📁 **Cookie 文件监听**：监听 Cookie 文件变化，实时更新请求，无需重启服务器
- 🎯 **自动代理**：可选的自动代理所有请求功能，无需手动配置每个路径
- 🔄 **双向模式**：支持白名单模式（`includePaths`）和黑名单模式（`ignorePaths`）
- 🔌 **钩子函数**：支持 `onProxyReq`、`onProxyRes`、`onError`、`onWsError` 等钩子
- ⚙️ **代理配置**：支持 `ws`、`changeOrigin`、`secure`、`followRedirects` 等完整代理选项
- 🛠️ **工具类**：提供 `CookieReader` 和 `CookieWatcher` 基础工具类

## 安装

```bash
npm install dev-proxy-cookie
# 或
pnpm add dev-proxy-cookie
# 或
yarn add dev-proxy-cookie
```

## 使用方法

### Vue CLI 项目 (vue.config.js) - 标准方式

```javascript
const path = require('path');
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

const _target = 'http://10.17.33.33/';
const cookieFile = path.resolve(__dirname, './cookie.txt');
const getCookie = createFileCookieGetter(cookieFile);

module.exports = {
  devServer: {
    proxy: {
      '/examine/': createVueProxyConfig(_target, { getCookie }),
      '/cas/': createVueProxyConfig(_target, { getCookie }),
      '/mock/': createVueProxyConfig('http://localhost:3000'),
    },
  },
};
```

### Vue CLI 项目 (vue.config.js) - 自动代理所有接口

使用 `createAutoProxyConfig` 自动代理所有请求：

```javascript
const path = require('path');
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,   // 监听文件变化
  debug: true,   // 输出调试日志
});

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://10.17.33.33:10000',
      getCookie,
      debug: true,
      // WebSocket 支持
      ws: true,
      changeOrigin: true,
      secure: false,
  
      // 白名单模式 - 只代理这些路径
      // includePaths: ['/api/', '/cas/', '/examine/'],
  
      // 黑名单模式 - 忽略这些路径
      ignorePaths: ['/assets/', '/img/', '/public/', '/favicon.ico'],
  
      // 额外的代理配置（优先级最高）
      additionalProxies: {
        '/mock/': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
  
      // 自定义请求头
      headers: {
        host: '10.17.33.33',
        origin: 'http://10.17.33.33',
      },
  
      // 钩子函数
      hooks: {
        onProxyReq: (proxyReq, req, res) => {
          console.log('[Proxy] Request:', req.method, req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('[Proxy] Response:', req.url, proxyRes.statusCode);
        },
        onError: (err, req, res) => {
          console.error('[Proxy] Error:', err.message);
        },
      },
    }),
  },
};
```

### Vite 项目 (vite.config.js) - 自动代理

```javascript
import { defineConfig } from 'vite';
import { viteAutoProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteAutoProxyCookie({
      // 必需配置
      cookieFile: './cookie.txt',
      target: 'http://10.17.33.33',
  
      // 调试模式
      debug: true,
  
      // Cookie变化时自动重启开发服务器（需要外部脚本配合）
      autoRestart: true,
  
      // WebSocket 支持
      ws: true,
      changeOrigin: true,
      secure: false,
      followRedirects: true,
  
      // 自定义代理映射
      proxyMap: {
        '/mock/': 'http://localhost:3000',
      },
  
      // 忽略的路径
      ignorePaths: ['/assets/', '/img/', '/public/'],
  
      // 钩子函数
      hooks: {
        onProxyReq: (proxyReq, req, res) => {
          console.log('[Proxy] Request:', req.method, req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('[Proxy] Response:', req.url, proxyRes.statusCode);
        },
        onError: (err, req, res) => {
          console.error('[Proxy] Error:', err.message);
        },
        onWsError: (err, req, socket) => {
          console.error('[Proxy] WebSocket Error:', err.message);
        },
      },
    }),
  ],
});
```

### Vite 项目 (vite.config.js) - 基础 Cookie 注入

```javascript
import { defineConfig } from 'vite';
import { viteDevProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteDevProxyCookie({
      cookieFile: './cookie.txt',
      debug: true,
      onCookieChange: (cookie) => {
        console.log('Cookie updated:', cookie);
      },
    }),
  ],
});
```

## API 文档

### Vue CLI 相关

#### createVueProxyConfig(target, options)

创建兼容 Vue CLI 的代理配置。

**参数：**

- `target` (string): 目标服务器地址（必需）
- `options` (object):
  - `getCookie` (() => string): 获取当前 Cookie 的函数
  - `debug` (boolean): 是否开启调试日志，默认 `false`
  - `headers` (object): 自定义请求头
  - `ws` (boolean): WebSocket 支持，默认 `false`
  - `changeOrigin` (boolean): 是否改变请求来源，默认 `true`
  - `secure` (boolean): 是否验证 SSL 证书，默认 `false`
  - `followRedirects` (boolean): 是否跟随重定向，默认 `true`
  - `hooks` (object): 钩子函数配置

**返回值：**
标准的代理配置对象，可直接用于 vue.config.js。

#### createAutoProxyConfig(options)

创建自动代理配置，代理所有请求到目标服务器。

**参数：**

- `target` (string): 默认代理目标地址（必需）
- `getCookie` (() => string): Cookie 获取函数
- `debug` (boolean): 是否开启调试日志，默认 `false`
- `ws` (boolean): WebSocket 支持，默认 `false`
- `changeOrigin` (boolean): 是否改变请求来源，默认 `true`
- `secure` (boolean): 是否验证 SSL 证书，默认 `false`
- `followRedirects` (boolean): 是否跟随重定向，默认 `true`
- `autoRewrite` (boolean): 自动重写路径，默认 `false`
- `protocolRewrite` (string): 协议重写（http/https）
- `cookieDomainRewrite` (boolean | string | object): Cookie 域名重写
- `cookiePathRewrite` (boolean | string | object): Cookie 路径重写
- `headers` (object): 自定义请求头
- `logLevel` (string): 日志级别（debug/info/warn/error），默认 `info`
- `includePaths` (string[]): 只代理这些路径（白名单模式）
- `ignorePaths` (string[]): 忽略这些路径（黑名单模式）
- `additionalProxies` (object): 额外的代理配置
- `hooks` (object): 钩子函数配置

**工作原理：**

- **白名单模式**：设置 `includePaths` 后，只有匹配的路径才会被代理
- **黑名单模式**：设置 `ignorePaths` 后，除这些路径外其他都代理
- **优先级**：`includePaths` > `ignorePaths`，`additionalProxies` 优先级最高

#### createFileCookieGetter(cookieFile, options)

快速创建 Cookie 获取函数，自动监听文件变化。

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,   // 是否监听文件变化，默认 false
  debug: true,   // 是否输出调试日志，默认 false
});
```

### Vite 相关

#### viteAutoProxyCookie(options)

Vite 插件，自动配置代理和 Cookie 注入。

**选项：**

- `cookieFile` (string): Cookie 文件路径（必需）
- `target` (string): 默认代理目标（必需）
- `debug` (boolean): 是否开启调试日志，默认 `false`
- `autoRestart` (boolean): 是否启用自动重启标记，默认 `true`
- `restartMarkerFile` (string): 重启标记文件路径，默认 `.cookie-restart-marker`
- `ws` (boolean): WebSocket 支持，默认 `true`
- `changeOrigin` (boolean): 是否改变请求来源，默认 `true`
- `secure` (boolean): 是否验证 SSL 证书，默认 `false`
- `followRedirects` (boolean): 是否跟随重定向，默认 `true`
- `proxyMap` (object): 特定路径映射
- `includePaths` (string[]): 只代理这些路径
- `ignorePaths` (array): 忽略的路径
- `hooks` (object): 钩子函数配置

#### viteDevProxyCookie(options)

Vite 插件，基础 Cookie 注入功能。

**选项：**

- `cookieFile` (string): Cookie 文件路径（必需）
- `debug` (boolean): 是否开启调试日志，默认 `false`
- `onCookieChange` ((cookie: string) => void): Cookie 变化回调

### 工具类

#### CookieReader

Cookie 文件读取器。

```javascript
import { CookieReader } from 'dev-proxy-cookie';

const reader = new CookieReader({ 
  cookieFile: './cookie.txt',
  encoding: 'utf-8',  // 文件编码，默认 utf-8
});
const cookie = reader.readCookie();
```

**方法：**

- `readCookie()`: 读取并返回 Cookie 字符串
- `ensureCookieFile()`: 确保 Cookie 文件存在，不存在则创建

#### CookieWatcher

Cookie 文件监听器，基于 chokidar。

```javascript
import { CookieWatcher } from 'dev-proxy-cookie';

const watcher = new CookieWatcher({
  cookieFile: './cookie.txt',
  onCookieChange: (cookie) => {
    console.log('Cookie changed:', cookie);
  },
  onError: (error) => {
    console.error('Watcher error:', error);
  },
  autoCreateFile: true,  // 自动创建文件，默认 true
});

watcher.start();
// watcher.stop();
```

**方法：**

- `start()`: 开始监听
- `stop()`: 停止监听
- `getCurrentCookie()`: 获取当前 Cookie 值

### 钩子函数

钩子函数允许你在代理过程中插入自定义逻辑。

```javascript
hooks: {
  // 请求代理前触发
  onProxyReq: (proxyReq, req, res) => {
    console.log('[Proxy] Request:', req.method, req.url);
    // 可以修改 proxyReq 来添加自定义请求头
    proxyReq.setHeader('X-Custom-Header', 'value');
  },
  
  // 响应代理前触发
  onProxyRes: (proxyRes, req, res) => {
    console.log('[Proxy] Response:', req.url, proxyRes.statusCode);
    // 可以修改 proxyRes.headers 来修改响应头
  },
  
  // 代理错误时触发
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    // 可以自定义错误响应
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  },
  
  // WebSocket 错误时触发
  onWsError: (err, req, socket) => {
    console.error('[Proxy] WebSocket Error:', err.message);
    socket.close();
  },
}
```

## Cookie 文件格式

支持两种格式：

### 格式一：单行模式

```
JSESSIONID=abc123; user=admin; token=xyz789
```

### 格式二：多行模式（推荐）

每行一个 Cookie，支持注释：

```
# ============================================================
# 开发环境 Cookie 配置文件
# ============================================================
# 说明：
#   1. 每行一个 Cookie 键值对
#   2. 以 # 开头的行是注释
#   3. Cookie 值末尾的分号可选
#   4. 修改此文件后，代理会自动更新 Cookie（无需重启服务器）
# ============================================================

# IRS 会话凭证
irs-session-id=YTFmYjk0YmQtNTdhZS00ZGFkLThiYTYtNDM3NDc4MzJmYTg4

# 用户会话前缀
uc_session_pre=ttcm1f6JnH2lPpMVLNvHg4bP3LaK6DcQ42O1FoE1xXLBoZNq24qmrcoAlLrYL7M1Y6KG/tOuzcw7TMuXL80orQ==

# DOS 会话凭证
dos-session-id=YWQxMWUwMTktZjI4Yi00NzNmLTkzOTItMWFmMzBiZTYzZTBm
```

**注意**：多行模式下，空行和以 `#` 开头的注释行会被自动过滤。

## 项目结构

```
src/
├── proxy/              # 代理模块
│   ├── core.ts         # 代理核心逻辑
│   ├── vite-plugin.ts  # Vite自动代理插件
│   ├── vite-cookie-plugin.ts  # Vite Cookie插件
│   └── webpack-plugin.ts      # Webpack代理配置
├── utils/              # 工具模块
│   ├── cookie-reader.ts   # Cookie读取器（支持注释过滤）
│   └── cookie-watcher.ts  # Cookie文件监听
└── index.ts            # 主导出
```

## 配置选项汇总

### 代理服务器配置

| 选项                    | 类型                  | 默认值 | 说明                   |
| ----------------------- | --------------------- | ------ | ---------------------- |
| `ws`                  | boolean               | false  | WebSocket 支持         |
| `changeOrigin`        | boolean               | true   | 是否改变请求来源       |
| `secure`              | boolean               | false  | 是否验证 SSL 证书      |
| `followRedirects`     | boolean               | true   | 是否跟随重定向         |
| `autoRewrite`         | boolean               | false  | 自动重写路径           |
| `protocolRewrite`     | string                | -      | 协议重写（http/https） |
| `cookieDomainRewrite` | boolean/string/object | -      | Cookie 域名重写        |
| `cookiePathRewrite`   | boolean/string/object | -      | Cookie 路径重写        |
| `headers`             | object                | -      | 自定义请求头           |
| `logLevel`            | string                | 'info' | 日志级别               |

### 路径过滤配置

| 选项                                 | 类型     | 说明                       |
| ------------------------------------ | -------- | -------------------------- |
| `includePaths`                     | string[] | 白名单模式，只代理这些路径 |
| `ignorePaths`                      | string[] | 黑名单模式，忽略这些路径   |
| `proxyMap` / `additionalProxies` | object   | 额外代理配置，优先级最高   |

### Cookie 配置

| 选项           | 类型     | 默认值 | 说明             |
| -------------- | -------- | ------ | ---------------- |
| `cookieFile` | string   | -      | Cookie 文件路径  |
| `getCookie`  | function | -      | Cookie 获取函数  |
| `watch`      | boolean  | false  | 是否监听文件变化 |
| `debug`      | boolean  | false  | 是否输出调试日志 |

## 注意事项

1. **Cookie 文件变化**：Cookie 文件变化后，代理会立即使用新的 Cookie，无需重启服务器
2. **Git 忽略**：建议将 Cookie 文件添加到 `.gitignore`
3. **Vue CLI vs Vite**：Vue CLI 项目建议使用 `createVueProxyConfig` 或 `createAutoProxyConfig`，Vite 项目建议使用 `viteAutoProxyCookie`
4. **自动重启**：`autoRestart` 选项会在 Cookie 变化时写入标记文件，需要外部脚本配合检测重启
5. **路径优先级**：`includePaths` 和 `ignorePaths` 不能同时生效，`includePaths` 优先
6. **代理映射优先级**：`proxyMap`（Vite）或 `additionalProxies`（Vue CLI）中的路径不受 `includePaths`/`ignorePaths` 限制
7. **Cookie 格式**：支持单行和多行格式，多行格式支持注释（以 `#` 开头）

## 最佳实践

```javascript
// cookie.txt - 存放登录后的 Cookie
session-id=abc123
uc_session_pre=xyz789
xxx-session-id=def456

// .gitignore - 忽略敏感文件
cookie.txt
.cookie-restart-marker

// vue.config.js - Vue CLI 项目配置
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://localhost:3000',
      getCookie: createFileCookieGetter('./cookie.txt', { watch: true }),
      ignorePaths: ['/assets/', '/public/'],
    }),
  },
};

// vite.config.js - Vite 项目配置
import { viteAutoProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteAutoProxyCookie({
      cookieFile: './cookie.txt',
      target: 'http://localhost:3000',
      ignorePaths: ['/assets/', '/public/'],
    }),
  ],
});
```

## 常见问题

### Q: Cookie 文件修改后没有生效？

A: 请检查：

1. 是否启用了 `watch: true` 选项
2. 控制台是否输出了 `[CookieWatcher] Cookie updated from file`
3. 如果是第一次配置，可能需要重启开发服务器

### Q: 如何获取浏览器中的 Cookie？

A:

1. 打开浏览器访问目标系统并登录
2. 打开开发者工具（F12）→ Application → Cookies
3. 复制需要的 Cookie 值
4. 粘贴到 `cookie.txt` 文件中

### Q: Cookie 值包含特殊字符导致错误？

A: Cookie 值会被自动处理，支持包含 `/`、`+`、`=` 等特殊字符。如果出现 `ERR_INVALID_CHAR` 错误，请检查是否有不可见字符或注释格式错误。

### Q: 如何调试代理请求？

A: 启用 `debug: true` 选项，控制台会输出详细的代理日志。也可以在 `hooks.onProxyReq` 中添加自定义日志。

## 发布流程

完整的发布流程文档请查看：[docs/release.md](docs/release.md)

## License

MIT License
