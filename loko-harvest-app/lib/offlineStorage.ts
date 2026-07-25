"use client";

const DB_NAME = "loko_offline_v2";
const DB_VERSION = 2;

export interface QueueItem {
  id: string;
  request_id: string;
  action_type: string;
  url: string;
  method: string;
  payload: any;
  file_ids?: string[];
  created_at: string;
  retry_count: number;
  last_error: string | null;
  status: "pending" | "validating" | "uploading" | "waiting_retry" | "synced" | "archived" | "failed";
  user_id?: string;
  priority: number; // 1: Delivery/Signature, 2: Return, 3: Refuel
}

export interface FileBlobItem {
  id: string;
  field_name: string;
  blob: Blob;
  name: string;
  type: string;
}

export class OfflineStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        return reject(new Error("IndexedDB not supported"));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;

        // Create object stores if not exist (preserving unsynced queue items on upgrade)
        if (!db.objectStoreNames.contains("cached_deliveries")) {
          db.createObjectStore("cached_deliveries", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cached_customers")) {
          db.createObjectStore("cached_customers", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cached_products")) {
          db.createObjectStore("cached_products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cached_profile")) {
          db.createObjectStore("cached_profile", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("pending_queue")) {
          const queueStore = db.createObjectStore("pending_queue", { keyPath: "id" });
          queueStore.createIndex("status", "status", { unique: false });
          queueStore.createIndex("priority", "priority", { unique: false });
        }
        if (!db.objectStoreNames.contains("pending_files")) {
          db.createObjectStore("pending_files", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sync_logs")) {
          db.createObjectStore("sync_logs", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sync_metadata")) {
          db.createObjectStore("sync_metadata", { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Cache helper
  public static async setCache(storeName: string, item: any): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(item);
      return new Promise((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch (e: any) {
      if (e.name === "QuotaExceededError") {
        console.warn("IndexedDB Quota Exceeded during cache store");
      }
    }
  }

  public static async getCache(storeName: string, key: string): Promise<any> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).get(key);
      return new Promise((res, rej) => {
        request.onsuccess = () => res(request.result);
        request.onerror = () => rej(request.error);
      });
    } catch (e) {
      return null;
    }
  }

  public static async getAllCache(storeName: string): Promise<any[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).getAll();
      return new Promise((res, rej) => {
        request.onsuccess = () => res(request.result || []);
        request.onerror = () => rej(request.error);
      });
    } catch (e) {
      return [];
    }
  }
}
