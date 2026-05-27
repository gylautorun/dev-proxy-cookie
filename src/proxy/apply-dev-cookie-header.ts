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
  proxyReq: { removeHeader(name: string): void; setHeader(name: string, value: string): void; getHeader?(name: string): string | undefined },
  cookie: string
): void {
  console.log('[applyDevCookieHeader] === START ===');
  console.log('[applyDevCookieHeader] Cookie to apply:', cookie ? `(length: ${cookie.length})` : '(empty)');
  
  if (!cookie) {
    console.log('[applyDevCookieHeader] Cookie is empty, returning');
    console.log('[applyDevCookieHeader] === END ===');
    return;
  }
  
  // 尝试获取当前的 cookie 头（如果有）
  const existingCookie = proxyReq.getHeader?.('Cookie');
  console.log('[applyDevCookieHeader] Cookie current:', existingCookie ? `(length: ${String(existingCookie).length})` : '(none)');
  
  // 如果现有 Cookie 与要设置的 Cookie 相同，直接跳过处理
  if (existingCookie === cookie) {
    console.log('[applyDevCookieHeader] Cookie is already set, skipping');
    console.log('[applyDevCookieHeader] === END ===');
    return;
  }
  
  proxyReq.removeHeader('Cookie');
  proxyReq.setHeader('Cookie', cookie);
  
  // 验证是否设置成功
  const newCookie = proxyReq.getHeader?.('Cookie');
  console.log('[applyDevCookieHeader] Cookie new:', newCookie ? `(length: ${String(newCookie).length})` : '(failed)');
  console.log('[applyDevCookieHeader] === END ===');
}
