/**
 * 应用开发环境 Cookie 到代理请求头
 * 
 * 将文件中读取的 Cookie 设置到代理请求中，替换浏览器发送的 Cookie。
 * 这是必要的，因为当 withCredentials 为 true 时，浏览器会发送其自身的 Cookie，
 * 与文件中的 Cookie 合并可能导致重复的 Cookie 名称（如两个 JSESSIONID），
 * 而服务器通常会优先使用第一个值（浏览器的旧会话）。
 * 
 * @param proxyReq - 代理请求对象
 * @param cookie - 要设置的 Cookie 字符串
 */
export function applyDevCookieHeader(
  proxyReq: { removeHeader(name: string): void; setHeader(name: string, value: string): void },
  cookie: string
): void {
  if (!cookie) return;
  proxyReq.removeHeader('cookie');
  proxyReq.removeHeader('Cookie');
  proxyReq.setHeader('Cookie', cookie);
}
