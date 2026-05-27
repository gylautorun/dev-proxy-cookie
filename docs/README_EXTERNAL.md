# dev-proxy-cookie 工具文档

## 一、工具概述

**dev-proxy-cookie** 是一个专为前端开发环境设计的 **Cookie 注入代理工具**，旨在解决开发过程中需要携带特定 Cookie 访问后端接口的问题。

**核心价值**：

- 无需在浏览器中手动登录即可访问需要认证的后端接口
- 支持 Vue CLI 和 Vite 两大主流构建工具
- **兼容所有 Vite 版本**（2.x/3.x/4.x/5.x）
- 智能环境检测，自动处理开发/生产环境差异

## 二、核心能力

| 能力                      | 说明                                                                   | 适用场景                   |
| ------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| **Vue CLI 兼容**    | 提供 `createVueProxyConfig`，完美兼容 vue.config.js 代理配置         | Vue CLI 项目               |
| **Vite 插件支持**   | 开箱即用的 Vite 中间件插件，自动配置代理和 Cookie 注入，兼容所有 Vite 版本 | Vite 项目                  |
| **Cookie 文件读取** | 支持注释过滤的 Cookie 文件读取器                                      | 开发过程中 Cookie 管理     |
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
| **dev-proxy-cookie**      | Cookie 文件管理，安全便捷           | 需要额外安装依赖                 |

### 3.2 核心优势

1. **安全性**：Cookie 存储在文件中，不提交到代码仓库
2. **灵活性**：支持多种配置模式（白名单/黑名单/自定义代理）
3. **跨框架**：同时支持 Vue CLI 和 Vite 项目
4. **完整的代理能力**：支持 WebSocket、自定义请求头、路径重写等
5. **版本兼容性**：Vite 插件兼容所有 Vite 版本

## 四、项目结构

```
dev-proxy-cookie/
├── src/
│   ├── proxy/                    # 代理模块
│   │   ├── core.ts               # 代理核心逻辑（AutoProxyCookie 类）
│   │   ├── vite-middleware-plugin.ts  # Vite 中间件代理插件（兼容所有版本）
│   │   ├── vue-proxy-config.ts   # Vue CLI 代理配置工厂函数
│   │   └── apply-dev-cookie-header.ts  # Cookie 头注入工具函数
│   ├── utils/                    # 工具模块
│   │   ├── cookie-reader.ts      # Cookie 文件读取器（支持注释过滤）
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

### 5.2 Cookie 头注入（apply-dev-cookie-header.ts）

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

### 5.3 Vite 中间件代理插件（vite-middleware-plugin.ts）

```typescript
export function viteMiddlewareProxy(options): Plugin {
  return {
    name: 'vite-middleware-proxy',
    apply: 'serve',
  
    configureServer(server) {
      // 注册中间件处理代理
      server.middlewares.use((req, res, next) => {
        // 代理逻辑...
      });
    },
  };
}
```

**设计要点**：

- 仅在开发模式（serve）生效
- 使用中间件方式，兼容所有 Vite 版本
- 不依赖具体的 Vite 类型定义

## 六、使用指南

### 6.1 安装

```bash
npm install @gylautorun/dev-proxy-cookie --save-dev
# 或
pnpm add @gylautorun/dev-proxy-cookie -D
```

### 6.2 Vue CLI 项目配置

**方式一：标准代理配置**

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('@gylautorun/dev-proxy-cookie');

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
const { createAutoProxyConfig, createFileCookieGetter } = require('@gylautorun/dev-proxy-cookie');

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://10.17.33.33',
      getCookie: createFileCookieGetter('./cookie.txt'),
      ignorePaths: ['/assets/', '/public/'],
      debug: true,
    }),
  },
};
```

### 6.3 Vite 项目配置

**推荐配置方式**

