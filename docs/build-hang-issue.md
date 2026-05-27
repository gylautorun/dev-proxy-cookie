# 构建进程不退出问题（已解决）

## 问题描述

在旧版 `dev-proxy-cookie` 中，使用文件监听器（基于 `chokidar`）会导致构建完成后进程不退出。

## 解决方案

### 当前版本已移除文件监听

**v1.0.2 及以上版本**已经移除了文件监听功能：

- 移除了 `chokidar` 依赖
- 移除了 `cookie-watcher.ts` 模块
- 移除了 `env-detector.ts` 模块

### 新版本特性

新的 `viteMiddlewareProxy` 插件：

1. **不使用文件监听**：Cookie 文件读取仅在服务器启动时执行一次
2. **无需环境检测**：不再需要 `isDev`、`watch` 参数
3. **修改 Cookie 需重启**：修改 `cookie.txt` 文件后需要手动重启开发服务器

### 当前配置方式

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target: 'http://localhost:8080',
      debug: true,
    }),
  ],
})
```

### 构建进程退出问题已解决

由于不再使用 `chokidar` 进行文件监听，构建进程会正常退出：

```bash
npm run build  # 构建完成后进程自动退出 ✅
```

### Cookie 更新流程

修改 Cookie 文件后：

1. 更新 `cookie.txt` 文件
2. 手动重启开发服务器
3. 新的 Cookie 生效

## 总结

| 版本 | 文件监听 | 构建退出 | Cookie 更新方式 |
|------|----------|----------|----------------|
| < v1.0.2 | ✅ 启用 | ⚠️ 可能不退出 | 自动热更新 |
| >= v1.0.2 | ❌ 移除 | ✅ 正常退出 | 重启服务器 |

> **注意**：如果您使用的是旧版本，请升级到 v1.0.2 或以上版本以解决构建进程不退出问题。
