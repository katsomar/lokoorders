"use client";

import { useState, useEffect } from "react";
import { NetworkMonitor } from "@/lib/networkMonitor";
import { HealthService } from "@/lib/healthService";
import { SyncQueue } from "@/lib/syncQueue";
import { SyncEngine } from "@/lib/syncEngine";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(NetworkMonitor.isOnline());

    const unsubNetwork = NetworkMonitor.subscribe(async (online) => {
      setIsOnline(online);
      if (online) {
        const healthy = await HealthService.checkHealth();
        setIsHealthy(healthy);
        if (healthy) {
          SyncEngine.sync();
        }
      }
    });

    const unsubSyncStatus = SyncEngine.onStatusChange((status) => {
      setPendingCount(status.pendingCount);
      setIsSyncing(status.isSyncing);
    });

    // Check initial queue count
    SyncQueue.getPending().then((items) => {
      setPendingCount(items.length);
    });

    // Run initial sync check
    if (NetworkMonitor.isOnline()) {
      HealthService.checkHealth().then((healthy) => {
        setIsHealthy(healthy);
        if (healthy) {
          SyncEngine.sync();
        }
      });
    }

    return () => {
      unsubNetwork();
      unsubSyncStatus();
    };
  }, []);

  const triggerSync = () => {
    SyncEngine.sync();
  };

  return {
    isOnline,
    isHealthy,
    pendingCount,
    isSyncing,
    triggerSync,
  };
}
