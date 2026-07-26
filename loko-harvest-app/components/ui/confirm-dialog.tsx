"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, HelpCircle, Info, Loader2, X } from "lucide-react";
import { Button } from "./button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const iconMap = {
    danger: <AlertTriangle className="text-red-400" size={24} />,
    warning: <AlertTriangle className="text-brand-yellow" size={24} />,
    info: <Info className="text-brand-yellow" size={24} />,
  };

  const buttonStyleMap = {
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30",
    warning: "bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest font-bold shadow-lg shadow-brand-yellow/20",
    info: "bg-brand-forest hover:bg-brand-forest/90 text-white shadow-lg shadow-brand-forest/20",
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-brand-forest/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-brand-forest/90 border border-brand-sage/20 rounded-2xl p-6 shadow-2xl overflow-hidden z-10 text-white"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors hover:bg-white/10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex-shrink-0">
                {iconMap[variant]}
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">{title}</h3>
                <p className="text-sm text-gray-300 font-body mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="border-brand-sage/30 text-gray-200 hover:bg-white/10 hover:text-white"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={buttonStyleMap[variant]}
              >
                {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
