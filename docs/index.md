# dev-proxy-cookie

一个用于开发环境的代理 Cookie 注入工具，支持自动代理所有请求和 Cookie 注入。

## 功能特性

- ✅ **Cookie 自动注入**：将 Cookie 文件中的 Cookie 自动注入到所有代理请求中
- ✅ **Cookie 控制**：支持 `useCookie` 参数，可禁用 Cookie 注入，兼容账号密码登录场景
- ✅ **自动代理**：支持自动代理所有请求，无需手动配置多个代理规则
- ✅ **双框架支持**：同时支持 Vite 和 Vue CLI (vue.config.js)
- ✅ **灵活配置**：支持自定义代理映射、忽略路径等
- ✅ **版本兼容**：Vite 插件兼容所有 Vite 版本（2.x/3.x/4.x/5.x）

## 快速开始

### 安装

```bash
npm install dev-proxy-cookie --save-dev
# 或
pnpm add dev-proxy-cookie -D
```

### 创建 Cookie 文件

在项目根目录创建 `cookie.txt` 文件：

```
# 开发环境 Cookie 配置
JSESSIONID=abc123def456;
user=admin;
token=xyz789;
```

### 使用方式

根据你的项目类型选择对应的使用方式：

- **Vite 项目**：查看 [Vite 使用指南](usage-vite.md)
- **Vue CLI 项目**：查看 [Vue.config.js 使用指南](usage-vue-config.md)

## 目录结构

```
dev-proxy-cookie/
├── src/              # 源代码
│   ├── proxy/        # 代理模块
│   ├── utils/        # 工具模块
│   └── index.ts      # 入口文件
├── __tests__/        # 单元测试
├── demo/             # 示例项目
├── docs/             # 文档
└── dist/             # 构建产物
```

## API 文档

查看 [API 文档](api.md) 获取完整的配置选项说明。

## 版本变更

查看 [CHANGELOG](CHANGELOG.md) 获取版本更新记录。

## 发布流程

查看 [发布流程](release.md) 获取版本管理和发布相关的详细说明。
