"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, AlertTriangle, X, Info } from "lucide-react";
import { useToast, Toast as ToastType } from "@/store/useToast";

const toastVariants = {
  initial: { opacity: 0, x: 50, y: 0, scale: 0.9 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.15 } }
};

export function ToastContainer() {
  const { toasts, dismiss, toast: triggerToast } = useToast();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (message: string) => {
        if (message === undefined || message === null) return;
        const msgStr = String(message);
        const lowerMsg = msgStr.toLowerCase();
        let type: ToastType["type"] = "info";

        if (
          lowerMsg.includes("success") || 
          lowerMsg.includes("completed") || 
          lowerMsg.includes("approved") || 
          lowerMsg.includes("added") ||
          lowerMsg.includes("verified") ||
          lowerMsg.includes("saved") ||
          lowerMsg.includes("registered")
        ) {
          type = "success";
        } else if (
          lowerMsg.includes("fail") || 
          lowerMsg.includes("error") || 
          lowerMsg.includes("invalid") || 
          lowerMsg.includes("mismatch") ||
          lowerMsg.includes("insufficient") ||
          lowerMsg.includes("denied") ||
          lowerMsg.includes("required") ||
          lowerMsg.includes("cannot") ||
          lowerMsg.includes("blocked")
        ) {
          type = "error";
        } else if (
          lowerMsg.includes("warning") || 
          lowerMsg.includes("caution") || 
          lowerMsg.includes("exceeds") ||
          lowerMsg.includes("please") ||
          lowerMsg.includes("verify") ||
          lowerMsg.includes("confirm")
        ) {
          type = "warning";
        }

        triggerToast(msgStr, type);
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [triggerToast]);

  const getIcon = (type: ToastType["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="text-green-500 shrink-0" size={20} />;
      case "error":
        return <XCircle className="text-red-500 shrink-0" size={20} />;
      case "warning":
        return <AlertTriangle className="text-amber-500 shrink-0" size={20} />;
      case "info":
      default:
        return <Info className="text-blue-500 shrink-0" size={20} />;
    }
  };

  const getBorderColor = (type: ToastType["type"]) => {
    switch (type) {
      case "success":
        return "border-green-100 bg-white/95 shadow-green-50/20";
      case "error":
        return "border-red-100 bg-white/95 shadow-red-50/20";
      case "warning":
        return "border-amber-100 bg-white/95 shadow-amber-50/20";
      case "info":
      default:
        return "border-blue-100 bg-white/95 shadow-blue-50/20";
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3 p-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md pointer-events-auto overflow-hidden relative ${getBorderColor(
              toast.type
            )}`}
          >
            {/* Left accent color strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              toast.type === "success" ? "bg-green-500" :
              toast.type === "error" ? "bg-red-500" :
              toast.type === "warning" ? "bg-amber-500" : "bg-blue-500"
            }`} />

            <div className="pl-1.5 flex gap-3 items-start w-full">
              {getIcon(toast.type)}
              <div className="flex-1 text-xs font-semibold text-gray-800 leading-normal font-body">
                {toast.message}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
