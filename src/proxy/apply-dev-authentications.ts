/**
 * 应用开发环境自定义鉴权信息到代理请求头
 *
 * 将自定义鉴权信息数组展开为请求头键值对，注入到代理请求中。
 * 支持多种鉴权方式，如 ticket、token、Authorization 等。
 *
 * @module apply-dev-authentications
 */

export type AuthenticationItem = Record<string, string>;

function isHeaderEmpty(value: string | string[] | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((item) => !String(item).trim());
  }
  return !String(value).trim();
}

function getExistingHeader(
  proxyReq: {
    getHeader?(name: string): string | string[] | undefined;
  },
  key: string
): string | string[] | undefined {
  if (!proxyReq.getHeader) {
    return undefined;
  }

  const direct = proxyReq.getHeader(key);
  if (direct !== undefined) {
    return direct;
  }

  return proxyReq.getHeader(key.toLowerCase());
}

/**
 * 将自定义鉴权信息数组应用到代理请求头
 *
 * @param proxyReq - 代理请求对象
 * @param authentications - 鉴权信息数组，每个元素是一个键值对对象
 */
export function applyDevAuthentications(
  proxyReq: {
    setHeader(name: string, value: string): void;
    getHeader?(name: string): string | string[] | undefined;
    removeHeader?(name: string): void;
  },
  authentications: AuthenticationItem[]
): void {
  console.log('[applyDevAuthentications] === START ===');

  if (!authentications || authentications.length === 0) {
    console.log('[applyDevAuthentications] Authentications is empty, returning');
    console.log('[applyDevAuthentications] === END ===');
    return;
  }

  console.log('[applyDevAuthentications] Applying authentications:', JSON.stringify(authentications));

  for (const authItem of authentications) {
    for (const [key, value] of Object.entries(authItem)) {
      if (!value) {
        console.log('[applyDevAuthentications] Skip empty header:', key);
        continue;
      }

      proxyReq.removeHeader?.(key);
      proxyReq.setHeader(key, value);
      console.log('[applyDevAuthentications] Set header:', key, '->', value);
    }
  }

  console.log('[applyDevAuthentications] === END ===');
}
