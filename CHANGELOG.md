# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-06-08

### Added

- ✅ **Cookie 控制参数**：新增 `useCookie` 参数，支持禁用 Cookie 注入
  - 适用于账号密码登录场景，避免覆盖浏览器登录 Cookie
  - 默认值为 `true`，保持向后兼容
  - 支持 `createVueProxyConfig`、`createAutoProxyConfig` 和 `viteMiddlewareProxy`

### Changed

- 🔄 更新所有 API 文档，添加 `useCookie` 参数说明
- 🔄 更新 Vue CLI 和 Vite 使用指南，添加账号密码登录场景示例

## [1.0.2] - 2026-05-27

### Added

- ✅ Vite 中间件插件（`viteMiddlewareProxy`），兼容所有 Vite 版本
- ✅ 自动代理功能（`createAutoProxyConfig`）
- ✅ Cookie 文件监听（`CookieWatcher`）
- ✅ 白名单/黑名单模式支持
- ✅ 钩子函数支持（`onProxyReq`, `onProxyRes`, `onError`）

### Removed

- ❌ 移除冗余的 demo、docs、__tests__ 文件夹

### Fixed

- 🐛 修复 Vite 配置中 mode 未定义问题
- 🐛 修复 Cookie 文件路径解析问题
- 🐛 修复 Cookie 注入不生效问题

## [1.0.1] - 2026-05-20

### Added

- ✅ Vue CLI 代理配置支持（`createVueProxyConfig`）
- ✅ Cookie 文件读取器（`CookieReader`）
- ✅ 基础代理功能

## [1.0.0] - 2026-05-15

### Added

- ✅ 项目初始化
- ✅ 核心代理逻辑
- ✅ 基础 Cookie 注入功能
