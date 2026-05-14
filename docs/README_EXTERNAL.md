# dev-proxy-cookie 工具文档

## 一、工具概述

**dev-proxy-cookie** 是一个专为前端开发环境设计的 **Cookie 注入代理工具**，旨在解决开发过程中需要携带特定 Cookie 访问后端接口的问题。

**核心价值**：

- 无需在浏览器中手动登录即可访问需要认证的后端接口
- Cookie 文件变化时自动重载，无需重启开发服务器
- 支持 Vue CLI 和 Vite 两大主流构建工具

## 二、核心能力

| 能力                      | 说明                                                                   | 适用场景                   |
| ------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| **Vue CLI 兼容**    | 提供 `createVueProxyConfig`，完美兼容 vue.config.js 代理配置         | Vue CLI 项目               |
| **Vite 插件支持**   | 开箱即用的 Vite 插件，自动配置代理和 Cookie 注入                       | Vite 项目                  |
| **Cookie 文件监听** | 基于 chokidar 监听文件变化，实时更新请求 Cookie                        | 开发过程中 Cookie 频繁变更 |
| **自动代理**        | 可选自动代理所有请求，无需手动配置每个路径                             | 需要代理大量接口的场景     |
| **双向模式**        | 支持白名单模式（`includePaths`）和黑名单模式（`ignorePaths`）      | 灵活控制代理范围           |
| **钩子函数**        | 支持 `onProxyReq`、`onProxyRes`、`onError`、`onWsError` 等钩子 | 自定义代理行为             |
| **WebSocket 支持**  | 完整支持 WebSocket 代理                                                | 实时通信场景               |

## 三、项目优势

### 3.1 对比传统方案

| 方案                            | 优点                                | 缺点                             |
| ------------------------------- | ----------------------------------- | -------------------------------- |
| **浏览器手动登录**        | 直观，无需额外配置                  | 每次重启开发服务器都需要重新登录 |
| **修改代码硬编码 Cookie** | 简单直接                            | Cookie 变更需要修改代码，不安全  |
| **dev-proxy-cookie**      | Cookie 文件管理，自动重载，安全便捷 | 需要额外安装依赖                 |

### 3.2 核心优势

1. **热重载支持**：Cookie 文件修改后立即生效，无需重启开发服务器
2. **安全性**：Cookie 存储在文件中，不提交到代码仓库
3. **灵活性**：支持多种配置模式（白名单/黑名单/自定义代理）
4. **跨框架**：同时支持 Vue CLI 和 Vite 项目
5. **完整的代理能力**：支持 WebSocket、自定义请求头、路径重写等

## 四、项目结构

```
dev-proxy-cookie/
├── src/
│   ├── proxy/                    # 代理模块
│   │   ├── core.ts               # 代理核心逻辑（AutoProxyCookie 类）
│   │   ├── vite-plugin.ts        # Vite 自动代理插件
│   │   ├── vite-cookie-plugin.ts # Vite Cookie 注入插件
│   │   ├── vue-proxy-config.ts   # Vue CLI 代理配置工厂函数
│   │   └── apply-dev-cookie-header.ts  # Cookie 头注入工具函数
│   ├── utils/                    # 工具模块
│   │   ├── cookie-reader.ts      # Cookie 文件读取器（支持注释过滤）
│   │   └── cookie-watcher.ts     # Cookie 文件监听器（基于 chokidar）
│   └── index.ts                  # 主导出入口
├── demo/                         # 示例项目
│   ├── vite-demo/                # Vite 示例
│   └── vue-cli-demo/             # Vue CLI 示例
├── __tests__/                    # 单元测试
└── docs/                         # 文档
```

## 五、核心代码解析

### 5.1 Cookie 读取器（cookie-reader.ts）

```typescript
export class CookieReader {
  readCookie(): string {
    // 读取文件内容，过滤注释行（# 开头）和空行
    const lines = content.split('\n');
    const cookieLines = lines
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    return cookieLines.join('; ');
  }
}
```

**设计要点**：

- 支持单行和多行 Cookie 格式
- 自动过滤注释行（以 `#` 开头）
- 自动过滤空行
- 多行 Cookie 自动用分号连接

### 5.2 Cookie 监听器（cookie-watcher.ts）

```typescript
export class CookieWatcher {
  private watcher: FSWatcher | null = null;
  
  start(): void {
    this.watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });
  
    this.watcher.on('change', this.handleChange);
    this.watcher.on('add', this.handleChange);
  }
}
```

**设计要点**：

- 使用 chokidar 实现高性能文件监听
- 支持编辑器的原子写入（unlink + rename）
- 防抖处理避免频繁触发

### 5.3 Cookie 头注入（apply-dev-cookie-header.ts）

```typescript
export function applyDevCookieHeader(proxyReq, cookie): void {
  if (!cookie) return;
  proxyReq.removeHeader('cookie');      // 小写
  proxyReq.removeHeader('Cookie');      // 大写
  proxyReq.setHeader('Cookie', cookie); // 设置新 Cookie
}
```

**设计要点**：

- 先删除浏览器原有的 Cookie（避免重复）
- 统一使用大写 `Cookie` 头
- 解决浏览器 Cookie 与文件 Cookie 冲突问题

### 5.4 Vite 自动代理插件（vite-plugin.ts）

```typescript
export function viteAutoProxyCookie(options): Plugin {
  return {
    name: 'vite-auto-proxy-cookie',
    apply: 'serve',
  
    async configureServer(server) {
      const autoProxy = createAutoProxyCookie(options);
      await autoProxy.setup(server);
    },
  };
}
```

**设计要点**：

- 仅在开发模式（serve）生效
- 自动集成到 Vite 开发服务器
- 支持 WebSocket 升级处理

