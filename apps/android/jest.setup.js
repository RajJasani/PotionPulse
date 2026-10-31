const mockStore = new Map();

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn().mockImplementation((key) => Promise.resolve(mockStore.get(key) || null)),
  setItemAsync: jest.fn().mockImplementation((key, val) => {
    mockStore.set(key, val);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn().mockImplementation((key) => {
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));
