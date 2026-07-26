"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

interface IntensityGraphicProps {
  priority?: "urgent" | "high" | "medium" | "low" | string;
  size?: number;
}

export function IntensityGraphic({ priority = "medium", size = 20 }: IntensityGraphicProps) {
  if (priority === "urgent" || priority === "high") {
    return (
      <div className="relative flex items-center justify-center">
        {/* Animated Radar Wave 1 */}
        <motion.span
          animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-red-500/40"
        />
        {/* Animated Radar Wave 2 */}
        <motion.span
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          className="absolute inset-0 rounded-full bg-red-500/30"
        />
        {/* Center Icon Wrapper */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center p-2 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30"
        >
          <ShieldAlert size={size} />
        </motion.div>
      </div>
    );
  }

  if (priority === "medium") {
    return (
      <div className="relative flex items-center justify-center">
        {/* Ambient Breathing Ripple */}
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-amber-400/30"
        />
        {/* Center Icon Wrapper */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="relative z-10 flex items-center justify-center p-2 rounded-full bg-amber-500 text-white shadow-md shadow-amber-500/20"
        >
          <Bell size={size} />
        </motion.div>
      </div>
    );
  }

  // Normal / Low priority
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative z-10 flex items-center justify-center p-2 rounded-full bg-emerald-500 text-white shadow-sm"
      >
        <Sparkles size={size} />
      </motion.div>
    </div>
  );
}
