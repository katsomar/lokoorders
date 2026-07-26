"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, ExternalLink, X, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import { IntensityGraphic } from "./IntensityGraphics";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  priority: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  data?: {
    route_data?: {
      path?: string;
      id?: string;
    };
  };
  route_data?: {
    path?: string;
    id?: string;
  };
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      const list = res.data?.data?.data || res.data?.data || [];
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Sync with real-time SSE stream updates
  useRealtime(["notification", "store_transfer", "store_adjustment"], () => {
    fetchNotifications();
  });

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    const path = item.data?.route_data?.path || item.route_data?.path;
    if (path) {
      router.push(path);
      setIsOpen(false);
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-brand-yellow transition-colors focus:outline-none rounded-lg hover:bg-white/5"
        aria-label="Open notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-black text-brand-forest shadow-md"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Popover Drawer */}
      <AnimatePresence>
        {isOpen && (
          <React.Fragment>
            <div className="sm:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800"
            >
            {/* Header */}
            <div className="p-4 bg-brand-forest text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight font-heading">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-brand-yellow/20 text-brand-yellow text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-yellow/90 hover:text-white flex items-center gap-1 font-medium transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filter === "all"
                    ? "bg-brand-forest text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filter === "unread"
                    ? "bg-brand-forest text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List Body */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
              {displayedNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No notifications to show.
                </div>
              ) : (
                displayedNotifications.map((item) => {
                  const targetPath = item.data?.route_data?.path || item.route_data?.path;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-4 transition-colors flex gap-3 cursor-pointer group ${
                        item.is_read ? "bg-white hover:bg-gray-50/80" : "bg-brand-yellow/5 hover:bg-brand-yellow/10"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <IntensityGraphic priority={item.priority || "medium"} size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-bold truncate ${item.is_read ? "text-gray-800" : "text-brand-forest font-black"}`}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {item.body}
                        </p>

                        {targetPath && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-forest mt-2 group-hover:underline">
                            View details <ExternalLink size={12} />
                          </span>
                        )}
                      </div>

                      {!item.is_read && (
                        <button
                          onClick={(e) => markAsRead(item.id, e)}
                          className="shrink-0 text-gray-300 hover:text-emerald-600 transition-colors p-1"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
