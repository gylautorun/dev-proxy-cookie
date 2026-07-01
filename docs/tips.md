# 注意事项

## 安全注意事项

### 1. Cookie 文件保密

**重要**：`cookie.txt` 文件包含敏感的登录凭证，**绝对不要**将其提交到版本控制！

在 `.gitignore` 中添加：

```
# Cookie 文件
cookie.txt
```

### 2. 仅用于开发环境

此工具**仅适用于开发环境**，**不要在生产环境中使用**。

生产环境应该使用正规的认证机制，而不是静态 Cookie 文件。

### 3. Cookie 过期处理

Cookie 有过期时间，过期后需要重新获取：

1. 在浏览器中重新登录目标系统
2. 复制新的 Cookie
3. 更新 `cookie.txt` 文件
4. 重启开发服务器

---

## 使用注意事项

### 1. Cookie 文件格式

确保 `cookie.txt` 文件格式正确：

```
# 正确格式
JSESSIONID=abc123;
user=admin;

# 也支持单行格式
JSESSIONID=abc123; user=admin; token=xyz789
```

### 2. 路径匹配优先级

代理路径匹配按照以下优先级：

1. **自定义 proxyMap**（最高优先级）
2. **proxyPaths**（匹配指定路径前缀）
3. **ignorePaths**（不进行代理）

### 3. Cookie 修改后重启

修改 `cookie.txt` 文件后，需要手动重启开发服务器才能生效。

---

## 性能优化

### 1. 合理配置 ignorePaths

将静态资源路径添加到 `ignorePaths`，避免不必要的代理：

```javascript
ignorePaths: ['/assets/', '/img/', '/public/', '/favicon.ico']
```

### 2. 使用环境变量

将目标地址配置为环境变量，便于不同环境切换：

```bash
# .env
VUE_APP_TARGET=http://10.17.53.3:10000
```

---

## 常见问题

### Q: Cookie 文件修改后没有生效？

**可能原因**：

1. Cookie 文件格式错误
2. 开发服务器缓存了旧的 Cookie

**解决方案**：

1. 检查 Cookie 文件格式
2. 手动重启开发服务器

### Q: 某些请求没有携带 Cookie？

**可能原因**：

1. 请求路径在 `ignorePaths` 中
2. 请求没有经过代理
3. Cookie 文件不存在或为空

**解决方案**：

1. 检查 `ignorePaths` 配置
2. 检查代理路径配置
3. 检查 Cookie 文件是否存在且有内容

### Q: 代理报错 "ECONNREFUSED"？

**可能原因**：

1. 目标服务器未启动
2. 目标地址或端口错误
3. 网络不通

**解决方案**：

1. 确认目标服务器正在运行
2. 检查目标地址配置
3. 检查网络连接

### Q: 与其他 Vite 插件冲突？

**可能原因**：

1. 多个插件修改了相同的配置
2. 插件顺序问题

**解决方案**：

1. 调整插件顺序，将 `viteMiddlewareProxy` 放在最后
2. 检查其他插件的配置

---

## 最佳实践

### 1. 使用 .env 文件管理配置

```bash
# .env.development
VUE_APP_TARGET=http://10.17.53.3:10000
VUE_APP_COOKIE_FILE=./cookie.txt
```

### 2. 封装配置函数

```javascript
// config/proxy.js
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter(process.env.VUE_APP_COOKIE_FILE)

module.exports = function createProxy(target) {
  return createVueProxyConfig(target, { getCookie, debug: true })
}
```

### 3. 多环境配置

```javascript
// 根据环境选择不同的配置
const env = process.env.NODE_ENV || 'development'
const configs = {
  development: { target: 'http://dev-server:8080' },
  test: { target: 'http://test-server:8080' },
  staging: { target: 'http://staging-server:8080' },
}

const { target } = configs[env]
```

### 4. 日志调试

启用 `debug: true` 可以查看详细日志：

```javascript
// Vite 项目
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  debug: true,  // 启用调试日志
})
```

### 5. 使用账号密码登录

当需要使用账号密码登录而不是 Cookie 文件时，设置 `useCookie: false`：

```javascript
// Vite 项目
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

viteMiddlewareProxy({
  cookieFile: './cookie.txt',  // Cookie 文件仍然需要指定（用于其他配置）
  target: 'http://localhost:8080',
  useCookie: false,  // 禁用 Cookie 注入，使用浏览器发送的 Cookie
  debug: true,
})

// Vue CLI 项目
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

createAutoProxyConfig({
  target: 'http://localhost:8080',
  getCookie: createFileCookieGetter('./cookie.txt'),
  useCookie: false,  // 禁用 Cookie 注入
})
```

### 6. 使用自定义鉴权信息（authentications）

当后端服务使用 Cookie 之外的鉴权方式时，可以使用 `authentications` 配置：

```javascript
// Vite 项目 - 使用 CAS Ticket
import { viteMiddlewareProxy } from 'dev-proxy-cookie'

viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  authentications: [
    { 'ticket': 'ST-12345-ABCDE-cas-server' },
  ],
})

// Vue CLI 项目 - 使用 JWT Token
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

createAutoProxyConfig({
  target: 'http://localhost:8080',
  getCookie: createFileCookieGetter('./cookie.txt'),
  authentications: [
    { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  ],
})

// 组合使用多种鉴权方式
viteMiddlewareProxy({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  useCookie: true,  // 使用 Cookie
  authentications: [
    { 'ticket': 'ST-12345-ABCDE' },
    { 'X-Custom-Token': 'abc123' },
  ],
})
```

**注意事项：**
- `authentications` 中的键值对会直接添加到请求头中
- 可以同时使用 Cookie 和自定义鉴权信息
- 适用于 CAS、OAuth、JWT 等多种鉴权场景

---

## 迁移指南

### 从手动配置迁移

如果你之前手动配置了多个代理规则，可以这样迁移：

**迁移前**：

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api/': { target: 'http://localhost:8080', changeOrigin: true },
      '/cas/': { target: 'http://localhost:8080', changeOrigin: true },
      '/examine/': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
}
```

**迁移后**：

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt')

module.exports = {
  devServer: {
    proxy: {
      '/api/': createVueProxyConfig('http://localhost:8080', { getCookie }),
      '/cas/': createVueProxyConfig('http://localhost:8080', { getCookie }),
      '/examine/': createVueProxyConfig('http://localhost:8080', { getCookie }),
    },
  },
}
```

### Vite 用户配置

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
