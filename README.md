# dev-proxy-cookie

开发环境代理 Cookie 注入工具，支持文件监听自动重载和自动代理。兼容 Vue CLI 和所有版本的 Vite。

## 功能特性

- 🚀 **Vue CLI 兼容**：提供 `createVueProxyConfig`，完美兼容 vue.config.js 的代理配置方式
- ⚡ **Vite 插件支持**：开箱即用的 Vite 中间件插件，兼容所有 Vite 版本（2.x/3.x/4.x/5.x）
- 📁 **Cookie 文件监听**：监听 Cookie 文件变化，实时更新请求，无需重启服务器
- 🎯 **自动代理**：可选的自动代理所有请求功能，无需手动配置每个路径
- 🔄 **双向模式**：支持白名单模式（`includePaths`）和黑名单模式（`ignorePaths`）
- 🔌 **钩子函数**：支持 `onProxyReq`、`onProxyRes`、`onError` 等钩子
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

### Vite 项目 (vite.config.js) - 自动代理（推荐）

使用 `viteMiddlewareProxy` 插件，兼容所有 Vite 版本：

```javascript
import { defineConfig } from 'vite';
import { viteMiddlewareProxy } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      // 必需配置
      cookieFile: './cookie.txt',
      target: 'http://10.17.33.33',

      // 调试模式
      debug: true,

      // WebSocket 支持
      ws: true,
      changeOrigin: true,
      secure: false,
      followRedirects: true,

      // 自定义代理映射（优先级最高）
      proxyMap: {
        '/digital-platform': 'http://223.4.72.251:8816/',
        '/robot': 'https://oapi.dingtalk.com/',
        '/irs-assessments/api/zbdf': 'http://10.249.160.193:8003',
      },

      // 默认代理路径（代理到 target）
      proxyPaths: [
        '/irs-assessments/api',
        '/irs-file/api',
        '/irs-admin/api',
        '/api',
      ],

      // 忽略的路径（不代理）
      ignorePaths: ['/assets/', '/img/', '/public/', '/src/'],

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
  ],
});
```

### 使用账号密码登录（禁用 Cookie 注入）

当需要使用账号密码登录时，设置 `useCookie: false`，避免覆盖浏览器的登录 Cookie：

```javascript
import { defineConfig } from 'vite';
import { viteMiddlewareProxy } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target: 'http://10.17.33.33',
      useCookie: false,  // 禁用 Cookie 注入，使用浏览器发送的 Cookie
      debug: true,
      proxyPaths: ['/api'],
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
  watch: true,   // 是否监听文件变化，默认 'auto'
  debug: true,   // 是否输出调试日志，默认 false
  isDev: process.env.NODE_ENV === 'development',  // 是否为开发环境（优先级最高）
});
```

**选项：**

- `cookieFile` (string): Cookie 文件路径（必需）
- `watch` (boolean | 'auto'): 是否监听文件变化，默认 `'auto'`
  - `true`: 始终监听
  - `false`: 从不监听
  - `'auto'`: 根据环境自动判断（默认）
- `debug` (boolean): 是否输出调试日志，默认 `false`
- `productionEnvs` (string[]): 自定义生产环境变量列表，用于判断是否禁用监听
- `isDev` (boolean): 是否为开发环境（优先级最高）
  - 设置此参数后，将直接决定是否启用文件监听
  - `true`: 启用监听（开发模式）
  - `false`: 禁用监听（生产模式）

**参数优先级：**

```
isDev (最高) → watch (中等) → 智能检测 (最低)
```

### Vite 相关

#### viteMiddlewareProxy(options)

Vite 中间件插件，自动配置代理和 Cookie 注入，兼容所有 Vite 版本。

