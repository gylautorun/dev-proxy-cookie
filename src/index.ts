/**
 * dev-proxy-cookie 模块入口文件
 * 
 * 提供开发环境下的 Cookie 代理和文件监听功能，支持 Vue CLI 和 Vite 构建工具。
 * 
 * 主要功能：
 * - Cookie 文件读取与监听
 * - 代理请求时自动注入 Cookie
 * - 支持 Vue CLI 和 Vite 两种构建工具
 * - 智能环境检测，自动启用/禁用文件监听
 * 
 * @module dev-proxy-cookie
 */
export * from './proxy';
export * from './utils';