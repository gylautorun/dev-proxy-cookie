# Vue CLI 使用指南

## 自动代理所有接口（推荐）

使用 `createAutoProxyConfig` 可以自动代理所有请求，无需手动配置每个路径：

```javascript
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

// 创建 Cookie 获取器
const getCookie = createFileCookieGetter('./cookie.txt')

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://10.17.53.3:10000',
      getCookie,
      debug: true,
      ignorePaths: ['/assets/', '/img/', '/public/'],
      additionalProxies: {
        '/mock/': 'http://localhost:3000',
      },
    }),
  },
}
```

## 基本配置

在 `vue.config.js` 中使用 `createVueProxyConfig` 和 `createFileCookieGetter`：

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

// 创建 Cookie 获取器
const getCookie = createFileCookieGetter('./cookie.txt')

module.exports = {
  devServer: {
    proxy: {
      '/api/': createVueProxyConfig('http://10.17.53.3:10000', { getCookie }),
      '/cas/': createVueProxyConfig('http://10.17.53.3:10000', { getCookie }),
    },
  },
}
```

## 完整配置示例

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

// 创建 Cookie 获取器（支持自动监听文件变化）
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,  // 启用文件监听
  debug: true,  // 输出日志
})

// 封装代理配置函数
function createProxyConfig(target, options = {}) {
  return createVueProxyConfig(target, {
    getCookie,
    debug: true,
    ...options,
  })
}

module.exports = {
  devServer: {
    proxy: {
      // 代理到主服务器
      '/api/': createProxyConfig('http://10.17.53.3:10000'),
      '/cas/': createProxyConfig('http://10.17.53.3:10000'),
      '/examine/': createProxyConfig('http://10.17.53.3:10000', {
        headers: {
          host: '10.17.53.3:10000',
          origin: 'http://10.17.53.3:10000',
        },
      }),
  
      // 代理到其他服务器
      '/mock/': createProxyConfig('http://59.202.52.183:3000'),
    },
  },
}
```

## createFileCookieGetter 配置

```javascript
const getCookie = createFileCookieGetter('./cookie.txt', {
  watch: true,   // 是否监听文件变化
  debug: false,  // 是否输出调试日志
})
```

| 选项      | 类型    | 默认值 | 说明             |
| --------- | ------- | ------ | ---------------- |
| `watch` | boolean | false  | 是否监听文件变化 |
| `debug` | boolean | false  | 是否输出调试日志 |

## createVueProxyConfig 配置

```javascript
createVueProxyConfig(target, {
  getCookie: () => 'JSESSIONID=abc123',  // Cookie 获取函数
  debug: false,                          // 是否输出调试日志
  useCookie: true,                       // 是否使用 Cookie
  headers: {},                           // 自定义请求头
})
```

| 选项          | 类型     | 默认值 | 说明                                         |
| ------------- | -------- | ------ | -------------------------------------------- |
| `getCookie` | function | -      | Cookie 获取函数（必需）                      |
| `debug`     | boolean  | false  | 是否输出调试日志                             |
| `useCookie` | boolean  | true   | 是否使用 Cookie 文件中的 Cookie 注入到请求中 |
| `headers`   | object   | {}     | 自定义请求头                                 |

### useCookie 参数说明

| 值               | 效果                                     | 适用场景                                 |
| ---------------- | ---------------------------------------- | ---------------------------------------- |
| `true`（默认） | 使用 Cookie 文件中的 Cookie 注入到请求中 | 使用 Cookie 文件登录                     |
| `false`        | 不注入 Cookie，使用浏览器发送的 Cookie   | 使用账号密码登录，避免覆盖浏览器登录状态 |

## createAutoProxyConfig 配置（自动代理所有接口）

```javascript
createAutoProxyConfig({
  target: 'http://10.17.53.3:10000',    // 默认代理目标地址（必需）
  getCookie: () => 'JSESSIONID=abc123',  // Cookie 获取函数
  debug: false,                          // 是否输出调试日志
  headers: {},                           // 自定义请求头
  includePaths: ['/api/', '/cas/'],      // 只代理这些路径（白名单模式）
  // 或 ignorePaths: ['/assets/', '/img/'],  // 忽略这些路径（黑名单模式）
  additionalProxies: {                   // 额外的代理配置
    '/mock/': 'http://localhost:3000',
  },
})
```

