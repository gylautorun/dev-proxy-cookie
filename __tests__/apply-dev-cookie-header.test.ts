import { applyDevCookieHeader } from '../src/proxy/apply-dev-cookie-header';

describe('applyDevCookieHeader', () => {
  test('no-ops on empty cookie', () => {
    const proxyReq = { removeHeader: jest.fn(), setHeader: jest.fn() };
    applyDevCookieHeader(proxyReq, '');
    expect(proxyReq.removeHeader).not.toHaveBeenCalled();
    expect(proxyReq.setHeader).not.toHaveBeenCalled();
  });

  test('removes browser cookie headers then sets file cookie', () => {
    const proxyReq = { removeHeader: jest.fn(), setHeader: jest.fn() };
    applyDevCookieHeader(proxyReq, 'JSESSIONID=file');
    expect(proxyReq.removeHeader).toHaveBeenCalledWith('cookie');
    expect(proxyReq.removeHeader).toHaveBeenCalledWith('Cookie');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'JSESSIONID=file');
  });
});