## 六、使用指南

### 6.1 安装

```bash
npm install dev-proxy-cookie
# 或
pnpm add dev-proxy-cookie
```

### 6.2 Vue CLI 项目配置

**方式一：标准代理配置**

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

module.exports = {
  devServer: {
    proxy: {
      '/api/': createVueProxyConfig('http://10.17.33.33', {
        getCookie: createFileCookieGetter('./cookie.txt'),
      }),
    },
  },
};
```

**方式二：自动代理所有接口**

```javascript
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie');

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://10.17.33.33',
      getCookie: createFileCookieGetter('./cookie.txt', { watch: true }),
      ignorePaths: ['/assets/', '/public/'],
      debug: true,
    }),
  },
};
```

### 6.3 Vite 项目配置

**方式一：自动代理模式**

```javascript
import { viteAutoProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteAutoProxyCookie({
      cookieFile: './cookie.txt',
      target: 'http://10.17.33.33',
      ignorePaths: ['/assets/', '/public/'],
      debug: true,
    }),
  ],
});
```

**方式二：基础 Cookie 注入**

```javascript
import { viteDevProxyCookie } from 'dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteDevProxyCookie({
      cookieFile: './cookie.txt',
      onCookieChange: (cookie) => {
        console.log('Cookie updated:', cookie);
      },
    }),
  ],
});
```

### 6.4 Cookie 文件格式

支持两种格式：

**单行模式**：

```
JSESSIONID=abc123; user=admin; token=xyz789
```

**多行模式（推荐）**：

```
# 开发环境 Cookie 配置
irs-session-id=YTFmYjk0YmQtNTdhZS00ZGFk
uc_session_pre=ttcm1f6JnH2lPpMVLNvHg4b
dos-session-id=YWQxMWUwMTktZjI4Yi00NzNm
```

## 七、API 参考

### 7.1 Vue CLI 相关

| 函数                                            | 说明                        |
| ----------------------------------------------- | --------------------------- |
| `createVueProxyConfig(target, options)`       | 创建兼容 Vue CLI 的代理配置 |
| `createAutoProxyConfig(options)`              | 创建自动代理配置            |
| `createFileCookieGetter(cookieFile, options)` | 创建 Cookie 获取函数        |

### 7.2 Vite 相关

| 函数                             | 说明                      |
| -------------------------------- | ------------------------- |
| `viteAutoProxyCookie(options)` | Vite 自动代理插件         |
| `viteDevProxyCookie(options)`  | Vite 基础 Cookie 注入插件 |

### 7.3 工具类

| 类                | 说明              |
| ----------------- | ----------------- |
| `CookieReader`  | Cookie 文件读取器 |
| `CookieWatcher` | Cookie 文件监听器 |

### 7.4 配置选项

| 选项             | 类型     | 默认值 | 说明            |
| ---------------- | -------- | ------ | --------------- |
| `cookieFile`   | string   | -      | Cookie 文件路径 |
| `target`       | string   | -      | 代理目标地址    |
| `debug`        | boolean  | false  | 调试模式        |
| `ws`           | boolean  | true   | WebSocket 支持  |
| `changeOrigin` | boolean  | true   | 改变请求来源    |
| `secure`       | boolean  | false  | 验证 SSL 证书   |
| `ignorePaths`  | string[] | []     | 忽略路径列表    |
| `includePaths` | string[] | []     | 白名单路径列表  |
| `hooks`        | object   | -      | 钩子函数配置    |

## 八、最佳实践

### 8.1 项目配置示例

```
├── your-project/
│   ├── cookie.txt          # Cookie 文件（添加到 .gitignore）
│   ├── .gitignore          # 忽略 cookie.txt
│   ├── vue.config.js       # Vue CLI 配置
│   └── vite.config.js      # Vite 配置（二选一）
```

### 8.2 .gitignore 配置

```gitignore
# Cookie 文件
cookie.txt
.cookie-restart-marker

# 其他...
node_modules/
dist/
```

### 8.3 Cookie 文件规范

```
# ============================================================
# 开发环境 Cookie 配置文件
# ============================================================
# 说明：
#   1. 每行一个 Cookie 键值对
#   2. 以 # 开头的行是注释
#   3. Cookie 值末尾的分号可选
#   4. 修改此文件后，代理会自动更新 Cookie
# ============================================================

# 会话凭证
session-id=abc123xyz789
uc_session_pre=base64encodedvalue

# 用户信息
user-id=12345
user-name=developer
```

## 九、常见问题

**Q1：Cookie 文件修改后没有生效？**

A：检查以下几点：

- 是否启用了 `watch: true` 选项
- 控制台是否输出 `[CookieWatcher] Cookie updated from file`
- 确保 cookie.txt 文件路径正确

**Q2：如何获取浏览器中的 Cookie？**

A：

1. 打开浏览器访问目标系统并登录
2. F12 → Application → Cookies
3. 复制需要的 Cookie 值到 cookie.txt

**Q3：Cookie 值包含特殊字符导致错误？**

A：Cookie 值会被自动处理，支持 `/`、`+`、`=` 等特殊字符。如出现错误，请检查是否有不可见字符。

**Q4：如何调试代理请求？**

A：启用 `debug: true` 选项，控制台会输出详细日志。也可在 `hooks.onProxyReq` 中添加自定义日志。

## 十、技术栈

| 依赖           | 版本    | 用途                  |
| -------------- | ------- | --------------------- |
| `chokidar`   | ^3.5.3  | 文件监听              |
| `http-proxy` | ^1.18.1 | HTTP 代理             |
| `vite`       | >=4.0.0 | Vite 插件支持（可选） |
