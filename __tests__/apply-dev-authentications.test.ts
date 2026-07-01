import { applyDevAuthentications, AuthenticationItem } from '../src/proxy/apply-dev-authentications';

describe('applyDevAuthentications', () => {
  let proxyReq: {
    setHeader: jest.Mock;
    getHeader?: jest.Mock;
  };

  beforeEach(() => {
    proxyReq = {
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    };
  });

  it('should apply single authentication item to headers', () => {
    const authentications: AuthenticationItem[] = [{ 'ticket': 'xxxx' }];
    
    applyDevAuthentications(proxyReq as any, authentications);
    
    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'xxxx');
  });

  it('should apply multiple authentication items to headers', () => {
    const authentications: AuthenticationItem[] = [
      { 'ticket': 'xxxx' },
      { 'X-Custom-Token': 'yyyy' },
      { 'Authorization': 'Bearer zzzz' },
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
    const authentications: AuthenticationItem[] = [
      { 'ticket': 'xxxx', 'user-id': '123' },
    ];
    
    applyDevAuthentications(proxyReq as any, authentications);
    
    expect(proxyReq.setHeader).toHaveBeenCalledWith('ticket', 'xxxx');
    expect(proxyReq.setHeader).toHaveBeenCalledWith('user-id', '123');
  });
});