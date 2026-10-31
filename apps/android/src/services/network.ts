type NetworkListener = (isOnline: boolean) => void;

class NetworkService {
  private _isOnline: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private lastOnlineTimestamp: string = new Date().toISOString();

  get isOnline(): boolean {
    return this._isOnline;
  }

  get lastUpdated(): string {
    return this.lastOnlineTimestamp;
  }

  setOnlineStatus(status: boolean) {
    if (this._isOnline !== status) {
      this._isOnline = status;
      if (status) {
        this.lastOnlineTimestamp = new Date().toISOString();
      }
      this.notifyListeners();
    }
  }

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this._isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this._isOnline);
      } catch (e) {
        console.error('Network listener error', e);
      }
    }
  }
}

export const networkService = new NetworkService();