**选项：**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cookieFile` | string | - | Cookie 文件路径（必需） |
| `target` | string | - | 默认代理目标（必需） |
| `debug` | boolean | false | 是否开启调试日志 |
| `ws` | boolean | true | WebSocket 支持 |
| `changeOrigin` | boolean | true | 是否改变请求来源 |
| `secure` | boolean | false | 是否验证 SSL 证书 |
| `followRedirects` | boolean | true | 是否跟随重定向 |
| `proxyMap` | object | {} | 特定路径映射（优先级最高） |
| `proxyPaths` | string[] | [] | 默认代理路径列表 |
| `ignorePaths` | string[] | [] | 忽略的路径 |
| `hooks` | object | {} | 钩子函数配置 |

**路径匹配优先级：**

1. `proxyMap` - 自定义路径映射（最高优先级）
2. `proxyPaths` - 默认代理路径
3. `ignorePaths` - 忽略路径（不代理）

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
dev-proxy-cookie/
├── src/
│   ├── proxy/
│   │   ├── core.ts              # 代理核心逻辑
│   │   ├── vite-middleware-plugin.ts  # Vite 中间件插件（兼容所有版本）
│   │   ├── vue-proxy-config.ts  # Vue CLI 代理配置
│   │   └── index.ts             # 代理模块导出
│   ├── utils/
│   │   ├── cookie-reader.ts     # Cookie 文件读取器
│   │   ├── cookie-watcher.ts    # Cookie 文件监听器
│   │   ├── env-detector.ts      # 环境检测工具
│   │   └── index.ts             # 工具模块导出
│   └── index.ts                 # 主导出
├── scripts/                     # 脚本工具
│   ├── publish.sh               # 自动化发布脚本（含版本升级）
│   ├── publish-check.sh         # 检查构建发布脚本（不修改版本）
│   └── bump-version.js          # 版本升级工具
├── demo/                        # 示例项目
│   └── vite-demo/               # Vite 示例
├── docs/                        # 文档
├── __tests__/                   # 测试用例
└── package.json
```

## 脚本工具

### scripts/publish.sh

**功能**：自动化发布脚本，包含版本升级功能

**特点**：
- 完整的前置检查（npm 登录、git 分支、依赖、测试、构建）
- 支持多种版本升级类型（patch/minor/major/beta/alpha/自定义）
- 支持测试环境和正式环境发布
- 自动创建 git tag

**使用方式**：

```bash
# 直接运行，按提示操作
bash scripts/publish.sh

# 流程：
# 1. 检查命令 → 检查 npm 登录 → 检查 git 分支 → 检查 git 状态
# 2. 检查依赖 → 运行类型检查 → 运行测试
# 3. 选择版本升级类型 → 执行构建 → 确认发布
# 4. 可选：先发布到测试环境 → 发布到正式环境
```

**版本升级选项**：

| 选项 | 说明 | 示例 |
|------|------|------|
| 1) patch | 修复 bug | 1.0.1 → 1.0.2 |
| 2) minor | 添加新功能 | 1.0.1 → 1.1.0 |
| 3) major | 重大变更/不兼容 | 1.0.1 → 2.0.0 |
| 4) beta | Beta 测试版 | 1.0.1 → 1.0.2-beta.1 |
| 5) alpha | Alpha 测试版 | 1.0.1 → 1.0.2-alpha.1 |
| 6) 自定义 | 手动指定版本号 | 任意格式 |

### scripts/publish-check.sh

**功能**：检查构建发布脚本，**不修改版本号**

**适用场景**：
- 重新发布已有版本
- 测试环境验证
- CI/CD 自动化流程

**使用方式**：

```bash
# 默认发布到 latest 标签
bash scripts/publish-check.sh

# 指定发布标签
bash scripts/publish-check.sh beta
bash scripts/publish-check.sh test
```

**流程**：

```
检查命令 → 检查 npm 登录 → 检查 git 分支 → 检查 git 状态
    → 检查依赖 → 运行类型检查 → 运行测试 → 执行构建 → 确认发布
```

### scripts/bump-version.js

**功能**：独立的版本升级工具

**使用方式**：

```bash
# 使用 npm 脚本
npm run bump:patch    # 升级 patch 版本
npm run bump:minor    # 升级 minor 版本
npm run bump:major    # 升级 major 版本
npm run bump:beta     # 升级 beta 版本
npm run bump:alpha    # 升级 alpha 版本
```

## 配置选项汇总

