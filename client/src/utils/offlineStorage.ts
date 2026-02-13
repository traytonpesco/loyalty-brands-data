// IndexedDB wrapper for offline data storage

const DB_NAME = 'BrightBlueBrandPortal';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CAMPAIGNS: 'campaigns',
  OFFLINE_ACTIONS: 'offlineActions',
  SETTINGS: 'settings',
};

export interface OfflineAction {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

class OfflineStorageDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.CAMPAIGNS)) {
          db.createObjectStore(STORES.CAMPAIGNS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.OFFLINE_ACTIONS)) {
          const actionsStore = db.createObjectStore(STORES.OFFLINE_ACTIONS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  async saveCampaign(campaign: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CAMPAIGNS, 'readwrite');
      const store = transaction.objectStore(STORES.CAMPAIGNS);
      const request = store.put(campaign);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCampaign(id: string): Promise<any | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CAMPAIGNS, 'readonly');
      const store = transaction.objectStore(STORES.CAMPAIGNS);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllCampaigns(): Promise<any[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CAMPAIGNS, 'readonly');
      const store = transaction.objectStore(STORES.CAMPAIGNS);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteCampaign(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CAMPAIGNS, 'readwrite');
      const store = transaction.objectStore(STORES.CAMPAIGNS);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addOfflineAction(action: OfflineAction): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_ACTIONS, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.add({
        ...action,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_ACTIONS, 'readonly');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeOfflineAction(id: number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_ACTIONS, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearOfflineActions(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_ACTIONS, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSetting(key: string): Promise<any | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
const offlineStorage = new OfflineStorageDB();
export default offlineStorage;

// Helper to check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Helper to wait for online status
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    }
  });
}

// Sync offline actions when back online
export async function syncOfflineActions(): Promise<void> {
  if (!isOnline()) {
    console.log('[Offline Storage] Cannot sync - offline');
    return;
  }

  try {
    const actions = await offlineStorage.getOfflineActions();
    console.log(`[Offline Storage] Syncing ${actions.length} offline actions`);

    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          await offlineStorage.removeOfflineAction(action.id!);
          console.log(`[Offline Storage] Synced action ${action.id}`);
        } else {
          console.error(`[Offline Storage] Failed to sync action ${action.id}:`, response.status);
        }
      } catch (error) {
        console.error(`[Offline Storage] Error syncing action ${action.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Offline Storage] Sync failed:', error);
  }
}

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Offline Storage] Back online - syncing...');
    syncOfflineActions();
  });
}

