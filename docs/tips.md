# 注意事项

## 安全注意事项

### 1. Cookie 文件保密

**重要**：`cookie.txt` 文件包含敏感的登录凭证，**绝对不要**将其提交到版本控制！

在 `.gitignore` 中添加：

```
# Cookie 文件
cookie.txt
.cookie-restart-marker
```

### 2. 仅用于开发环境

此工具**仅适用于开发环境**，**不要在生产环境中使用**。

生产环境应该使用正规的认证机制，而不是静态 Cookie 文件。

### 3. Cookie 过期处理

Cookie 有过期时间，过期后需要重新获取：

1. 在浏览器中重新登录目标系统
2. 复制新的 Cookie
3. 更新 `cookie.txt` 文件

---

## 使用注意事项

### 1. Cookie 文件格式

确保 `cookie.txt` 文件格式正确：

```
# 正确格式
JSESSIONID=abc123;
user=admin;

# 错误格式（不要这样写）
Cookie: JSESSIONID=abc123; user=admin
```

### 2. 路径匹配优先级

代理路径匹配按照以下优先级：

1. **自定义 proxyMap**（最高优先级）
2. **默认代理**（匹配所有未忽略的路径）
3. **ignorePaths**（不进行代理）

### 3. Vite 自动重启机制

当 `autoRestart: true` 时：

- Cookie 文件变化时会创建一个标记文件
- Vite 监听器检测到标记文件变化后自动重启
- 重启后会读取新的 Cookie

### 4. Vue CLI 文件监听

Vue CLI 模式下需要手动启用监听：

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,  // 必须启用此选项
})
```

---

## 性能优化

### 1. 合理配置 ignorePaths

将静态资源路径添加到 `ignorePaths`，避免不必要的代理：

```javascript
ignorePaths: ['/assets/', '/img/', '/public/', '/favicon.ico']
```

### 2. 避免频繁修改 Cookie

频繁修改 Cookie 文件会触发自动重启（如果启用），影响开发效率。

### 3. 使用环境变量

将目标地址配置为环境变量，便于不同环境切换：

```bash
# .env
VUE_APP_TARGET=http://10.17.53.3:10000
```

---

## 常见问题

### Q: Cookie 文件修改后没有生效？

**可能原因**：

1. 未启用文件监听（Vite 需要 `autoRestart: true`，Vue CLI 需要 `watch: true`）
2. Cookie 文件格式错误
3. 开发服务器缓存了旧的 Cookie

**解决方案**：

1. 检查配置是否正确启用了监听
2. 检查 Cookie 文件格式
3. 手动重启开发服务器

### Q: 某些请求没有携带 Cookie？

**可能原因**：

1. 请求路径在 `ignorePaths` 中
2. 请求没有经过代理
3. Cookie 获取函数返回空字符串

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

### Q: Vite 自动重启不生效？

**可能原因**：

1. 没有安装 `chokidar` 依赖
2. 标记文件路径配置错误
3. Vite 配置问题

**解决方案**：

1. 确保安装了 `chokidar`
2. 检查 `restartMarkerFile` 配置
3. 检查 Vite 配置

### Q: 与其他 Vite 插件冲突？

**可能原因**：

1. 多个插件修改了相同的配置
2. 插件顺序问题

**解决方案**：

1. 调整插件顺序，将 `viteAutoProxyCookie` 放在最后
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

const getCookie = createFileCookieGetter(process.env.VUE_APP_COOKIE_FILE, { watch: true })

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
viteAutoProxyCookie({
  cookieFile: './cookie.txt',
  target: 'http://localhost:8080',
  debug: true,  // 启用调试日志
})
```

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

const getCookie = createFileCookieGetter('./cookie.txt', { watch: true })

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

### Vite 用户迁移

如果你从 Vue CLI 迁移到 Vite：

```javascript
// vite.config.js
import { viteAutoProxyCookie } from 'dev-proxy-cookie'

export default defineConfig({
  plugins: [
    viteAutoProxyCookie({
      cookieFile: './cookie.txt',
      target: 'http://localhost:8080',
      autoRestart: true,
    }),
  ],
})
```
