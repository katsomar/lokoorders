"use client";

import api from "./api";

export class HealthService {
  private static isHealthy: boolean = true;
  private static lastCheck: number = 0;

  public static async checkHealth(): Promise<boolean> {
    const now = Date.now();
    // Cache health result for 5 seconds to prevent spamming
    if (now - this.lastCheck < 5000) {
      return this.isHealthy;
    }

    try {
      const res = await api.get("/health", { timeout: 4000 });
      this.isHealthy = res.status === 200 && res.data?.success === true;
    } catch (err) {
      this.isHealthy = false;
    }

    this.lastCheck = now;
    return this.isHealthy;
  }

  public static getStatus(): boolean {
    return this.isHealthy;
  }
}
