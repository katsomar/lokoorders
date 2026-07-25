"use client";

import { SyncQueue } from "./syncQueue";
import { HealthService } from "./healthService";
import { NetworkMonitor } from "./networkMonitor";
import { DevSimulator } from "./devSimulator";
import { DeliveryHandler } from "./handlers/deliveryHandler";
import { RefuelHandler } from "./handlers/refuelHandler";

const RETRY_BACKOFFS_MS = [5000, 15000, 30000, 60000, 300000]; // 5s, 15s, 30s, 1m, 5m

export class SyncEngine {
  private static isSyncingMutex: boolean = false;
  private static onSyncCompleteCallbacks: Set<() => void> = new Set();
  private static onStatusChangeCallbacks: Set<(status: { pendingCount: number; isSyncing: boolean }) => void> = new Set();

  public static onSyncComplete(cb: () => void): () => void {
    this.onSyncCompleteCallbacks.add(cb);
    return () => {
      this.onSyncCompleteCallbacks.delete(cb);
    };
  }

  public static onStatusChange(cb: (status: { pendingCount: number; isSyncing: boolean }) => void): () => void {
    this.onStatusChangeCallbacks.add(cb);
    return () => {
      this.onStatusChangeCallbacks.delete(cb);
    };
  }

  public static async sync(): Promise<void> {
    const sim = DevSimulator.getState();

    // Dev Simulators
    if (sim.forceOffline) {
      console.debug("Sync Engine: Forced Offline by Dev Simulator");
      return;
    }

    if (!NetworkMonitor.isOnline()) {
      console.debug("Sync Engine: Network Offline");
      return;
    }

    // Check Mutex Lock
    if (this.isSyncingMutex) {
      console.debug("Sync Engine: Sync already in progress (Mutex locked)");
      return;
    }

    // Health Check
    if (sim.forceServerDown || !(await HealthService.checkHealth())) {
      console.debug("Sync Engine: API Server Unreachable");
      return;
    }

    const items = await SyncQueue.getPending();
    if (items.length === 0) {
      this.notifyStatus(0, false);
      return;
    }

    this.isSyncingMutex = true;
    this.notifyStatus(items.length, true);

    try {
      for (const item of items) {
        // Dev Sim 401
        if (sim.force401) {
          await SyncQueue.updateStatus(item.id, "waiting_retry", "401 Unauthorized (Dev Sim)", true);
          break; // Pause queue on 401
        }

        // State Machine: validating -> uploading
        await SyncQueue.updateStatus(item.id, "validating");
        await SyncQueue.updateStatus(item.id, "uploading");

        let success = false;
        let errorMessage: string | null = null;

        try {
          if (item.action_type.startsWith("delivery")) {
            success = await DeliveryHandler.process(item);
          } else if (item.action_type.startsWith("refuel")) {
            success = await RefuelHandler.process(item);
          } else {
            // Default generic handler
            success = await DeliveryHandler.process(item);
          }
        } catch (err: any) {
          if (err.response?.status === 401) {
            await SyncQueue.updateStatus(item.id, "waiting_retry", "401 Unauthorized", true);
            console.warn("Sync Engine: Token 401 Expiry encountered, pausing queue safely.");
            break; // Pause queue without discarding item
          }
          errorMessage = err.response?.data?.message || err.message || "Network Error";
        }

        if (success) {
          // Transition to synced -> archived -> remove
          await SyncQueue.updateStatus(item.id, "synced");
          await SyncQueue.remove(item.id, item.file_ids || []);
        } else {
          const newRetryCount = item.retry_count + 1;
          if (newRetryCount >= 5) {
            await SyncQueue.updateStatus(item.id, "failed", errorMessage || "Max retries exceeded", true);
          } else {
            await SyncQueue.updateStatus(item.id, "waiting_retry", errorMessage || "Sync failed", true);
          }
        }
      }
    } finally {
      this.isSyncingMutex = false;
      const remaining = await SyncQueue.getPending();
      this.notifyStatus(remaining.length, false);

      // Trigger post-sync refresh callbacks
      if (items.length > 0) {
        this.onSyncCompleteCallbacks.forEach((cb) => cb());
      }
    }
  }

  private static notifyStatus(pendingCount: number, isSyncing: boolean) {
    this.onStatusChangeCallbacks.forEach((cb) => cb({ pendingCount, isSyncing }));
  }
}
