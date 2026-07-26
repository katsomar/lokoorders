"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldCheck, X } from "lucide-react";
import { subscribeUserToPush } from "@/lib/pushNotifications";

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Show prompt if permission is default (not granted yet and not explicitly denied)
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem("push_banner_dismissed");
      if (!dismissed) {
        setVisible(true);
      }
    }
  }, []);

  const handleEnable = async () => {
    setSubmitting(true);
    const success = await subscribeUserToPush();
    setSubmitting(false);
    if (success) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push_banner_dismissed", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-brand-forest to-emerald-900 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md z-30"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-brand-yellow/20 text-brand-yellow shrink-0">
              <Bell size={16} />
            </div>
            <p className="font-medium">
              Enable <span className="font-bold text-brand-yellow">Web Push Notifications</span> to stay updated on stock transfers, approvals, and order status even when the app is closed.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleEnable}
              disabled={submitting}
              className="bg-brand-yellow text-brand-forest font-bold px-3 py-1.2 rounded-lg hover:bg-white transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? "Enabling..." : "Enable Push"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