### 代理服务器配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ws` | boolean | false | WebSocket 支持 |
| `changeOrigin` | boolean | true | 是否改变请求来源 |
| `secure` | boolean | false | 是否验证 SSL 证书 |
| `followRedirects` | boolean | true | 是否跟随重定向 |
| `autoRewrite` | boolean | false | 自动重写路径 |
| `protocolRewrite` | string | - | 协议重写（http/https） |
| `cookieDomainRewrite` | boolean/string/object | - | Cookie 域名重写 |
| `cookiePathRewrite` | boolean/string/object | - | Cookie 路径重写 |
| `headers` | object | - | 自定义请求头 |
| `logLevel` | string | 'info' | 日志级别 |

### 路径过滤配置

| 选项 | 类型 | 说明 |
|------|------|------|
| `includePaths` | string[] | 白名单模式，只代理这些路径 |
| `ignorePaths` | string[] | 黑名单模式，忽略这些路径 |
| `proxyMap` / `additionalProxies` | object | 额外代理配置，优先级最高 |

### Cookie 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cookieFile` | string | - | Cookie 文件路径 |
| `getCookie` | function | - | Cookie 获取函数 |
| `watch` | boolean | false | 是否监听文件变化 |
| `debug` | boolean | false | 是否输出调试日志 |

## 注意事项

1. **Cookie 文件变化**：Cookie 文件变化后，代理会立即使用新的 Cookie，无需重启服务器
2. **Git 忽略**：建议将 Cookie 文件添加到 `.gitignore`
3. **Vue CLI vs Vite**：Vue CLI 项目建议使用 `createVueProxyConfig` 或 `createAutoProxyConfig`，Vite 项目建议使用 `viteMiddlewareProxy`
4. **路径优先级**：`includePaths` 和 `ignorePaths` 不能同时生效，`includePaths` 优先
5. **代理映射优先级**：`proxyMap`（Vite）或 `additionalProxies`（Vue CLI）中的路径不受 `includePaths`/`ignorePaths` 限制
6. **Cookie 格式**：支持单行和多行格式，多行格式支持注释（以 `#` 开头）

## 最佳实践

### 推荐配置

```javascript
// cookie.txt - 存放登录后的 Cookie
session-id=abc123
uc_session_pre=xyz789
xxx-session-id=def456

// .gitignore - 忽略敏感文件
cookie.txt

// vue.config.js - Vue CLI 项目配置
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://localhost:3000',
      getCookie: createFileCookieGetter('./cookie.txt', { 
        watch: 'auto',  // 自动判断环境
        debug: true,
      }),
      ignorePaths: ['/assets/', '/public/'],
    }),
  },
};

// vite.config.js - Vite 项目配置
import { viteMiddlewareProxy } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target: 'http://localhost:3000',
      proxyPaths: ['/api', '/cas'],
      ignorePaths: ['/assets/', '/public/'],
    }),
  ],
});
```

### 环境配置建议

**开发环境（推荐使用 `isDev`）**

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: process.env.NODE_ENV === 'development',
  debug: true,
});
```

**预发布环境（需要调试）**

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: true,  // 强制启用监听
  debug: true,
});
```

**生产环境（禁用监听）**

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: false,  // 强制禁用监听
  debug: false,
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

### Q: 构建完成后进程不退出，一直挂起？

A: 这是由于文件监听器在生产环境下仍然运行导致的。解决方案：

**方案一：使用 `isDev` 参数（推荐）**

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  isDev: process.env.NODE_ENV === 'development',
});
```

**方案二：设置 `watch: false`**

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: false,
});
```

## 发布流程

### 使用脚本发布（推荐）

```bash
# 自动化发布（含版本升级）
bash scripts/publish.sh

# 检查构建发布（不修改版本）
bash scripts/publish-check.sh [tag]
```

### 手动发布流程

```bash
# 1. 检查依赖和测试
npm install
npm run lint
npm test

# 2. 升级版本
npm version patch   # 或 minor/major

# 3. 构建
npm run build

# 4. 发布
npm publish
```

## License

MIT License