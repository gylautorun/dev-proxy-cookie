# Changelog

## v1.0.2 - 2026-05-27

### 新增功能

#### 1. 新增 `viteMiddlewareProxy` 插件
- 创建了新的 Vite 中间件代理插件 `src/proxy/vite-middleware-plugin.ts`
- **核心特性**:
  - 不依赖具体的 Vite 类型定义，兼容所有 Vite 版本
  - 使用中间件方式实现代理，简单可靠
  - 支持自动注入 Cookie 到所有代理请求
  - 支持自定义代理路径映射 (`proxyMap`)
  - 支持指定需要代理的路径列表 (`proxyPaths`)
  - 支持忽略路径列表 (`ignorePaths`)

- **配置选项**:
  ```typescript
  interface ViteMiddlewareProxyOptions {
    cookieFile: string;      // Cookie 文件路径（必需）
    target: string;          // 默认代理目标地址（必需）
    debug?: boolean;         // 是否启用调试模式
    proxyMap?: Record<string, string>;  // 自定义代理映射表
    proxyPaths?: string[];   // 需要代理的路径前缀列表
    ignorePaths?: string[];  // 需要忽略的路径列表
  }
  ```

- **使用示例**:
  ```javascript
  import { viteMiddlewareProxy } from 'dev-proxy-cookie'

  viteMiddlewareProxy({
    cookieFile: './cookie.txt',
    target: 'http://10.17.53.3/',
    debug: true,
    proxyMap: {
      '/digital-platform': 'http://223.4.72.251:8816/',
      '/robot': 'https://oapi.dingtalk.com/',
    },
    proxyPaths: ['/api', '/irs-admin', '/irs-file'],
    ignorePaths: ['/src', '/assets', '/public'],
  })
  ```

### 移除功能

#### 1. 移除冗余的 Vite 插件实现
- **移除文件**:
  - `src/proxy/vite-plugin.ts` - 旧版 Vite 插件，依赖 ViteDevServer 类型
  - `src/proxy/vite-cookie-plugin.ts` - 轻量级 Cookie 注入插件
  - `src/proxy/vite-adapter.ts` - Vite 版本适配模块

- **移除原因**:
  - 这些插件依赖 Vite 4.x 的 `ViteDevServer` 类型定义
  - 与项目使用的 Vite 2.x 版本不兼容
  - 复杂性高，存在不必要的版本适配逻辑

#### 2. 移除相关测试文件
- **移除文件**:
  - `__tests__/vite-adapter.test.ts`
  - `__tests__/vite-cookie-plugin.test.ts`
  - `__tests__/vite-plugin.test.ts`

### 修改功能

#### 1. 更新导出模块
- 修改 `src/proxy/index.ts`，只导出必要的模块：
  ```typescript
  export * from './core';
  export * from './vite-middleware-plugin';
  export * from './vue-proxy-config';
  ```

#### 2. 更新 Demo 示例
- 更新 `demo/vite-demo/vite.config.js`，使用新的 `viteMiddlewareProxy` 插件

#### 3. 更新文档
- **更新 `docs/usage-vite.md`**:
  - 完整更新为使用 `viteMiddlewareProxy` 插件
  - 添加新的配置选项说明
  - 添加兼容性说明

- **更新 `docs/api.md`**:
  - 添加 `viteMiddlewareProxy` API 文档
  - 更新导出清单
  - 添加新的类型定义

### 兼容性说明

| Vite 版本 | 兼容性 | 说明 |
|-----------|--------|------|
| Vite 2.x | ✅ 完全兼容 | 项目当前使用版本 |
| Vite 3.x | ✅ 完全兼容 | 无类型依赖 |
| Vite 4.x | ✅ 完全兼容 | 无类型依赖 |
| Vite 5.x | ✅ 完全兼容 | 无类型依赖 |

### 迁移指南

#### 从旧版 `viteAutoProxyCookie` 迁移到 `viteMiddlewareProxy`

**旧版配置**:
```javascript
import { viteAutoProxyCookie } from 'dev-proxy-cookie'

viteAutoProxyCookie({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  debug: true,
  autoRestart: true,
  proxyMap: { '/mock/': 'http://localhost:3000' },
  ignorePaths: ['/assets/'],
})
```

**新版配置**:
```javascript
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  debug: true,
  proxyMap: { '/mock/': 'http://localhost:3000' },
  proxyPaths: ['/api', '/cas'],  // 新增：指定需要代理的路径
  ignorePaths: ['/assets/'],
})
```

**注意事项**:
- `autoRestart` 选项已移除，修改 Cookie 文件后需手动重启服务器
- 新增 `proxyPaths` 选项，用于指定需要代理的路径前缀列表
- 简化了配置选项，移除了不必要的复杂配置

### 核心改进总结

| 改进点 | 说明 |
|--------|------|
| **版本兼容性** | 不依赖具体 Vite 类型，兼容所有版本 |
| **简化配置** | 移除了复杂的版本适配逻辑 |
| **稳定性** | 使用中间件方式，更可靠 |
| **可维护性** | 代码更简洁，易于维护 |
| **功能完整** | 保留了所有核心功能（代理 + Cookie 注入） |
