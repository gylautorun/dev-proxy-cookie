import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteAutoProxyCookie } from 'dev-proxy-cookie'

export default defineConfig({
  plugins: [
    vue(),
    viteAutoProxyCookie({
      // ============================================================
      // 【基础配置】- 必填项
      // ============================================================
      
      /**
       * Cookie 文件路径（必需）
       * 格式：每行一个 Cookie 键值对，以 # 开头为注释
       * 示例：
       *   # 登录凭证
       *   JSESSIONID=abc123def456;
       *   user=admin;
       */
      cookieFile: './cookie.txt',
      
      /**
       * 目标代理服务器地址（必需）
       * 所有请求默认代理到该地址
       */
      target: 'http://localhost:3000',
      
      // ============================================================
      // 【开发辅助配置】- 可选
      // ============================================================
      
      /**
       * 调试模式（默认：false）
       * 开启后会输出详细的代理日志，便于排查问题
       */
      debug: true,
      
      /**
       * Cookie 变化时自动重启开发服务器（默认：false）
       * 需要配合 restartMarkerFile 使用
       */
      autoRestart: true,
      
      /**
       * 重启标记文件路径（默认：'.cookie-restart-marker'）
       * 当 Cookie 文件变化时，会在该路径写入标记文件
       * 开发服务器监听此文件变化来实现自动重启
       */
      restartMarkerFile: '.cookie-restart-marker',
      
      /**
       * 日志级别（默认：'info'）
       * 可选值：'debug' | 'info' | 'warn' | 'error'
       */
      logLevel: 'debug',
      
      // ============================================================
      // 【代理路径配置】- 可选
      // ============================================================
      
      /**
       * 自定义代理映射表（默认：{}）
       * 优先级：proxyMap > includePaths/ignorePaths > 默认代理
       * 匹配的路径会代理到指定地址，不受 includePaths/ignorePaths 影响
       * 示例：'/mock/' 路径的请求会代理到 http://localhost:3001
       */
      proxyMap: {
        '/mock/': 'http://localhost:3001',
        '/api/v2/': 'http://192.168.1.100:8080',
      },
      
      /**
       * 白名单模式 - 只代理这些路径（默认：[]）
       * 与 ignorePaths 互斥，includePaths 优先级更高
       * 当配置了 includePaths 时，只有匹配这些路径的请求才会被代理
       * 适用于只需要代理特定 API 路径的场景
       * 注意：proxyMap 中的路径不受此限制
       */
      // includePaths: ['/api/', '/cas/', '/examine/'],
      
      /**
       * 黑名单模式 - 忽略这些路径（默认：[]）
       * 这些路径不会被代理，直接由开发服务器处理
       * 适用于静态资源、favicon、本地 Mock 等不需要代理的路径
       * 注意：
       *   1. proxyMap 中的路径不受此限制
       *   2. 如果同时配置了 includePaths，ignorePaths 会被忽略
       *   3. 支持字符串前缀匹配，如 '/assets/' 会匹配 '/assets/js/app.js'
       */
      ignorePaths: [
        '/assets/',           // 静态资源目录
        '/img/',              // 图片资源
        '/public/',           // 公共资源
        '/favicon.ico',       // 网站图标
        '/robots.txt',        // 搜索引擎爬取规则
        '/__vite_ping',       // Vite 内部健康检查
        '/.vite/',            // Vite 开发服务器内部路径
        '/sockjs-node/',      // SockJS WebSocket 路径（热更新用）
      ],
      
      // ============================================================
      // 【HTTP 代理核心配置】- 基于 http-proxy 库
      // ============================================================
      
      /**
       * WebSocket 代理支持（默认：true）
       * 开启后支持 WebSocket 协议的代理
       * 适用于实时通信场景，如聊天室、推送服务等
       */
      ws: true,
      
      /**
       * 修改请求来源（默认：true）
       * 将请求头中的 Host 和 Origin 修改为目标服务器地址
       * 解决跨域问题的关键配置
       */
      changeOrigin: true,
      
      /**
       * 验证 SSL 证书（默认：false）
       * 设为 true 时会验证目标服务器的 SSL 证书
       * 生产环境建议开启，开发环境可关闭以支持自签名证书
       */
      secure: false,
      
      /**
       * 跟随重定向（默认：true）
       * 当目标服务器返回 3xx 状态码时自动跟随重定向
       */
      followRedirects: true,
      
      /**
       * 自动重写路径（默认：false）
       * 自动将请求路径中的协议和域名替换为目标服务器的
       */
      autoRewrite: false,
      
      /**
       * 协议重写（默认：undefined）
       * 将请求协议替换为指定协议，如 'http' 或 'https'
       * 示例：'http' - 强制使用 HTTP 协议
       */
      protocolRewrite: 'http',
      
      // ============================================================
      // 【Cookie 处理配置】- 可选
      // ============================================================
      
      /**
       * Cookie 域名重写（默认：'*'）
       * 将响应中的 Cookie 域名替换为指定值
       * 可选值：
       *   - false: 不重写
       *   - string: 统一替换为该域名，如 'localhost'
       *   - object: 映射表，如 { 'old-domain.com': 'localhost' }
       */
      cookieDomainRewrite: {
        '*': 'localhost',        // 所有域名替换为 localhost
        'example.com': 'localhost',
        'api.example.com': 'localhost:5173',
      },
      
      /**
       * Cookie 路径重写（默认：false）
       * 将响应中的 Cookie 路径替换为指定值
       * 可选值：
       *   - false: 不重写
       *   - string: 统一替换为该路径，如 '/'
       *   - object: 映射表，如 { '/old-path': '/' }
       */
      cookiePathRewrite: {
        '/api/': '/',
        '/v1/': '/',
      },
      
      // ============================================================
      // 【自定义请求头】- 可选
      // ============================================================
      
      /**
       * 自定义请求头（默认：{}）
       * 在代理请求时添加额外的请求头
       */
      headers: {
        // 标识请求来源
        'X-Requested-With': 'XMLHttpRequest',
        'X-Proxy-By': 'dev-proxy-cookie',
        
        // 模拟浏览器请求
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        
        // 自定义来源
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/',
      },
      
      // ============================================================
      // 【钩子函数】- 可选，用于自定义处理逻辑
      // ============================================================
      
      hooks: {
        /**
         * 请求代理前触发
         * @param {http.ClientRequest} proxyReq - 代理请求对象
         * @param {http.IncomingMessage} req - 原始请求对象
         * @param {http.ServerResponse} res - 响应对象
         */
        onProxyReq: (proxyReq, req, res) => {
          // 示例：添加自定义请求头
          proxyReq.setHeader('X-Custom-Header', 'custom-value');
          
          // 示例：修改请求路径
          if (req.url?.startsWith('/api/')) {
            proxyReq.path = req.url.replace('/api/', '/v1/api/');
          }
          
          // 示例：记录请求日志
          console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        
        /**
         * 响应代理前触发
         * @param {http.IncomingMessage} proxyRes - 代理响应对象
         * @param {http.IncomingMessage} req - 原始请求对象
         * @param {http.ServerResponse} res - 客户端响应对象
         */
        onProxyRes: (proxyRes, req, res) => {
          // 示例：添加响应头标识
          res.setHeader('X-Proxied-By', 'dev-proxy-cookie');
          
          // 示例：处理特定状态码
          if (proxyRes.statusCode === 401) {
            console.warn(`[Proxy] Unauthorized: ${req.url}`);
          }
          
          // 示例：记录响应日志
          console.log(`[Proxy] ${req.url} <- ${proxyRes.statusCode}`);
        },
        
        /**
         * 代理错误时触发
         * @param {Error} err - 错误对象
         * @param {http.IncomingMessage} req - 请求对象
         * @param {http.ServerResponse | net.Socket} res - 响应对象（可能是 Socket）
         */
        onError: (err, req, res) => {
          // 示例：记录错误日志
          console.error(`[Proxy Error] ${req.url}: ${err.message}`);
          
          // 示例：返回自定义错误响应
          if (res instanceof http.ServerResponse && !res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              message: '服务暂不可用，请稍后重试',
              error: err.message,
            }));
          }
        },
        
        /**
         * WebSocket 错误时触发
         * @param {Error} err - 错误对象
         * @param {http.IncomingMessage} req - 请求对象
         * @param {net.Socket} socket - WebSocket 套接字
         */
        onWsError: (err, req, socket) => {
          // 示例：记录 WebSocket 错误
          console.error(`[WebSocket Error] ${req.url}: ${err.message}`);
          
          // 示例：关闭套接字
          if (socket) {
            socket.close();
          }
        },
      },
    }),
  ],
})
