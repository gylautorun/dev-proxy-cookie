import { applyDevAuthentications, AuthenticationItem } from '../src/proxy/apply-dev-authentications';

describe('applyDevAuthentications', () => {
  let proxyReq: {
    setHeader: jest.Mock;
    getHeader?: jest.Mock;
  };

  beforeEach(() => {
    proxyReq = {
      setHeader: jest.fn(),
      getHeader: jest.fn().mockReturnValue(undefined),
    };
  });

  it('should apply single authentication item to headers', () => {
    const authentications: AuthenticationItem[] = [{ ticket: 'xxxx' }];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'xxxx');
  });

  it('should apply multiple authentication items to headers', () => {
    const authentications: AuthenticationItem[] = [
      { ticket: 'xxxx' },
      { 'X-Custom-Token': 'yyyy' },
      { Authorization: 'Bearer zzzz' },
    ];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'xxxx');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('X-Custom-Token', 'yyyy');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer zzzz');
  });

  it('should handle empty authentications array', () => {
    const authentications: AuthenticationItem[] = [];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).not.toHaveBeenCalled();
  });

  it('should handle undefined authentications', () => {
    applyDevAuthentications(proxyReq as any, undefined as any);

    expect(proxyReq.setHeader).not.toHaveBeenCalled();
  });

  it('should handle authentication item with multiple keys', () => {
    const authentications: AuthenticationItem[] = [{ ticket: 'xxxx', 'user-id': '123' }];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'xxxx');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('user-id', '123');
  });

  it('should skip empty authentication values', () => {
    const authentications: AuthenticationItem[] = [{ ticket: '', roleCode: 'admin' }];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).not.toHaveBeenCalledWith('ticket', '');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('roleCode', 'admin');
  });

  it('should not overwrite existing non-empty client headers', () => {
    proxyReq.getHeader = jest.fn((name: string) => {
      if (name === 'ticket' || name === 'ticket'.toLowerCase()) {
        return 'client-ticket';
      }
      return undefined;
    });

    const authentications: AuthenticationItem[] = [{ ticket: 'proxy-ticket', appCode: 'PXGL' }];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).not.toHaveBeenCalledWith('ticket', 'proxy-ticket');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('appCode', 'PXGL');
  });

  it('should fill headers when client sent empty values', () => {
    proxyReq.getHeader = jest.fn((name: string) => {
      if (name === 'ticket' || name === 'ticket'.toLowerCase()) {
        return '';
      }
      return undefined;
    });

    const authentications: AuthenticationItem[] = [{ ticket: 'proxy-ticket' }];

    applyDevAuthentications(proxyReq as any, authentications);

    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'proxy-ticket');
  });
});
