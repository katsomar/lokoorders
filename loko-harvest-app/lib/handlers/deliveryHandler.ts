"use client";

import api from "../api";
import { QueueItem, FileBlobItem } from "../offlineStorage";
import { SyncQueue } from "../syncQueue";

export class DeliveryHandler {
  public static async process(item: QueueItem): Promise<boolean> {
    const files: FileBlobItem[] = await SyncQueue.getFiles(item.file_ids || []);

    const formData = new FormData();
    formData.append("request_id", item.request_id);

    // Append JSON payload fields
    if (item.payload) {
      Object.keys(item.payload).forEach((key) => {
        if (item.payload[key] !== null && item.payload[key] !== undefined) {
          formData.append(key, item.payload[key]);
        }
      });
    }

    // Append binary file Blobs
    files.forEach((file) => {
      formData.append(file.field_name, file.blob, file.name || "proof.png");
    });

    const headers: any = {
      "Content-Type": "multipart/form-data",
      "X-Request-Id": item.request_id,
    };

    const res = await api.post(item.url, formData, { headers });
    return res.status === 200 || res.status === 201;
  }
}
