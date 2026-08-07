"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Component Crash:", error, errorInfo);
    this.setState({ errorInfo });

    // Handle stale build ChunkLoadError when a new version is deployed to server
    if (
      error?.name === "ChunkLoadError" || 
      (error?.message && (error.message.includes("Loading chunk") || error.message.includes("Failed to fetch dynamically imported module")))
    ) {
      console.warn("Detected stale Next.js deployment chunk. Force reloading browser...");
      window.location.reload();
    }
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/dashboard/admin";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-brand-forest flex items-center justify-center p-6 text-white select-none">
          <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30 text-red-400">
                <ShieldAlert size={36} />
              </div>
              <div>
                <h1 className="text-2xl font-black font-heading tracking-tight">Application Recovered</h1>
                <p className="text-xs text-brand-sage/80 font-body">An unexpected interface exception occurred.</p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6 text-left font-mono text-xs text-red-300 overflow-x-auto max-h-36">
              <p className="font-bold">{this.state.error?.name}: {this.state.error?.message}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[10px] text-gray-400 whitespace-pre-wrap leading-tight">
                  {this.state.errorInfo.componentStack.slice(0, 300)}...
                </pre>
              )}
            </div>

            <p className="text-sm text-gray-300 mb-8 leading-relaxed font-body">
              Don&apos;t worry — your offline synchronization queue and unsaved data stored in IndexedDB remain completely intact.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={this.handleRecover}
                className="w-full sm:w-1/2 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest font-bold py-3 rounded-xl shadow-lg shadow-brand-yellow/20 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reload Application
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full sm:w-1/2 border-white/20 text-white hover:bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Home size={16} />
                Return to HQ
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
