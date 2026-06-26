"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ClipboardList, 
  Warehouse, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LogOut,
  Bell,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  X,
  Lock,
  User,
  Package,
  AlertTriangle,
  FileText,
  Search,
  Check,
  Edit2,
  RefreshCw,
  Eye,
  Loader2,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import api from "@/lib/api";

export default function OrderManagerDashboard() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "alerts">("orders");
  const [orderFilter, setOrderFilter] = useState<"pending" | "processing" | "ready_for_dispatch" | "dispatched" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Inventory tab states
  const [storeType, setStoreType] = useState<"production" | "sales">("sales");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storesList, setStoresList] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");

  // Edit Order modal state
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, number>>({});
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Status notes modal state
  const [statusChangeData, setStatusChangeData] = useState<{
    orderId: string;
    orderNumber: string;
    nextStatus: string;
    notes: string;
    adminOverrideReason: string;
    isOpen: boolean;
  }>({
    orderId: "",
    orderNumber: "",
    nextStatus: "",
    notes: "",
    adminOverrideReason: "",
    isOpen: false
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    ready: 0,
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders", { params: { per_page: 100 } });
      const list = res.data?.data?.data || res.data?.data || [];
      setOrders(list);

      // Compute simple stats
      const pendingCount = list.filter((o: any) => o.status === "pending").length;
      const processingCount = list.filter((o: any) => o.status === "processing").length;
      const readyCount = list.filter((o: any) => o.status === "ready_for_dispatch").length;
      setStats({
        pending: pendingCount,
        processing: processingCount,
        ready: readyCount
      });
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Stores depending on storeType
  useEffect(() => {
    async function loadStores() {
      try {
        const endpoint = storeType === "production" ? "/production-stores" : "/sales-stores";
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setStoresList(list);
        if (list.length > 0) {
          setSelectedStoreId(list[0].id);
        } else {
          setSelectedStoreId("");
          setStockItems([]);
        }
      } catch (err) {
        console.error("Failed to load stores:", err);
      }
    }
    if (activeTab === "inventory") {
      setSelectedBatch("all");
      loadStores();
    }
  }, [storeType, activeTab]);

  // Fetch Stock when selectedStoreId changes
  useEffect(() => {
    async function loadStock() {
      if (!selectedStoreId) return;
      setLoadingStock(true);
      try {
        const endpoint = storeType === "production" ? "/production-stock" : "/sales-stock";
        const params = storeType === "production" 
          ? { production_store_id: selectedStoreId } 
          : { sales_store_id: selectedStoreId };
        const res = await api.get(endpoint, { params });
        setStockItems(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load stock:", err);
      } finally {
        setLoadingStock(false);
      }
    }
    if (activeTab === "inventory" && selectedStoreId) {
      setSelectedBatch("all");
      loadStock();
    }
  }, [selectedStoreId, storeType, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setIsSubmittingPassword(true);
    setPasswordError(null);
    try {
      const response = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmNewPassword,
      });
      if (response.data.success) {
        alert("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Open Edit quantities modal
  const openEditModal = (order: any) => {
    setEditingOrder(order);
    const itemQuantities: Record<string, number> = {};
    order.items.forEach((item: any) => {
      itemQuantities[item.id] = parseFloat(item.quantity);
    });
    setEditedItems(itemQuantities);
  };

  // Submit Quantity Adjustments
  const handleSaveAdjustments = async () => {
    if (!editingOrder) return;
    setIsUpdatingOrder(true);
    try {
      const adjustedItems = editingOrder.items.map((item: any) => ({
        product_id: item.product_id,
        batch_reference: item.batch_reference,
        unit_price: parseFloat(item.unit_price),
        quantity: editedItems[item.id] || 0
      }));

      await api.put(`/orders/${editingOrder.id}`, {
        customer_id: editingOrder.customer_id,
        sales_store_id: editingOrder.sales_store_id,
        order_date: editingOrder.order_date,
        required_delivery_date: editingOrder.required_delivery_date,
        urgency: editingOrder.urgency,
        order_notes: editingOrder.order_notes,
        items: adjustedItems
      });

      alert("Order items adjusted successfully!");
      setEditingOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to adjust order quantities.");
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Trigger Status Transition Modal
  const triggerStatusTransition = (order: any, nextStatus: string) => {
    setStatusChangeData({
      orderId: order.id,
      orderNumber: order.order_number,
      nextStatus,
      notes: "",
      adminOverrideReason: "",
      isOpen: true
    });
  };

  // Submit status update
  const executeStatusTransition = async () => {
    setIsTransitioning(true);
    try {
      await api.post(`/orders/${statusChangeData.orderId}/status`, {
        status: statusChangeData.nextStatus,
        notes: statusChangeData.notes,
        admin_override_reason: statusChangeData.adminOverrideReason || null
      });

      alert(`Order status updated to ${statusChangeData.nextStatus.replace(/_/g, ' ')}!`);
      setStatusChangeData(prev => ({ ...prev, isOpen: false }));
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Filters
  const filteredOrders = orders.filter(o => {
    // Status Filter
    if (orderFilter !== "all" && o.status !== orderFilter) return false;

    // Search Query (customer name, parents name, or order number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = o.order_number.toLowerCase().includes(q);
      const custMatch = o.customer?.name.toLowerCase().includes(q) || false;
      const parentMatch = o.customer?.parent?.name.toLowerCase().includes(q) || false;
      return numMatch || custMatch || parentMatch;
    }
    return true;
  });

  const filteredStock = stockItems.filter(item => {
    // 1. Filter by Batch selection dropdown
    if (selectedBatch !== "all" && item.batch_reference !== selectedBatch) {
      return false;
    }

    // 2. Filter by Search Query
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase();
      const nameMatch = item.product?.name?.toLowerCase().includes(q) || false;
      const codeMatch = item.product?.code?.toLowerCase().includes(q) || false;
      const batchMatch = item.batch_reference?.toLowerCase().includes(q) || false;
      return nameMatch || codeMatch || batchMatch;
    }
    return true;
  });

  const uniqueBatches = Array.from(new Set(stockItems.map(item => item.batch_reference).filter(Boolean))) as string[];
  const batchOptions = [
    { label: "All Batch References", value: "all" },
    ...uniqueBatches.map(batch => ({ label: `Batch: ${batch}`, value: batch }))
  ];

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical": return <Badge className="bg-red-700 text-white font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Critical</Badge>;
      case "urgent": return <Badge className="bg-brand-amber text-white font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Urgent</Badge>;
      default: return <Badge className="bg-gray-200 text-gray-700 font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] uppercase">Pending Review</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[9px] uppercase">Processing</Badge>;
      case "ready_for_dispatch": return <Badge className="bg-purple-100 text-purple-700 border-none font-bold text-[9px] uppercase">Ready for Dispatch</Badge>;
      case "dispatched": return <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[9px] uppercase">Dispatched</Badge>;
      case "delivered": return <Badge className="bg-green-600 text-white border-none font-bold text-[9px] uppercase">Delivered</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-500 border-none font-bold text-[9px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col font-body pb-24 text-gray-800">
      
      {/* 🟢 TOP STICKY PREMIUM BRAND HEADER */}
      <header className="bg-brand-forest text-white p-6 rounded-b-[2.5rem] shadow-xl sticky top-0 z-30 overflow-hidden shrink-0">
        
        {/* Subtle Background Glow Details */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-brand-sage/10 blur-xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow font-black text-xl font-heading shadow-inner overflow-hidden uppercase">
              {user?.name ? user.name.charAt(0) : "O"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">Order Manager</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-black font-heading leading-tight">{user ? user.name : "Manager"}</h2>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button 
              onClick={() => {
                setPasswordError(null);
                setShowPasswordModal(true);
              }} 
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow hover:text-brand-yellow/80 hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              title="Change Password"
            >
              <Lock size={16} />
            </button>
            <button 
              onClick={handleLogout} 
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-red-300 hover:text-red-400 hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              title="Logout Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* 📊 ORDER PROCESSING SUMMARY CARD */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 shadow-lg relative z-10 text-xs">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Award className="text-brand-yellow" size={15} />
              <span className="font-extrabold text-white">Daily Order Processing</span>
            </div>
            <span className="font-mono font-bold text-brand-yellow">Active Status Pipeline</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Pending</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.pending).padStart(2, '0')}</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Processing</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.processing).padStart(2, '0')}</p>
            </div>
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Ready</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.ready).padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 TAB SWITCHER VIEW CONTAINER */}
      <main className="flex-1 p-6 -mt-4 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ORDERS PANEL */}
          {activeTab === "orders" && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList size={16} className="text-brand-mid" />
                    Orders Pipeline
                  </h3>
                  <button 
                    onClick={fetchOrders}
                    className="p-1.5 rounded-lg bg-brand-sage/10 text-brand-forest hover:bg-brand-sage/20 border border-brand-sage/20"
                    title="Refresh List"
                  >
                    <RefreshCw size={12} className={loadingOrders ? "animate-spin" : ""} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Order # or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-9 rounded-xl border border-brand-sage/60 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  />
                </div>

                {/* Sub-tabs Filters */}
                <div className="flex flex-wrap bg-brand-sage/10 p-1 rounded-xl border border-brand-sage/20 gap-0.5">
                  {(["pending", "processing", "ready_for_dispatch", "dispatched", "all"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setOrderFilter(tab)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all text-center ${
                        orderFilter === tab 
                          ? "bg-brand-forest text-white shadow-sm" 
                          : "text-brand-forest hover:bg-brand-sage/20"
                      }`}
                    >
                      {tab.replace(/_for_dispatch/g, "").replace("ready", "ready")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Cards */}
              <div className="space-y-4">
                {loadingOrders ? (
                  <div className="bg-white border border-brand-sage/40 rounded-2xl p-6 text-center text-gray-400 animate-pulse flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-brand-forest" size={24} />
                    <p className="text-xs font-bold text-gray-500">Loading orders data...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white border border-brand-sage/30 rounded-2xl p-6 text-center text-gray-500 text-xs italic">
                    No matching orders in pipeline
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-brand-sage/40 rounded-2xl shadow-sm overflow-hidden p-4 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-brand-forest">{order.order_number}</span>
                            {getUrgencyBadge(order.urgency)}
                          </div>
                          <p className="text-xs font-bold text-gray-900 mt-1">{order.customer?.name}</p>
                          {order.customer?.parent && (
                            <p className="text-[10px] text-gray-400 font-semibold italic">Headquarter: {order.customer.parent.name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-xs font-black font-heading text-brand-forest mt-1.5">UGX {parseFloat(order.total_amount).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="bg-[#F8FAF9] p-3 rounded-xl border border-brand-sage/20 space-y-1.5">
                        <p className="text-[9px] font-black text-brand-forest uppercase tracking-wider border-b border-brand-sage/20 pb-1">Items Summary</p>
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700">{item.product?.name}</span>
                            <span className="font-mono font-bold text-brand-forest">x{parseFloat(item.quantity)} {item.product?.unit_of_measure}</span>
                          </div>
                        ))}
                      </div>

                      {order.order_notes && (
                        <div className="text-[10px] text-gray-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          <strong>Notes:</strong> {order.order_notes}
                        </div>
                      )}

                      {/* Action Buttons depending on status */}
                      <div className="flex gap-2.5 pt-1">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => triggerStatusTransition(order, "processing")}
                              className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            >
                              <Check size={14} />
                              Process Order
                            </button>
                            <button
                              onClick={() => openEditModal(order)}
                              className="h-9 px-3.5 bg-amber-50 hover:bg-amber-100 text-brand-amber border border-brand-amber/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                              title="Adjust Order quantities"
                            >
                              <Edit2 size={14} />
                              Adjust
                            </button>
                          </>
                        )}

                        {order.status === "processing" && (
                          <button
                            onClick={() => triggerStatusTransition(order, "ready_for_dispatch")}
                            className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            <CheckCircle2 size={14} />
                            Ready for Dispatch
                          </button>
                        )}

                        {order.status === "ready_for_dispatch" && (
                          <button
                            onClick={() => triggerStatusTransition(order, "dispatched")}
                            className="flex-1 h-9 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            <Truck size={14} />
                            Set Off (Dispatched)
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: INVENTORY PANEL */}
          {activeTab === "inventory" && (
            <motion.div
              key="inventory-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse size={16} className="text-brand-mid" />
                  Warehouse Inventory
                </h3>

                {/* Sub-tabs for Store Type selection */}
                <div className="flex bg-brand-sage/10 p-1 rounded-xl border border-brand-sage/20">
                  <button 
                    onClick={() => setStoreType("sales")}
                    className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                      storeType === "sales" 
                        ? "bg-brand-forest text-white shadow-sm" 
                        : "text-brand-forest hover:bg-brand-sage/20"
                    }`}
                  >
                    Sales Store
                  </button>
                  <button 
                    onClick={() => setStoreType("production")}
                    className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                      storeType === "production" 
                        ? "bg-brand-forest text-white shadow-sm" 
                        : "text-brand-forest hover:bg-brand-sage/20"
                    }`}
                  >
                    Production Store
                  </button>
                </div>

                {/* Store Dropdown selector */}
                <Select
                  label="Select Location Store"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  options={storesList.map(s => ({ label: `${s.name} (${s.code})`, value: s.id }))}
                  required
                />

                {/* Batch Dropdown selector */}
                {uniqueBatches.length > 0 && (
                  <Select
                    label="Filter by Batch Number"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    options={batchOptions}
                  />
                )}

                {/* Stock Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-9 rounded-xl border border-brand-sage/60 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  />
                </div>
              </div>

              {/* Stock Items list */}
              <div className="space-y-2">
                {loadingStock ? (
                  <div className="bg-white border border-brand-sage/40 rounded-2xl p-6 text-center text-gray-400 animate-pulse flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-brand-forest" size={24} />
                    <p className="text-xs font-bold text-gray-500">Loading stock listing...</p>
                  </div>
                ) : filteredStock.length === 0 ? (
                  <div className="bg-white border border-brand-sage/30 rounded-2xl p-6 text-center text-gray-500 text-xs italic">
                    No inventory records found
                  </div>
                ) : (
                  filteredStock.map((item) => (
                    <div key={item.id} className="bg-white border border-brand-sage/30 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-900">{item.product?.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase">
                          <span>{item.product?.code}</span>
                          {item.batch_reference && (
                            <>
                              <span className="h-1 w-1 bg-gray-300 rounded-full" />
                              <span className="text-brand-amber font-mono">Batch: {item.batch_reference}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black font-heading ${
                          parseFloat(item.current_quantity) <= 0 
                            ? "text-red-600" 
                            : parseFloat(item.current_quantity) <= 20 
                            ? "text-brand-amber" 
                            : "text-brand-forest"
                        }`}>
                          {parseFloat(item.current_quantity).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase ml-1 block">{item.product?.unit_of_measure}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: ALERTS PANEL */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={16} className="text-brand-mid" />
                Operational Alerts
              </h3>

              <div className="space-y-3">
                {/* Mock Alerts / Notifications */}
                <div className="p-4 rounded-xl bg-amber-50 border border-brand-yellow/30 flex gap-3 text-xs">
                  <AlertTriangle className="text-brand-amber shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Low Stock Warning</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">Sales Store stock level for **White Plain Trays** is currently low (under 50 trays). Please request store transfers.</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">10 mins ago</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-50 border border-green-200/50 flex gap-3 text-xs">
                  <Sparkles className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Fulfillment Target Achieved</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">Today's composite fulfillment rating is running at **98.4%**. Great job keeping orders prepared and dispatched on time!</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">2 hours ago</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/50 flex gap-3 text-xs">
                  <Clock className="text-blue-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Pending Orders Waiting</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">There are currently new pending orders placed by system administrators that require your review and preparation status transition.</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">3 hours ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 📱 ADJUST QUANTITIES MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage/40 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black font-heading text-sm text-brand-yellow">Adjust Order Quantities</h3>
                <p className="text-[10px] text-brand-sage font-semibold uppercase mt-0.5">Order: {editingOrder.order_number}</p>
              </div>
              <button 
                onClick={() => setEditingOrder(null)} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Modify order quantities to match actual physical warehouse availability before starting prep.</p>
              
              <div className="space-y-3.5">
                {editingOrder.items.map((item: any) => (
                  <div key={item.id} className="p-3 bg-[#F8FAF9] rounded-xl border border-brand-sage/20 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{item.product?.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">Max: {parseFloat(item.quantity)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Quantity"
                        value={editedItems[item.id] ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEditedItems(prev => ({
                            ...prev,
                            [item.id]: isNaN(val) ? 0 : val
                          }));
                        }}
                        className="h-8 text-xs font-bold text-brand-forest"
                        required
                      />
                      <span className="text-xs text-gray-500 font-extrabold uppercase">{item.product?.unit_of_measure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-brand-sage/20 flex gap-2.5">
              <Button
                onClick={() => setEditingOrder(null)}
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs font-bold border-brand-sage/60"
                disabled={isUpdatingOrder}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAdjustments}
                className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs cursor-pointer"
                isLoading={isUpdatingOrder}
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 📱 STATUS TRANSITION NOTES MODAL */}
      {statusChangeData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage/40 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black font-heading text-sm text-brand-yellow">Confirm Status Change</h3>
                <p className="text-[10px] text-brand-sage font-semibold uppercase mt-0.5">Order: {statusChangeData.orderNumber}</p>
              </div>
              <button 
                onClick={() => setStatusChangeData(prev => ({ ...prev, isOpen: false }))} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs">
                <span className="font-bold text-gray-500">Transitioning to:</span>
                <span className="ml-1.5 font-black uppercase text-brand-forest">{statusChangeData.nextStatus.replace(/_/g, ' ')}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Status Change Notes / Memo</label>
                <textarea
                  placeholder="e.g. Stock verified, ready for dispatch packing, set off UBL 482Y..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest focus:border-brand-forest bg-white text-gray-800 resize-none"
                  value={statusChangeData.notes}
                  onChange={(e) => setStatusChangeData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {statusChangeData.nextStatus === "processing" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="text-brand-amber" size={14} />
                    <label className="text-xs font-bold text-brand-forest block">Admin Override Reason (Optional)</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter reason if force overriding stock check..."
                    className="w-full text-xs px-3 py-2 h-9 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest focus:border-brand-forest bg-white text-gray-800"
                    value={statusChangeData.adminOverrideReason}
                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, adminOverrideReason: e.target.value }))}
                  />
                  <p className="text-[9px] text-gray-400 leading-normal font-medium">Providing an admin override reason allows force-processing orders even if the store has insufficient stock.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-brand-sage/20 flex gap-2.5">
              <Button
                onClick={() => setStatusChangeData(prev => ({ ...prev, isOpen: false }))}
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs font-bold border-brand-sage/60"
                disabled={isTransitioning}
              >
                Cancel
              </Button>
              <Button
                onClick={executeStatusTransition}
                className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs cursor-pointer"
                isLoading={isTransitioning}
              >
                Confirm Status
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 📱 CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <h3 className="font-black font-heading text-sm text-brand-yellow">Security credentials</h3>
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                  ⚠️ {passwordError}
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <div className="pt-2 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                  className="font-bold text-xs h-9 rounded-xl"
                  disabled={isSubmittingPassword}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="font-bold text-xs h-9 bg-brand-forest text-white rounded-xl"
                  isLoading={isSubmittingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 📱 SAFE MOBILE BOTTOM INTERACTIVE NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-sage/60 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
        
        {/* TAB 1: ORDERS BUTTON */}
        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "orders" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <ClipboardList size={20} className={activeTab === "orders" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Orders</span>
          {activeTab === "orders" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 2: INVENTORY BUTTON */}
        <button 
          onClick={() => setActiveTab("inventory")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "inventory" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Warehouse size={20} className={activeTab === "inventory" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Inventory</span>
          {activeTab === "inventory" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 3: ALERTS BUTTON */}
        <button 
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "alerts" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <div className="relative">
            <Bell size={20} className={activeTab === "alerts" ? "scale-110 text-brand-forest" : "text-gray-400"} />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-yellow rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="text-[9px] uppercase tracking-wider">Alerts</span>
          {activeTab === "alerts" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-gray-400 hover:text-red-500 transition-all font-semibold"
        >
          <LogOut size={20} />
          <span className="text-[9px] uppercase tracking-wider">Logout</span>
        </button>

      </nav>
    </div>
  );
}