```javascript
import { defineConfig } from 'vite';
import { viteMiddlewareProxy } from '@gylautorun/dev-proxy-cookie';

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      // 必需配置
      cookieFile: './cookie.txt',
      target: 'http://10.17.33.33',
      
      // 可选配置
      debug: true,
      
      // 自定义代理映射（优先级最高）
      proxyMap: {
        '/digital-platform': 'http://223.4.72.251:8816/',
        '/robot': 'https://oapi.dingtalk.com/',
      },
      
      // 需要代理的路径前缀列表（使用默认 target）
      proxyPaths: ['/api', '/cas', '/examine'],
      
      // 忽略的路径（不进行代理）
      ignorePaths: ['/assets/', '/public/', '/src/'],
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
| `viteMiddlewareProxy(options)` | Vite 中间件代理插件（兼容所有版本） |

### 7.3 工具类

| 类                | 说明              |
| ----------------- | ----------------- |
| `CookieReader`  | Cookie 文件读取器 |

### 7.4 配置选项（viteMiddlewareProxy）

| 选项          | 类型     | 默认值 | 说明                              |
| ------------- | -------- | ------ | --------------------------------- |
| `cookieFile`  | string   | -      | Cookie 文件路径（必需）           |
| `target`      | string   | -      | 默认代理目标地址（必需）          |
| `debug`       | boolean  | false  | 是否启用调试模式                  |
| `proxyMap`    | object   | {}     | 自定义代理映射表（路径→目标地址） |
| `proxyPaths`  | string[] | []     | 需要代理的路径前缀列表            |
| `ignorePaths` | string[] | []     | 需要忽略的路径列表（不代理）      |

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

A：Cookie 文件修改后需要手动重启开发服务器。

**Q2：如何获取浏览器中的 Cookie？**

A：

1. 打开浏览器访问目标系统并登录
2. F12 → Application → Cookies
3. 复制需要的 Cookie 值到 cookie.txt

**Q3：Cookie 值包含特殊字符导致错误？**

A：Cookie 值会被自动处理，支持 `/`、`+`、`=` 等特殊字符。如出现错误，请检查是否有不可见字符。

**Q4：如何调试代理请求？**

A：启用 `debug: true` 选项，控制台会输出详细日志。

**Q5：兼容哪些 Vite 版本？**

A：`viteMiddlewareProxy` 插件不依赖具体的 Vite 类型定义，兼容所有 Vite 版本（2.x/3.x/4.x/5.x）。

## 十、技术栈

| 依赖           | 版本    | 用途                  |
| -------------- | ------- | --------------------- |
| `http-proxy` | ^1.18.1 | HTTP 代理             |

## 十一、示例配置

### Vite 完整配置

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteMiddlewareProxy } from '@gylautorun/dev-proxy-cookie';

const proxy = 'http://10.17.53.3/';

export default defineConfig({
  plugins: [
    react(),
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target: proxy,
      debug: true,
      proxyMap: {
        '/digital-platform': 'http://223.4.72.251:8816/',
        '/robot': 'https://oapi.dingtalk.com/',
        '/irs-assessments/api/zbdf': 'http://10.249.160.193:8003',
        '/zbdf': 'http://10.249.160.193:8003',
      },
      proxyPaths: [
        '/irs-assessments/api',
        '/irs-file/api',
        '/irs-admin/api',
        '/api',
      ],
      ignorePaths: [
        '/src',
        '/assets',
        '/public',
      ],
    }),
  ],
});
```

### Cookie 文件示例

```plaintext
# ============================================================
# 开发环境 Cookie 配置文件
# ============================================================
# 说明：
#   1. 每行一个 Cookie 键值对
#   2. 以 # 开头的行是注释
#   3. Cookie 值末尾的分号可选
# ============================================================

# IRS 会话凭证
uc_session_pre=ttcm1f6JnH2lPpMVLNvHg4bP3LaK6DcQ42O1FoE1xXLBoZNq24qmrcoAlLrYL7M1lwxeR3We6Nhs3PBSCd1JzA==
irs-session-id=OTI5ZTE0ZWMtNmEyYy00YjljLTkwODItYmYwNWJjNDIxMDYx
dos-session-id=NzcwMGNlYmMtOGMyZi00NzFjLWJjYjktMGM1YmEyMWFiMWY3
```
