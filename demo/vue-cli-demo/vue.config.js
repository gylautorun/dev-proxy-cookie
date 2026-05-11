/**
 * Vue CLI 开发服务器代理配置示例
 * 使用 dev-proxy-cookie 实现自动代理和 Cookie 注入
 * 
 * 配置结构说明：
 * 1. Cookie 获取器配置
 * 2. 自动代理配置（推荐）
 * 3. 手动代理配置（灵活控制）
 * 4. 额外代理配置
 */

const { 
  createAutoProxyConfig, 
  createVueProxyConfig, 
  createFileCookieGetter 
} = require('dev-proxy-cookie');

// ============================================================
// 【Cookie 获取器配置】
// ============================================================

/**
 * 创建 Cookie 文件读取器
 * @param {string} filePath - Cookie 文件路径
 * @param {object} options - 配置选项
 * @param {boolean} options.watch - 是否监听文件变化（默认：false）
 * @param {boolean} options.debug - 是否输出调试日志（默认：false）
 */
const getCookie = createFileCookieGetter('./cookie.txt', {
  /**
   * 监听文件变化（默认：false）
   * 开启后当 Cookie 文件修改时会自动更新，无需重启服务器
   */
  watch: true,
  
  /**
   * 调试模式（默认：false）
   * 开启后会输出 Cookie 文件读取和变化的日志
   */
  debug: true,
});

// ============================================================
// 【统一代理配置函数】- 封装通用配置
// ============================================================

/**
 * 创建统一的代理配置
 * @param {string} target - 目标服务器地址
 * @param {object} options - 额外配置选项
 */
function createProxyConfig(target, options = {}) {
  return createVueProxyConfig(target, {
    getCookie,
    debug: true,
    ws: true,
    changeOrigin: true,
    secure: false,
    followRedirects: true,
    ...options,
  });
}

// ============================================================
// 【开发服务器主配置】
// ============================================================

