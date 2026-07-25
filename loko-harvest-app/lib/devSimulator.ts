"use client";

export interface DevSimState {
  forceOffline: boolean;
  forceServerDown: boolean;
  force401: boolean;
  forceSlowNetwork: boolean;
}

const STORAGE_KEY = "loko_dev_sim_state";

export class DevSimulator {
  private static state: DevSimState = {
    forceOffline: false,
    forceServerDown: false,
    force401: false,
    forceSlowNetwork: false,
  };

  public static getState(): DevSimState {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch (e) {}
      }
    }
    return this.state;
  }

  public static setState(newState: Partial<DevSimState>): DevSimState {
    this.state = { ...this.getState(), ...newState };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
    return this.state;
  }
}