| 选项                  | 类型     | 默认值 | 说明                               |
| --------------------- | -------- | ------ | ---------------------------------- |
| `target`            | string   | -      | 默认代理目标地址（必需）           |
| `getCookie`         | function | -      | Cookie 获取函数                    |
| `debug`             | boolean  | false  | 是否输出调试日志                   |
| `headers`           | object   | {}     | 自定义请求头                       |
| `includePaths`      | string[] | []     | 只代理这些路径（白名单模式）       |
| `ignorePaths`       | string[] | []     | 忽略这些路径（黑名单模式）         |
| `additionalProxies` | object   | {}     | 额外的代理配置，优先级高于默认代理 |

### 工作原理

`createAutoProxyConfig` 使用 `/` 作为通配符代理所有请求，支持两种模式：

**白名单模式（includePaths）**：

```javascript
createAutoProxyConfig({
  target: 'http://localhost:8080',
  getCookie,
  includePaths: ['/api/', '/cas/', '/examine/'],
})
```

- 只有匹配 `includePaths` 的请求才会被代理
- 其他请求不会被代理

**黑名单模式（ignorePaths）**：

```javascript
createAutoProxyConfig({
  target: 'http://localhost:8080',
  getCookie,
  ignorePaths: ['/assets/', '/img/', '/public/'],
})
```

- 除了 `ignorePaths` 中的路径，其他所有请求都会被代理

**优先级说明**：

1. 如果同时设置了 `includePaths` 和 `ignorePaths`，`includePaths` 优先
2. `additionalProxies` 中的路径优先级最高

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

### 场景二：统一代理配置

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt', { watch: true })

// 统一的代理目标
const TARGET = 'http://10.17.53.3:10000'

function createProxyConfig(path, options = {}) {
  return {
    [path]: createVueProxyConfig(TARGET, {
      getCookie,
      headers: {
        host: TARGET.replace('http://', ''),
        origin: TARGET,
        ...options.headers,
      },
      ...options,
    }),
  }
}

module.exports = {
  devServer: {
    proxy: {
      ...createProxyConfig('/api/'),
      ...createProxyConfig('/cas/'),
      ...createProxyConfig('/examine/'),
      '/mock/': createVueProxyConfig('http://localhost:3000', { getCookie }),
    },
  },
}
```

### 场景三：与环境变量结合

```javascript
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt')

// 根据环境变量配置目标地址
const TARGET = process.env.VUE_APP_API_URL || 'http://localhost:8080'

module.exports = {
  devServer: {
    proxy: {
      '/api/': createVueProxyConfig(TARGET, { getCookie }),
    },
  },
}
```

### 场景四：使用账号密码登录（禁用 Cookie 注入）

当需要使用账号密码登录时，设置 `useCookie: false`，避免覆盖浏览器的登录 Cookie：

```javascript
const { createAutoProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt')

module.exports = {
  devServer: {
    proxy: createAutoProxyConfig({
      target: 'http://10.17.53.3:10000',
      getCookie,
      useCookie: false,  // 禁用 Cookie 注入
      debug: true,
      ignorePaths: ['/assets/', '/img/', '/public/'],
    }),
  },
}
```

**使用说明：**

1. 设置 `useCookie: false` 后，代理不会从 Cookie 文件读取和注入 Cookie
2. 请求会使用浏览器发送的原始 Cookie
3. 适合需要在浏览器中手动登录的场景
4. 登录成功后，浏览器的登录状态会被保持和使用

## 启动开发服务器

```bash
npm run serve
# 或
pnpm run serve
```

启动后，代理会：

1. 通过 `getCookie` 函数获取 Cookie
2. 如果启用了 `watch: true`，会监听文件变化并自动更新 Cookie
3. 将 Cookie 注入到所有代理请求中

## 与 Webpack DefinePlugin 配合

可以结合 Webpack 的 `DefinePlugin` 定义全局变量：

```javascript
const webpack = require('webpack')
const { createVueProxyConfig, createFileCookieGetter } = require('dev-proxy-cookie')

const getCookie = createFileCookieGetter('./cookie.txt')

module.exports = {
  configureWebpack: (config) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        '__COOKIE_FILE__': JSON.stringify('./cookie.txt'),
      })
    )
  },
  devServer: {
    proxy: {
      '/api/': createVueProxyConfig('http://localhost:8080', { getCookie }),
    },
  },
}
```

## 常见问题

### Q: Cookie 文件修改后没有生效？

A: 确保在 `createFileCookieGetter` 中启用了 `watch: true`，或者手动重启开发服务器。

### Q: 某些请求没有携带 Cookie？

A: 检查该路径是否配置了代理，以及 `getCookie` 函数是否正确返回 Cookie。

### Q: 代理配置不生效？

A: 检查 `target` 地址是否正确，以及代理路径是否匹配。

### Q: 与其他代理配置冲突？

A: `createVueProxyConfig` 返回的是标准的 Webpack devServer proxy 配置对象，可以与其他配置共存。
