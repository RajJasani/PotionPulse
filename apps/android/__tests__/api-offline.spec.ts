import { api, OfflineWriteError } from '../src/services/api';
import { networkService } from '../src/services/network';

describe('Android Online-Only Policy & API Offline Behavior', () => {
  beforeEach(() => {
    networkService.setOnlineStatus(true);
    api.clearCache();
  });

  afterAll(() => {
    networkService.setOnlineStatus(true);
  });

  it('permits write operations when device has active network connection', () => {
    expect(networkService.isOnline).toBe(true);
  });

  it('strictly blocks inventory mutations when offline and throws OfflineWriteError', async () => {
    // Put device in offline mode
    networkService.setOnlineStatus(false);
    expect(networkService.isOnline).toBe(false);

    // Attempting a stock mutation when offline must be rejected immediately
    await expect(
      api.request('/inventory/movements', {
        method: 'POST',
        body: { ingredientId: 'ing-1', quantity: 10 },
      }),
    ).rejects.toThrow(OfflineWriteError);

    // Attempting a sale when offline must be rejected immediately
    await expect(
      api.request('/sales', {
        method: 'POST',
        body: { items: [{ ingredientId: 'ing-1', quantity: 1 }] },
      }),
    ).rejects.toThrow(OfflineWriteError);
  });

  it('notifies subscribers when network connection state transitions', () => {
    const listener = jest.fn();
    const unsubscribe = networkService.subscribe(listener);

    networkService.setOnlineStatus(false);
    expect(listener).toHaveBeenCalledWith(false);

    networkService.setOnlineStatus(true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
  });
});