module.exports = {
  /**
   * 开发服务器基础配置
   */
  devServer: {
    // 端口号（默认：8080）
    port: 8080,
    
    // 主机地址（默认：localhost）
    // 设为 0.0.0.0 可允许外部访问
    host: '0.0.0.0',
    
    // 是否启用 HTTPS（默认：false）
    https: false,
    
    // 是否自动打开浏览器（默认：false）
    open: false,
    
    // 热更新（默认：true）
    hot: true,
    
    // ============================================================
    // 【代理配置】- 核心配置
    // ============================================================
    
    proxy: createAutoProxyConfig({
      // --------------------------
      // 基础配置
      // --------------------------
      
      /**
       * 目标代理服务器地址（必需）
       * 所有请求默认代理到该地址
       */
      target: 'http://localhost:3000',
      
      /**
       * Cookie 获取函数（必需）
       * 用于动态获取 Cookie
       */
      getCookie,
      
      /**
       * 调试模式（默认：false）
       * 开启后输出详细日志
       */
      debug: true,
      
      // --------------------------
      // 路径过滤配置
      // --------------------------
      
      /**
       * 白名单模式 - 只代理这些路径（默认：[]）
       * 与 ignorePaths 互斥，includePaths 优先级更高
       * 当配置了 includePaths 时，只有匹配这些路径的请求才会被代理
       * 适用于只需要代理特定 API 路径的场景
       * 注意：additionalProxies 中的路径不受此限制
       */
      // includePaths: [
      //   '/api/',          // API 接口
      //   '/cas/',          // 单点登录
      //   '/examine/',      // 审核接口
      //   '/ws/',           // WebSocket 路径
      // ],
      
      /**
       * 黑名单模式 - 忽略这些路径（默认：[]）
       * 这些路径不会被代理，直接由开发服务器处理
       * 适用于静态资源、favicon、本地 Mock 等不需要代理的路径
       * 注意：
       *   1. additionalProxies 中的路径不受此限制
       *   2. 如果同时配置了 includePaths，ignorePaths 会被忽略
       *   3. 支持字符串前缀匹配，如 '/assets/' 会匹配 '/assets/js/app.js'
       */
      ignorePaths: [
        '/assets/',           // 静态资源目录
        '/img/',              // 图片资源
        '/public/',           // 公共资源
        '/favicon.ico',       // 网站图标
        '/robots.txt',        // 搜索引擎爬取规则
        '/sockjs-node/',      // SockJS WebSocket 路径（热更新用）
        '/webpack-dev-server/', // Webpack 开发服务器内部路径
      ],
      
      // --------------------------
      // HTTP 代理核心配置
      // --------------------------
      
      /**
       * WebSocket 支持（默认：true）
       * 开启后支持 WebSocket 协议代理
       */
      ws: true,
      
      /**
       * 修改请求来源（默认：true）
       * 将请求头中的 Host 和 Origin 修改为目标服务器地址
       */
      changeOrigin: true,
      
      /**
       * 验证 SSL 证书（默认：false）
       * 开发环境建议关闭，支持自签名证书
       */
      secure: false,
      
      /**
       * 跟随重定向（默认：true）
       * 自动跟随 3xx 重定向
       */
      followRedirects: true,
      
      /**
       * 自动重写路径（默认：false）
       */
      autoRewrite: false,
      
      /**
       * 协议重写（默认：undefined）
       */
      protocolRewrite: 'http',
      
      // --------------------------
      // Cookie 处理配置
      // --------------------------
      
      /**
       * Cookie 域名重写（默认：'*'）
       */
      cookieDomainRewrite: {
        '*': 'localhost',
        'example.com': 'localhost',
      },
      
      /**
       * Cookie 路径重写（默认：false）
       */
      cookiePathRewrite: false,
      
      // --------------------------
      // 自定义请求头
      // --------------------------
      
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Proxy-By': 'dev-proxy-cookie',
        'Origin': 'http://localhost:8080',
        'Referer': 'http://localhost:8080/',
      },
      
      // --------------------------
      // 额外代理配置（优先级最高）
      // --------------------------
      
      /**
       * 额外的代理规则
       * 这些规则优先级高于默认代理
       * 值可以是字符串（目标地址）或完整的代理配置对象
       */
      additionalProxies: {
        // 示例 1：简单配置 - 仅指定目标地址
        '/mock/': 'http://localhost:3001',
        
        // 示例 2：完整配置 - 包含所有代理选项
        '/api/v2/': {
          target: 'http://192.168.1.100:8080',
          ws: true,
          changeOrigin: true,
          secure: false,
          followRedirects: true,
          headers: {
            'X-Custom-Header': 'value',
          },
        },
        
        // 示例 3：WebSocket 专用代理
        '/ws/': {
          target: 'ws://localhost:3002',
          ws: true,
          changeOrigin: true,
        },
      },
    }),
  },
  
  // ============================================================
  // 【其他配置示例】
  // ============================================================
  
  /**
   * 如果需要更精细的代理控制，可以不使用 createAutoProxyConfig
   * 而是手动配置每个路径的代理规则
   */
  // devServer: {
  //   proxy: {
  //     // 代理到主服务器
  //     '/api/': createProxyConfig('http://localhost:3000'),
  //     '/cas/': createProxyConfig('http://localhost:3000'),
  //     '/examine/': createProxyConfig('http://localhost:3000', {
  //       headers: {
  //         host: 'localhost:3000',
  //         origin: 'http://localhost:3000',
  //       },
  //     }),
  //     
  //     // 代理到其他服务器
  //     '/mock/': createProxyConfig('http://localhost:3001'),
  //     '/ws/': {
  //       target: 'ws://localhost:3002',
  //       ws: true,
  //       changeOrigin: true,
  //     },
  //   },
  // },
  
  /**
   * Webpack 配置扩展
   */
  configureWebpack: {
    // 示例：添加全局变量
    // plugins: [
    //   new webpack.DefinePlugin({
    //     '__COOKIE_FILE__': JSON.stringify('./cookie.txt'),
    //     '__API_URL__': JSON.stringify('http://localhost:3000'),
    //   }),
    // ],
  },
};

// ============================================================
// 【配置说明】
// ============================================================

/**
 * Cookie 文件格式（./cookie.txt）：
 * 
 * # 注释行以 # 开头
 * # 每行一个 Cookie 键值对
 * JSESSIONID=abc123def456;
 * user=admin;
 * token=xyz789;
 * 
 * 注意事项：
 * 1. Cookie 值末尾的分号可选
 * 2. 空行会被忽略
 * 3. 建议定期更新 Cookie，避免过期
 */

/**
 * 代理优先级说明：
 * 1. additionalProxies 中的路径优先级最高
 * 2. includePaths / ignorePaths 其次
 * 3. 默认代理（/）优先级最低
 */

/**
 * 常见场景配置：
 * 
 * 1. 模拟登录：
 *    - 浏览器登录目标系统
 *    - 复制 Cookie 到 cookie.txt
 *    - 启动开发服务器，自动携带 Cookie
 * 
 * 2. 多环境切换：
 *    - 使用环境变量配置 target
 *    - const target = process.env.VUE_APP_API_URL || 'http://localhost:3000'
 * 
 * 3. 本地 Mock 数据：
 *    - 使用 additionalProxies 将 /mock/ 代理到本地 Mock 服务器
 *    - 其他路径代理到真实服务器
 */
