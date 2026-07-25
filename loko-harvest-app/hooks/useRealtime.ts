"use client";

import { useEffect, useRef } from "react";

export function useRealtime(eventNames: string | string[], callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    if (process.env.NODE_ENV === 'development') {
      const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      baseUrl = `http://${hostname}:8000/api/v1`;
    }

    // Construct EventSource URL
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/stream`);
    if (token) {
      url.searchParams.set("token", token);
    }

    const eventSource = new EventSource(url.toString());

    const names = Array.isArray(eventNames) ? eventNames : [eventNames];

    names.forEach((name) => {
      eventSource.addEventListener(name, () => {
        if (callbackRef.current) {
          callbackRef.current();
        }
      });
    });

    eventSource.onerror = (err) => {
      // EventSource automatically handles reconnection, log for debugging
      console.debug("SSE EventSource reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [JSON.stringify(eventNames)]);
}
