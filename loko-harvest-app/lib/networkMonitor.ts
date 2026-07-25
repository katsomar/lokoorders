"use client";

type Listener = (online: boolean) => void;

export class NetworkMonitor {
  private static listeners: Set<Listener> = new Set();
  private static initialized: boolean = false;

  public static init() {
    if (typeof window === "undefined" || this.initialized) return;

    window.addEventListener("online", () => this.notify(true));
    window.addEventListener("offline", () => this.notify(false));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.notify(navigator.onLine);
      }
    });

    this.initialized = true;
  }

  public static subscribe(listener: Listener): () => void {
    this.init();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public static isOnline(): boolean {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  }

  private static notify(online: boolean) {
    this.listeners.forEach((fn) => fn(online));
  }
}
