"use client";

import React from "react";
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function OfflineBanner() {
  const { isOnline, isHealthy, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  if (isOnline && isHealthy && pendingCount === 0 && !isSyncing) {
    return null; // Don't show banner if online, healthy, and no pending queue
  }

  return (
    <div
      className={`px-4 py-2.5 text-xs font-extrabold flex items-center justify-between transition-all duration-300 shadow-md ${
        !isOnline || !isHealthy
          ? "bg-amber-600 text-white"
          : isSyncing
          ? "bg-brand-forest text-white"
          : "bg-brand-yellow text-brand-forest"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={16} className="animate-pulse text-amber-200" />
            <span>Working Offline — All actions are saved locally and will auto-sync when online.</span>
          </>
        ) : !isHealthy ? (
          <>
            <ShieldAlert size={16} className="animate-pulse text-amber-200" />
            <span>API Server Unreachable — Saving submissions to device offline queue.</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={16} className="animate-spin text-brand-yellow" />
            <span>Syncing {pendingCount} offline records with server...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} className="text-brand-forest" />
            <span>{pendingCount} item(s) saved locally pending auto-sync.</span>
          </>
        )}
      </div>

      {pendingCount > 0 && isOnline && isHealthy && !isSyncing && (
        <button
          onClick={triggerSync}
          className="px-3 py-1 bg-brand-forest text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-brand-forest/90 transition-all cursor-pointer border-none shadow-sm flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Sync Now
        </button>
      )}
    </div>
  );
}
