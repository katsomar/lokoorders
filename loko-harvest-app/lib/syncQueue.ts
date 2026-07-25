"use client";

import { OfflineStorage, QueueItem, FileBlobItem } from "./offlineStorage";

export class SyncQueue {
  public static async enqueue(
    actionType: string,
    url: string,
    method: string,
    payload: any,
    files: { fieldName: string; blob: Blob; name: string }[] = [],
    priority: number = 1
  ): Promise<QueueItem> {
    const db = await OfflineStorage.getDB();
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const fileIds: string[] = [];

    // Save binary Blobs to pending_files store
    if (files.length > 0) {
      const fileTx = db.transaction("pending_files", "readwrite");
      const fileStore = fileTx.objectStore("pending_files");

      for (const f of files) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const fileItem: FileBlobItem = {
          id: fileId,
          field_name: f.fieldName,
          blob: f.blob,
          name: f.name,
          type: f.blob.type || "image/png",
        };
        fileStore.put(fileItem);
        fileIds.push(fileId);
      }
    }

    const queueItem: QueueItem = {
      id: queueId,
      request_id: requestId,
      action_type: actionType,
      url,
      method,
      payload,
      file_ids: fileIds,
      created_at: new Date().toISOString(),
      retry_count: 0,
      last_error: null,
      status: "pending",
      user_id: typeof window !== "undefined" ? localStorage.getItem("user_id") || undefined : undefined,
      priority,
    };

    const queueTx = db.transaction("pending_queue", "readwrite");
    queueTx.objectStore("pending_queue").put(queueItem);

    return new Promise((res, rej) => {
      queueTx.oncomplete = () => res(queueItem);
      queueTx.onerror = () => {
        if (queueTx.error && queueTx.error.name === "QuotaExceededError") {
          alert("Offline storage capacity full! Please reconnect to network to sync pending work.");
        }
        rej(queueTx.error);
      };
    });
  }

  public static async getPending(): Promise<QueueItem[]> {
    const db = await OfflineStorage.getDB();
    const tx = db.transaction("pending_queue", "readonly");
    const store = tx.objectStore("pending_queue");

    return new Promise((res) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const items: QueueItem[] = request.result || [];
        // Filter active items and sort by priority (1 highest) then created_at
        const active = items.filter(
          (i) => i.status === "pending" || i.status === "waiting_retry" || i.status === "uploading"
        );
        active.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        res(active);
      };
      request.onerror = () => res([]);
    });
  }

  public static async updateStatus(
    id: string,
    status: QueueItem["status"],
    lastError: string | null = null,
    incrementRetry: boolean = false
  ): Promise<void> {
    const db = await OfflineStorage.getDB();
    const tx = db.transaction("pending_queue", "readwrite");
    const store = tx.objectStore("pending_queue");

    const request = store.get(id);
    request.onsuccess = () => {
      const item: QueueItem = request.result;
      if (item) {
        item.status = status;
        if (lastError !== null) item.last_error = lastError;
        if (incrementRetry) item.retry_count += 1;
        store.put(item);
      }
    };
  }

  public static async getFiles(fileIds: string[]): Promise<FileBlobItem[]> {
    if (!fileIds || fileIds.length === 0) return [];
    const db = await OfflineStorage.getDB();
    const tx = db.transaction("pending_files", "readonly");
    const store = tx.objectStore("pending_files");

    const files: FileBlobItem[] = [];
    for (const fid of fileIds) {
      await new Promise<void>((resolve) => {
        const req = store.get(fid);
        req.onsuccess = () => {
          if (req.result) files.push(req.result);
          resolve();
        };
        req.onerror = () => resolve();
      });
    }
    return files;
  }

  public static async remove(id: string, fileIds: string[] = []): Promise<void> {
    const db = await OfflineStorage.getDB();
    
    // Remove queue item
    const queueTx = db.transaction("pending_queue", "readwrite");
    queueTx.objectStore("pending_queue").delete(id);

    // Remove associated file Blobs
    if (fileIds.length > 0) {
      const fileTx = db.transaction("pending_files", "readwrite");
      const fileStore = fileTx.objectStore("pending_files");
      fileIds.forEach((fid) => fileStore.delete(fid));
    }
  }
}
