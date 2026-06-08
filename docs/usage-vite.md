# Vite 使用指南

## 基本配置

在 `vite.config.js` 中使用 `viteMiddlewareProxy` 插件：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

export default defineConfig({
  plugins: [
    vue(),
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target: 'http://10.17.53.3:10000',
      debug: true,
    }),
  ],
})
```

## 完整配置示例

```javascript
import { defineConfig } from 'vite'
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      // 必需：Cookie 文件路径
      cookieFile: './cookie.txt',
    
      // 必需：目标代理服务器地址
      target: 'http://10.17.53.3:10000',
    
      // 可选：调试模式，输出详细日志
      debug: true,
    
      // 可选：自定义代理映射（优先级高于默认代理）
      proxyMap: {
        '/mock/': 'http://localhost:3000',
        '/api/v2/': 'http://192.168.1.100:8080',
      },
    
      // 可选：需要代理的路径前缀列表（使用默认 target）
      proxyPaths: ['/api', '/cas', '/examine'],
    
      // 可选：忽略的路径（不进行代理）
      ignorePaths: ['/assets/', '/img/', '/public/'],
    }),
  ],
})
```

## 配置选项说明

| 选项          | 类型     | 默认值 | 说明                      |
| ------------- | -------- | ------ | ------------------------- |
| `cookieFile`  | string   | -      | Cookie 文件路径（必需）   |
| `target`      | string   | -      | 默认代理目标地址（必需）  |
| `debug`       | boolean  | false  | 是否启用调试模式          |
| `proxyMap`    | object   | {}     | 自定义代理映射表          |
| `proxyPaths`  | string[] | []     | 需要代理的路径前缀列表    |
| `ignorePaths` | string[] | []     | 需要忽略的路径列表        |

## Cookie 文件格式

在项目根目录创建 `cookie.txt` 文件：

```
# 这是注释（以 # 开头的行会被忽略）
JSESSIONID=abc123def456;
user=admin;
token=xyz789;
```

### 格式说明

- 每行一个 Cookie 键值对
- Cookie 值以分号结尾（可选）
- 以 `#` 开头的行为注释，会被忽略
- 空行会被忽略

## 实际使用场景

### 场景一：模拟登录

1. 在浏览器中登录目标系统
2. 打开开发者工具（F12），复制 Cookie
3. 将 Cookie 粘贴到 `cookie.txt` 文件中
4. 启动开发服务器，所有请求都会自动携带这些 Cookie

### 场景二：多环境切换

```javascript
// 根据环境变量配置不同的目标地址
const target = process.env.VUE_APP_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [
    viteMiddlewareProxy({
      cookieFile: './cookie.txt',
      target,
    }),
  ],
})
```

### 场景三：自定义代理规则

```javascript
viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://main-server:8080',
  
  // 某些路径代理到其他服务器
  proxyMap: {
    '/mock/': 'http://mock-server:3000',
    '/static/': 'http://cdn-server:80',
  },
  
  // 指定需要代理的路径
  proxyPaths: ['/api', '/cas'],
  
  // 静态资源不代理
  ignorePaths: ['/assets/', '/favicon.ico'],
})
```

### 场景四：使用账号密码登录（禁用 Cookie 注入）

当需要使用账号密码登录时，设置 `useCookie: false`，避免覆盖浏览器的登录 Cookie：

```javascript
viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://10.17.53.3:10000',
  useCookie: false,  // 禁用 Cookie 注入
  debug: true,
  proxyPaths: ['/api'],
})
```

**使用说明：**

1. 设置 `useCookie: false` 后，代理不会从 Cookie 文件读取和注入 Cookie
2. 请求会使用浏览器发送的原始 Cookie
3. 适合需要在浏览器中手动登录的场景
4. 登录成功后，浏览器的登录状态会被保持和使用

## 启动开发服务器

```bash
npm run dev
# 或
pnpm run dev
```

启动后，插件会：

1. 读取 `cookie.txt` 文件中的 Cookie
2. 所有匹配的请求都会自动携带这些 Cookie

## 常见问题

### Q: Cookie 文件修改后没有生效？

A: 手动重启开发服务器即可，当前版本不支持自动热更新。

### Q: 某些请求没有携带 Cookie？

A: 检查是否在 `proxyPaths` 中配置了该路径，或者检查 Cookie 文件格式是否正确。

### Q: 代理目标地址需要认证？

A: 确保 Cookie 文件中的 Cookie 是有效的登录凭证。

### Q: 兼容哪些 Vite 版本？

A: 本插件不依赖具体的 Vite 类型定义，兼容所有 Vite 版本。
