// Chrome Extension Storage Service
export class ChromeStorageService {
  static async get<T = unknown>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined' && window.chrome?.storage) {
      return new Promise((resolve) => {
        window.chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      });
    } else {
      // Fallback to localStorage for development
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  }

  static async set(key: string, value: unknown): Promise<void> {
    if (typeof window !== 'undefined' && window.chrome?.storage) {
      return new Promise((resolve) => {
        window.chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage for development
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static async remove(key: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage for development
      localStorage.removeItem(key);
    }
  }

  static async clear(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage for development
      localStorage.clear();
    }
  }
}