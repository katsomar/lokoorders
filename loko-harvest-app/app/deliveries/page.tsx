"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Truck, 
  Search, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Filter,
  Plus,
  ArrowRight,
  X,
  FileText,
  Phone,
  ShieldCheck,
  AlertCircle,
  Map,
  Loader2,
  Navigation,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Compass,
  Droplet,
  Check
} from "lucide-react";
import api from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UITooltip, InfoTooltip } from "@/components/ui/tooltip";
import dynamic from "next/dynamic";


const AdminTrackingMap = dynamic(() => import("@/components/AdminTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-brand-sage/10 rounded-2xl flex items-center justify-center animate-pulse text-xs text-gray-400">
      Loading Tracking Map...
    </div>
  ),
});
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState<"registry" | "dispatch" | "undone" | "fleet">("registry");
  const [dispatchSubtab, setDispatchSubtab] = useState<"new" | "missed">("new");
  
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  
  // Assign Delivery Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Complete Delivery Modal State
  const [showCompleteModal, setShowCompleteModal] = useState<any>(null); // holds delivery object
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [verificationMode, setVerificationMode] = useState<"signature" | "photo">("signature");
  
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // Canvas Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  // Poll live coordinates and stats for selected delivery in real-time when tracking active
  useEffect(() => {
    let trackingInterval: any;
    if (selectedDelivery && selectedDelivery.status === "in_transit") {
      trackingInterval = setInterval(async () => {
        try {
          const res = await api.get(`/deliveries/${selectedDelivery.id}`);
          if (res.data?.success) {
            setSelectedDelivery(res.data.data);
          }
        } catch (err) {
          console.error("Failed to poll active delivery tracking updates:", err);
        }
      }, 5000); // Poll every 5 seconds for smooth live admin tracking
    }
    return () => clearInterval(trackingInterval);
  }, [selectedDelivery?.id, selectedDelivery?.status]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [deliveriesRes, driversRes, ordersRes, vehiclesRes] = await Promise.all([
        api.get("/deliveries"),
        api.get("/drivers"),
        api.get("/orders", { params: { status: "pending,processing,ready_for_dispatch,undone", per_page: 100 } }),
        api.get("/vehicles")
      ]);
      
      // Eager loading response lists
      setDeliveries(deliveriesRes.data.data || []);
      setDrivers(driversRes.data.data || []);
      // /orders returns paginated Laravel wrapper with data array
      setOrders(ordersRes.data.data?.data || ordersRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logistics delivery records:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtime(["delivery.updated", "order.updated", "driver.updated"], () => {
    fetchData(true);
  });

  // Set up canvas mouse & touch events when signature verification mode is active
  useEffect(() => {
    if (verificationMode === "signature" && showCompleteModal) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Clear canvas on mount
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [verificationMode, showCompleteModal]);

  // Canvas Drawing Handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale touch/mouse coordinate relative to actual canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1b4332"; // Brand Forest

    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if ("touches" in e) {
      e.preventDefault(); // Stop screen scrolling
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId && selectedOrderIds.length === 0) {
      alert("Please select at least one order to assign.");
      return;
    }
    if (!selectedDriverId) {
      alert("Please select a driver.");
      return;
    }

    setIsAssigning(true);
    try {
      const [drvId, vehId] = selectedDriverId.split("_");
      const payload: any = selectedOrderId 
        ? { order_id: selectedOrderId, driver_id: drvId }
        : { order_ids: selectedOrderIds, driver_id: drvId };
      if (vehId) {
        payload.vehicle_id = vehId;
      }

      await api.post("/deliveries/assign", payload);
      alert("Delivery assigned successfully!");
      setShowAssignModal(false);
      setSelectedOrderId("");
      setSelectedOrderIds([]);
      setSelectedDriverId("");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign delivery.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStartTransit = async (deliveryId: string) => {
    if (!window.confirm("Mark this dispatch route as in transit?")) return;
    try {
      await api.post(`/deliveries/${deliveryId}/transit`);
      alert("Delivery status updated to in transit!");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update delivery status.");
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompleteModal) return;
    if (!recipientName) {
      alert("Recipient name is required.");
      return;
    }

    let proofPayload = "";
    if (verificationMode === "signature") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      proofPayload = canvas.toDataURL("image/png");
    } else {
      if (!photoFile) {
        alert("Please select or capture a proof image.");
        return;
      }
      proofPayload = photoFile;
    }

    setIsCompleting(true);

    const submitConfirm = (lat: number | null, lng: number | null) => {
      api.post(`/deliveries/${showCompleteModal.id}/confirm`, {
        recipient_name: recipientName,
        recipient_phone: recipientPhone || null,
        delivered_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        latitude: lat,
        longitude: lng,
        notes: deliveryNotes || "",
        proof_image: verificationMode === "photo" ? proofPayload : null,
        signature: verificationMode === "signature" ? proofPayload : null
      })
      .then(() => {
        alert("Delivery confirmed successfully!");
        setShowCompleteModal(null);
        setRecipientName("");
        setRecipientPhone("");
        setDeliveryNotes("");
        setPhotoFile(null);
        setPhotoFileName("");
        fetchData();
      })
      .catch((err: any) => {
        console.error(err);
        alert(err.response?.data?.message || "Failed to confirm delivery.");
      })
      .finally(() => {
        setIsCompleting(false);
      });
    };

    // Attempt HTML5 Geolocation capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          submitConfirm(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied or unavailable:", error.message);
          submitConfirm(null, null);
        },
        { timeout: 7000 }
      );
    } else {
      submitConfirm(null, null);
    }
  };

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return "N/A";
    return new Date(dateTimeStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  // Safe checks for arrays
  const assignableOrders = Array.isArray(orders) 
    ? orders.filter((o) => o.status === "pending" || o.status === "ready_for_dispatch" || o.status === "processing")
    : [];

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  const newOrders = assignableOrders.filter(o => {
    const reqDate = o.required_delivery_date ? o.required_delivery_date.split(' ')[0] : "";
    return !reqDate || reqDate >= todayStr;
  });

  const missedOrders = assignableOrders.filter(o => {
    const reqDate = o.required_delivery_date ? o.required_delivery_date.split(' ')[0] : "";
    return reqDate && reqDate < todayStr;
  });

  const missedDeliveries = Array.isArray(deliveries)
    ? deliveries.filter(d => {
        const reqDate = d.order?.required_delivery_date ? d.order.required_delivery_date.split(' ')[0] : "";
        return (d.status === "assigned" || d.status === "in_transit") && reqDate && reqDate < todayStr;
      })
    : [];

  const filteredDeliveries = Array.isArray(deliveries)
    ? deliveries.filter(d => {
        const orderRef = (d.order?.order_number || "").toLowerCase();
        const customerName = (d.order?.customer?.name || "").toLowerCase();
        const driverName = (d.driver?.full_name || "").toLowerCase();
        
        const term = searchTerm.toLowerCase();
        const matchesSearch = orderRef.includes(term) || customerName.includes(term) || driverName.includes(term);

        if (statusFilter === "all") return matchesSearch;
        return matchesSearch && d.status === statusFilter;
      })
    : [];

  // Metrics Calculations
  const metrics = {
    pendingAssign: newOrders.length + missedOrders.length + missedDeliveries.length,
    activeShipments: Array.isArray(deliveries) 
      ? deliveries.filter(d => d.status === "assigned" || d.status === "in_transit").length 
      : 0,
    completedToday: Array.isArray(deliveries) 
      ? deliveries.filter(d => d.status === "delivered").length 
      : 0,
  };

  // Helper to parse delivery notes (extract JSON if encoded, fallback to plain text)
  const parseDeliveryNotes = (notesStr: string | null) => {
    if (!notesStr) return { recipient_name: "", recipient_phone: "", notes: "" };
    try {
      const parsed = JSON.parse(notesStr);
      if (parsed && typeof parsed === "object" && "recipient_name" in parsed) {
        return parsed;
      }
    } catch (e) {
      // not JSON
    }
    return { recipient_name: "", recipient_phone: "", notes: notesStr };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 font-body">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-brand-forest font-heading tracking-tight">Logistics & Deliveries</h1>
              <InfoTooltip title="Logistics & Dispatch Operations" text="Fleet route planning, live driver GPS tracking, delivery proof verification (signature/photo), and shift manifests." side="right" />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Track fleet status, allocate dispatch orders, and secure shipping manifests</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <UITooltip content="Assign unallocated customer orders or missed shipments to an active driver and vehicle" side="bottom">
              <Button 
                onClick={() => {
                  setSelectedOrderId("");
                  setSelectedDriverId("");
                  setShowAssignModal(true);
                }}
                className="w-full sm:w-auto justify-center gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-bold rounded-xl text-xs px-4.5 h-10.5 cursor-pointer shadow-sm transition-all duration-200"
              >
                <Plus size={16} />
                <span>Assign Delivery</span>
              </Button>
            </UITooltip>
          </div>
        </div>


        {/* Dashboard Metrics Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-brand-sage/20 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-brand-sage/10 rounded-xl text-brand-forest">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Awaiting Dispatch</p>
              <h3 className="text-2xl font-extrabold text-brand-forest mt-0.5">{metrics.pendingAssign} Orders</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-sage/20 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Truck size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Shipments</p>
              <h3 className="text-2xl font-extrabold text-brand-forest mt-0.5">{metrics.activeShipments} En Route</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-sage/20 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fulfilled Deliveries</p>
              <h3 className="text-2xl font-extrabold text-brand-forest mt-0.5">{metrics.completedToday} Delivered</h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 gap-4 sm:gap-6 whitespace-nowrap">
          <button
            onClick={() => setSelectedTab("registry")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer ${
              selectedTab === "registry" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Registry Log
          </button>
          <button
            onClick={() => setSelectedTab("dispatch")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "dispatch" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Awaiting Dispatch
            {metrics.pendingAssign > 0 && (
              <span className="bg-brand-yellow text-brand-forest px-2 py-0.2 text-[10px] font-black rounded-full">
                {metrics.pendingAssign}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab("undone")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "undone" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Undone Claims
            {Array.isArray(orders) && orders.filter((o: any) => o.status === "undone").length > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.2 text-[10px] font-black rounded-full">
                {orders.filter((o: any) => o.status === "undone").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab("fleet")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer ${
              selectedTab === "fleet" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Fleet Status
          </button>
        </div>

        {/* SEARCH & FILTERS BAR (For registry tab) */}
        {selectedTab === "registry" && (
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-sm border border-brand-sage p-0.5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Search by order, customer or driver..." 
                className="pl-10 border-none focus-visible:ring-0 shadow-none h-10 text-xs font-semibold text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-bold uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        )}

        {/* WORKSPACE CONTENT PANELS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-xs font-bold gap-3.5">
            <Loader2 className="animate-spin text-brand-forest" size={36} />
            Eager loading live logistics ledger records...
          </div>
        ) : (
          <>
            {/* 1. REGISTRY LOG WORKSPACE */}
            {selectedTab === "registry" && (
              filteredDeliveries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/30 p-16 text-center text-gray-500 font-medium text-xs">
                  No active logistics delivery records found matching criteria.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-brand-sage/30 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-brand-sage/10">
                      <TableRow>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Order Ref</TableHead>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Customer & Location</TableHead>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Driver & Vehicle</TableHead>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Dispatched Time</TableHead>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Completed Time</TableHead>
                        <TableHead className="font-extrabold text-brand-forest text-xs py-4">Status</TableHead>
                        <TableHead className="text-right font-extrabold text-brand-forest text-xs py-4">Fulfillment Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries.map((delivery) => (
                        <TableRow key={delivery.id} className="hover:bg-brand-sage/5 border-b border-gray-100 last:border-b-0">
                          <TableCell className="font-extrabold text-brand-forest text-xs">
                            {delivery.order?.order_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-bold text-gray-800 text-xs">{delivery.order?.customer?.name || "N/A"}</div>
                              <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                <MapPin size={11} className="text-brand-sage" />
                                {delivery.order?.customer?.address || "No address"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <User size={12} className="text-brand-forest" />
                                <span className="text-xs font-bold text-gray-700">{delivery.driver?.full_name || "Unassigned"}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                                <Truck size={11} />
                                {delivery.driver?.vehicle
                                  ? `${delivery.driver.vehicle.registration_number} (${delivery.driver.vehicle.make} ${delivery.driver.vehicle.model || ''})`
                                  : "No vehicle allocated"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-400" />
                              {formatDateTime(delivery.dispatched_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-400" />
                              {delivery.status === 'delivered' && delivery.delivered_at 
                                ? formatDateTime(delivery.delivered_at) 
                                : "—"
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 border-none ${
                              delivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              delivery.status === 'in_transit' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {delivery.status === 'assigned' ? 'allocated' : delivery.status === 'delivered' ? 'completed' : delivery.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {delivery.status === "in_transit" && (
                                <Button
                                  onClick={() => setSelectedDelivery(delivery)}
                                  className="h-8 text-[10px] font-black uppercase text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 rounded-xl cursor-pointer"
                                >
                                  Track Driver
                                </Button>
                              )}

                              {delivery.status === "delivered" && (
                                <Button
                                  onClick={() => setSelectedDelivery(delivery)}
                                  className="h-8 text-[10px] font-black uppercase text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer"
                                >
                                  View Path
                                </Button>
                              )}

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedDelivery(delivery)}
                                className="gap-1 text-brand-forest hover:bg-brand-sage/20 rounded-xl px-2.5 h-8 text-xs font-bold cursor-pointer"
                              >
                                Details
                                <ArrowRight size={13} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}

            {/* 2. AWAITING DISPATCH WORKSPACE */}
            {selectedTab === "dispatch" && (
              <div className="space-y-6">
                {/* Awaiting Dispatch Subtabs */}
                <div className="flex gap-6 border-b border-gray-100 pb-2">
                  <button
                    onClick={() => setDispatchSubtab("new")}
                    className={`pb-2 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
                      dispatchSubtab === "new"
                        ? "border-brand-forest text-brand-forest"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    New
                    {newOrders.length > 0 && (
                      <span className="bg-brand-sage/20 text-brand-forest px-2 py-0.5 text-[10px] font-black rounded-full">
                        {newOrders.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setDispatchSubtab("missed")}
                    className={`pb-2 text-xs font-bold transition-all border-b-2 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
                      dispatchSubtab === "missed"
                        ? "border-red-500 text-red-500"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Missed
                    {(missedDeliveries.length + missedOrders.length) > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-black rounded-full animate-pulse">
                        {missedDeliveries.length + missedOrders.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Subtab Content */}
                {(dispatchSubtab === "new" ? newOrders.length : (missedDeliveries.length + missedOrders.length)) === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/30 p-16 text-center text-gray-500 font-medium text-xs">
                    {dispatchSubtab === "new" 
                      ? "No new pending orders awaiting dispatch." 
                      : "No missed delivery deadlines! Outstanding work."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedOrderIds.length > 0 && (
                      <div className="bg-brand-sage/10 border border-brand-sage/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                        <span className="text-xs font-bold text-brand-forest">
                          Selected <strong className="font-extrabold">{selectedOrderIds.length}</strong> orders for bulk driver dispatch assignment
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              const activeOrders = dispatchSubtab === "new" ? newOrders : missedOrders;
                              const allActiveIds = activeOrders.map(o => o.id);
                              const allSelected = allActiveIds.every(id => selectedOrderIds.includes(id));
                              if (allSelected) {
                                setSelectedOrderIds(prev => prev.filter(id => !allActiveIds.includes(id)));
                              } else {
                                setSelectedOrderIds(prev => Array.from(new Set([...prev, ...allActiveIds])));
                              }
                            }}
                            variant="outline"
                            className="h-8.5 rounded-lg text-xs font-bold bg-white"
                          >
                            { (dispatchSubtab === "new" ? newOrders : missedOrders).map(o => o.id).every(id => selectedOrderIds.includes(id)) ? "Deselect All Tab" : "Select All Tab" }
                          </Button>
                          <Button 
                            onClick={() => setSelectedOrderIds([])}
                            variant="outline"
                            className="h-8.5 rounded-lg text-xs font-bold bg-white"
                          >
                            Clear Selection
                          </Button>
                          <Button 
                            onClick={() => {
                              setSelectedOrderId(""); 
                              setSelectedDriverId("");
                              setShowAssignModal(true);
                            }}
                            className="h-8.5 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Assign Selected to Driver
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {dispatchSubtab === "new" ? (
                      newOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-brand-sage/25 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative">
                          {/* Badge Urgency */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds(prev => [...prev, order.id]);
                                  } else {
                                    setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                  }
                                }}
                                className="h-4.5 w-4.5 rounded border-brand-sage text-brand-forest focus:ring-brand-forest cursor-pointer shrink-0"
                              />
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
                                <h4 className="font-extrabold text-brand-forest text-sm mt-0.5">{order.order_number}</h4>
                              </div>
                            </div>
                            <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 border-none ${
                              order.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                              order.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {order.urgency}
                            </Badge>
                          </div>

                          {/* Customer Info */}
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <User size={13} className="text-gray-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-gray-800">{order.customer?.name || "Client"}</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{order.customer?.address || "No address details"}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="text-brand-sage shrink-0" />
                              <span className="font-bold text-gray-600">Delivery Zone: {order.customer?.zone?.name || "N/A"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock size={13} className="text-gray-400 shrink-0" />
                              <span className="font-medium text-gray-500">Required: {new Date(order.required_delivery_date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Footer Assign */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-brand-forest">UGX {parseFloat(order.total_amount).toLocaleString()}</span>
                            <Button 
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setSelectedDriverId("");
                                setShowAssignModal(true);
                              }}
                              className="h-8 text-[10px] font-black uppercase bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none rounded-xl px-3 cursor-pointer shadow-sm"
                            >
                              Dispatch Order
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {/* Unassigned Missed Orders */}
                        {missedOrders.map((order) => (
                          <div key={order.id} className="bg-white rounded-2xl border border-red-200/60 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                            <div className="space-y-4">
                              {/* Badge Urgency */}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox"
                                    checked={selectedOrderIds.includes(order.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedOrderIds(prev => [...prev, order.id]);
                                      } else {
                                        setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                      }
                                    }}
                                    className="h-4.5 w-4.5 rounded border-red-200 text-brand-forest focus:ring-brand-forest cursor-pointer shrink-0"
                                  />
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
                                    <h4 className="font-extrabold text-brand-forest text-sm mt-0.5">{order.order_number}</h4>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <Badge className="text-[9px] font-black uppercase px-2 py-0.5 border-none bg-red-100 text-red-700">
                                    Missed
                                  </Badge>
                                  <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 border-none ${
                                    order.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                    order.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {order.urgency}
                                  </Badge>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                  <User size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-gray-800">{order.customer?.name || "Client"}</p>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{order.customer?.address || "No address details"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin size={13} className="text-brand-sage shrink-0" />
                                  <span className="font-bold text-gray-600">Delivery Zone: {order.customer?.zone?.name || "N/A"}</span>
                                </div>

                                <div className="flex items-center gap-2 text-red-600">
                                  <Clock size={13} className="shrink-0" />
                                  <span className="font-black">Required: {new Date(order.required_delivery_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Footer Assign */}
                            <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between mt-4">
                              <span className="font-mono text-xs font-black text-brand-forest">UGX {parseFloat(order.total_amount).toLocaleString()}</span>
                              <Button 
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setSelectedDriverId("");
                                  setShowAssignModal(true);
                                }}
                                className="h-8 text-[10px] font-black uppercase bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none rounded-xl px-3 cursor-pointer shadow-sm"
                              >
                                Dispatch Order
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Assigned Missed Deliveries */}
                        {missedDeliveries.map((delivery) => (
                          <div key={delivery.id} className="bg-white rounded-2xl border border-red-200/60 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                            <div className="space-y-4">
                              {/* Badge Urgency */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
                                  <h4 className="font-extrabold text-brand-forest text-sm mt-0.5">{delivery.order?.order_number || "N/A"}</h4>
                                </div>
                                <Badge className="text-[9px] font-black uppercase px-2 py-0.5 border-none bg-red-100 text-red-700">
                                  Missed
                                </Badge>
                              </div>

                              {/* Customer Info */}
                              <div className="space-y-3.5 text-xs">
                                <div className="flex items-start gap-2">
                                  <User size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-gray-800">{delivery.order?.customer?.name || "Client"}</p>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{delivery.order?.customer?.address || "No address details"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin size={13} className="text-brand-sage shrink-0" />
                                  <span className="font-bold text-gray-600">Delivery Zone: {delivery.order?.customer?.zone?.name || "N/A"}</span>
                                </div>

                                {/* Assigned Driver & Assigner info */}
                                <div className="bg-red-50/40 border border-red-100/60 p-3 rounded-xl space-y-2 text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-450 text-[10px] uppercase w-24 shrink-0">Assigned Driver:</span>
                                    <span className="font-extrabold text-gray-800">
                                      {delivery.driver?.full_name || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-450 text-[10px] uppercase w-24 shrink-0">Assigned By:</span>
                                    <span className="font-extrabold text-gray-800">
                                      {delivery.assigned_by?.name || "HQ Supervisor"}
                                    </span>
                                  </div>
                                </div>

                                {/* Date Created & Expected Delivery Date */}
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Date Created</span>
                                    <span className="font-semibold text-gray-600 mt-0.5 block text-[11px] font-mono">
                                      {new Date(delivery.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Expected Delivery</span>
                                    <span className="font-black text-red-600 mt-0.5 block text-[11px] font-mono">
                                      {delivery.order?.required_delivery_date ? new Date(delivery.order.required_delivery_date).toLocaleDateString() : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Footer Action to track/view detail */}
                            <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between mt-4">
                              <span className="font-mono text-xs font-black text-brand-forest">UGX {parseFloat(delivery.order?.total_amount || "0").toLocaleString()}</span>
                              <Button 
                                onClick={() => setSelectedDelivery(delivery)}
                                className="h-8 text-[10px] font-black uppercase bg-brand-forest hover:bg-brand-forest/90 text-white border-none rounded-xl px-3.5 cursor-pointer shadow-sm"
                              >
                                Track Delivery
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. UNDONE CLAIMS WORKSPACE */}
            {selectedTab === "undone" && (
              (() => {
                const undoneOrders = Array.isArray(orders) ? orders.filter((o: any) => o.status === "undone") : [];
                if (undoneOrders.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/30 p-16 text-center text-gray-500 font-medium text-xs">
                      No orders with active undone claims awaiting re-dispatch.
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-2xl border border-brand-sage/30 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-red-50/50">
                        <TableRow>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4 pl-6">Order Ref</TableHead>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4">Customer Details</TableHead>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4">Return Location</TableHead>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4">Last Driver</TableHead>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4">Undone Reason</TableHead>
                          <TableHead className="font-extrabold text-red-950 text-xs py-4">Claimed Time</TableHead>
                          <TableHead className="text-right font-extrabold text-red-950 text-xs py-4 pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {undoneOrders.map((order: any) => {
                          const lastUndoneDelivery = order.deliveries
                            ?.filter((d: any) => d.status === "undone")
                            .sort((a: any, b: any) => new Date(b.undone_at).getTime() - new Date(a.undone_at).getTime())[0];

                          return (
                            <TableRow key={order.id} className="hover:bg-red-50/5 border-b border-gray-100 last:border-b-0">
                              <TableCell className="font-extrabold text-brand-forest text-xs pl-6">
                                {order.order_number}
                              </TableCell>
                              <TableCell className="font-bold text-gray-800 text-xs">
                                {order.customer?.name || "N/A"}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-700 text-xs">
                                {lastUndoneDelivery?.return_sales_store?.name 
                                  ? `${lastUndoneDelivery.return_sales_store.name} (${lastUndoneDelivery.return_sales_store.code})`
                                  : "N/A"
                                }
                              </TableCell>
                              <TableCell className="font-bold text-gray-800 text-xs">
                                {lastUndoneDelivery?.driver?.full_name || lastUndoneDelivery?.driver?.name || "N/A"}
                              </TableCell>
                              <TableCell className="font-semibold text-red-700 text-xs">
                                {lastUndoneDelivery?.undone_reason 
                                  ? lastUndoneDelivery.undone_reason.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                  : "N/A"
                                }
                              </TableCell>
                              <TableCell className="text-gray-500 text-xs font-semibold">
                                {lastUndoneDelivery?.undone_at ? formatDateTime(lastUndoneDelivery.undone_at) : "N/A"}
                              </TableCell>
                              <TableCell className="text-right pr-6 py-3">
                                <Button
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setSelectedDriverId("");
                                    setShowAssignModal(true);
                                  }}
                                  className="h-8 px-3 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-lg text-xs"
                                >
                                  Re-dispatch
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()
            )}

            {/* 3. FLEET STATUS WORKSPACE */}
            {selectedTab === "fleet" && (
              drivers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/30 p-16 text-center text-gray-500 font-medium text-xs">
                  No active drivers registered in fleet list. Use the Drivers module to register staff.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {drivers.map((driver) => {
                    // Find corresponding vehicle specs
                    const allocatedVehicle = vehicles.find(v => v.id === driver.vehicle_id);
                    const fuelLevel = allocatedVehicle?.fuel_level ?? 0;
                    const tankCapacity = allocatedVehicle?.fuel_tank_capacity ?? 100;
                    const fuelPercentage = Math.round((fuelLevel / tankCapacity) * 100) || 0;
                    
                    return (
                      <div key={driver.id} className="bg-white rounded-2xl border border-brand-sage/25 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        
                        {/* Driver basic profile */}
                        <div className="flex items-center gap-3.5">
                          {driver.avatar ? (
                            <img 
                              src={driver.avatar} 
                              alt={driver.name} 
                              className="h-10.5 w-10.5 rounded-full object-cover border border-brand-sage/40"
                            />
                          ) : (
                            <div className="h-10.5 w-10.5 rounded-full bg-brand-sage/10 text-brand-forest font-black flex items-center justify-center text-sm uppercase">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-brand-forest text-xs">{driver.name}</h4>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{driver.phone}</span>
                          </div>
                        </div>

                        {/* Allocated Vehicle specs */}
                        <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-xl border border-brand-sage/10 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Fleet Vehicle</span>
                            <Badge className={`font-black text-[9px] px-2 py-0.2 uppercase border-none ${
                              driver.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                              driver.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {driver.status}
                            </Badge>
                          </div>
                          
                          {driver.vehicle_registration !== 'N/A' ? (
                            <div className="space-y-2.5">
                              <div>
                                <p className="font-extrabold text-gray-800 text-xs">{driver.vehicle_make}</p>
                                <p className="font-bold text-brand-sage text-[10px] font-mono mt-0.5">{driver.vehicle_registration}</p>
                              </div>

                              {/* Fuel Metrics details */}
                              <div className="grid grid-cols-3 gap-2.5 text-center pt-2.5 border-t border-gray-100">
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">Fuel Level</p>
                                  <p className="font-bold text-gray-800 mt-0.5 flex items-center justify-center gap-0.5">
                                    <Droplet size={11} className="text-blue-500 shrink-0" />
                                    {fuelLevel} L ({fuelPercentage}%)
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">Tank Size</p>
                                  <p className="font-bold text-gray-700 mt-0.5 font-mono">{tankCapacity} L</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase">Consumption</p>
                                  <p className="font-bold text-gray-700 mt-0.5 font-mono">
                                    {allocatedVehicle?.consumption_per_km || "0.0"} L/km
                                  </p>
                                </div>
                              </div>

                              {/* Fuel Level progress bar */}
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    fuelPercentage < 20 ? 'bg-red-500' : fuelPercentage < 50 ? 'bg-amber-500' : 'bg-green-600'
                                  }`} 
                                  style={{ width: `${Math.min(fuelPercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 italic text-[11px] py-1 text-center font-medium">No vehicle allocated to this driver.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {/* LOGISTICS DETAILS & GATEPASS OVERLAY MODAL */}
        {selectedDelivery && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white print:hidden">
                <div className="flex items-center gap-2.5">
                  <Truck className="text-brand-yellow animate-bounce" size={22} />
                  <div>
                    <h3 className="font-heading font-black text-base text-brand-yellow">Fulfillment & Dispatch Gatepass</h3>
                    <p className="text-[11px] text-brand-sage font-medium mt-0.5">Logistics specs & shipping manifest for invoice {selectedDelivery.order?.order_number}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedDelivery(null)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Printable Header */}
              <div className="hidden print:block p-6 text-center border-b border-gray-200">
                <h1 className="text-2xl font-black text-brand-forest tracking-wider uppercase">Loko Harvest Logistics</h1>
                <p className="text-xs text-gray-500">Official Dispatch Manifest & Delivery Gatepass</p>
                <p className="text-[10px] text-gray-400 mt-1">Invoice: {selectedDelivery.order?.order_number} • Issued: {formatDateTime(new Date().toISOString())}</p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:overflow-visible print:max-h-none">
                
                {/* 1. FLEET & DRIVER PROFILE METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-brand-sage/30 text-xs">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Assigned Driver</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                      <User size={12} className="text-brand-mid shrink-0" />
                      {selectedDelivery.driver?.full_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fleet Vehicle</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                      <Truck size={12} className="text-brand-mid shrink-0" />
                      {selectedDelivery.driver?.vehicle
                        ? `${selectedDelivery.driver.vehicle.registration_number} (${selectedDelivery.driver.vehicle.make} ${selectedDelivery.driver.vehicle.model || ''})`
                        : "No vehicle assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Zone</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1 font-mono">
                      <MapPin size={12} className="text-brand-mid shrink-0" />
                      {selectedDelivery.order?.customer?.zone?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Driver Contact</p>
                    <p className="font-bold text-brand-forest mt-0.5 flex items-center gap-1 underline font-mono">
                      <Phone size={11} className="shrink-0" />
                      {selectedDelivery.driver?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                {/* 2. LOGISTICS CARGO MANIFEST */}
                <div>
                  <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText size={13} />
                    Fulfillment Cargo Manifest
                  </h4>
                  <div className="border border-brand-sage/40 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-brand-sage/10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-brand-forest font-extrabold text-[10px] py-2.5">Egg Size & Specification</TableHead>
                          <TableHead className="text-brand-forest font-extrabold text-[10px] py-2.5">Unit</TableHead>
                          <TableHead className="text-right text-brand-forest font-extrabold text-[10px] py-2.5">Quantity Loaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDelivery.order?.items && selectedDelivery.order.items.length > 0 ? (
                          selectedDelivery.order.items.map((item: any, idx: number) => (
                            <TableRow key={idx} className="bg-white border-b border-gray-100 last:border-b-0 hover:bg-transparent">
                              <TableCell className="font-bold text-gray-700 text-xs py-2.5">{item.product?.name || "N/A"}</TableCell>
                              <TableCell className="text-gray-500 font-semibold text-xs py-2.5 capitalize">
                                {item.product?.unit_of_measure || "trays"}
                              </TableCell>
                              <TableCell className="text-right font-extrabold text-brand-forest text-xs py-2.5">
                                {parseFloat(item.quantity).toFixed(0)} units
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-xs text-gray-400">
                              No cargo items found in this order.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 3. SHIPPED CHECKPOINTS TIMELINE TRACKER */}
                <div>
                  <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <Map size={13} />
                    GPS Shipped Checkpoints & Gatepass Log
                  </h4>

                  {/* Real-time Tracking telemetry cards and map */}
                  <div className="mb-6 space-y-4">
                    {/* Live Telemetry stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#132A1C]/5 border border-brand-sage/20 p-3 rounded-xl text-center shadow-sm">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Distance Moved</p>
                        <p className="text-lg font-black text-brand-forest mt-1 font-mono">
                          {selectedDelivery.distance_traveled !== null && selectedDelivery.distance_traveled !== undefined 
                            ? `${parseFloat(selectedDelivery.distance_traveled).toFixed(1)} km` 
                            : "0.0 km"}
                        </p>
                      </div>

                      <div className="bg-[#132A1C]/5 border border-brand-sage/20 p-3 rounded-xl text-center shadow-sm">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Time Taken</p>
                        <p className="text-lg font-black text-brand-forest mt-1 font-mono">
                          {selectedDelivery.duration_seconds 
                            ? formatDuration(selectedDelivery.duration_seconds) 
                            : "00m 00s"}
                        </p>
                      </div>

                      <div className="bg-[#132A1C]/5 border border-brand-sage/20 p-3 rounded-xl text-center shadow-sm">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fuel Used</p>
                        <p className="text-lg font-black text-brand-forest mt-1 font-mono">
                          {selectedDelivery.fuel_consumed !== null && selectedDelivery.fuel_consumed !== undefined 
                            ? `${parseFloat(selectedDelivery.fuel_consumed).toFixed(1)} L` 
                            : "0.0 L"}
                        </p>
                      </div>
                    </div>

                    {/* Leaflet Map for Admin Tracking */}
                    <AdminTrackingMap
                      customerLat={selectedDelivery.order?.customer?.latitude ? Number(selectedDelivery.order.customer.latitude) : 0.3476}
                      customerLng={selectedDelivery.order?.customer?.longitude ? Number(selectedDelivery.order.customer.longitude) : 32.5825}
                      customerName={selectedDelivery.order?.customer?.name || "Customer Destination"}
                      currentLat={selectedDelivery.current_latitude ? Number(selectedDelivery.current_latitude) : null}
                      currentLng={selectedDelivery.current_longitude ? Number(selectedDelivery.current_longitude) : null}
                      locationHistory={selectedDelivery.location_history}
                      status={selectedDelivery.status}
                    />
                  </div>
                  
                  <div className="relative pl-6 space-y-4.5 border-l border-brand-sage/40 ml-3">
                    {/* Checkpoint 1: HQ dispatch */}
                    <div className="relative text-xs">
                      <div className="absolute -left-[30px] top-0.5 h-4.5 w-4.5 rounded-full border-2 bg-green-600 border-green-100 ring-4 ring-green-100 flex items-center justify-center">
                        <ShieldCheck size={10} className="text-white" />
                      </div>
                      <div className="font-bold text-gray-800">HQ Dispatch Center</div>
                      <div className="text-gray-400 font-medium text-[10px] mt-0.5">
                        Cargo loaded and dispatch approved at HQ Depot • {formatDateTime(selectedDelivery.dispatched_at)}
                      </div>
                    </div>

                    {/* Checkpoint 2: Transit Status */}
                    <div className="relative text-xs">
                      <div className={`absolute -left-[30px] top-0.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                        selectedDelivery.status === "in_transit" || selectedDelivery.status === "delivered"
                          ? "bg-green-600 border-green-100 ring-4 ring-green-100"
                          : "bg-gray-200 border-gray-100"
                      }`}>
                        {(selectedDelivery.status === "in_transit" || selectedDelivery.status === "delivered") ? (
                          <Compass size={10} className="text-white animate-spin-slow" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div className="font-bold text-gray-800">Regional Bypass Checkpoint</div>
                      <div className="text-gray-400 font-medium text-[10px] mt-0.5">
                        {selectedDelivery.status === "in_transit" || selectedDelivery.status === "delivered"
                          ? `Passed route transit inspection checkpoint • Status: In Transit`
                          : "Awaiting dispatch route departure"}
                      </div>
                    </div>

                    {/* Checkpoint 3: Destination Receiving */}
                    <div className="relative text-xs">
                      <div className={`absolute -left-[30px] top-0.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                        selectedDelivery.status === "delivered"
                          ? "bg-green-600 border-green-100 ring-4 ring-green-100"
                          : "bg-gray-200 border-gray-100"
                      }`}>
                        {selectedDelivery.status === "delivered" ? (
                          <CheckCircle2 size={10} className="text-white" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div className="font-bold text-gray-800">{selectedDelivery.order?.customer?.name || "Destination Client"}</div>
                      <div className="text-gray-400 font-medium text-[10px] mt-0.5 space-y-1">
                        {selectedDelivery.status === "delivered" ? (
                          <>
                            <p>Successfully delivered and signed off at destination receiving dock • {formatDateTime(selectedDelivery.delivered_at)}</p>
                            
                            {/* Parse JSON recipient details */}
                            {(() => {
                              const noteDetails = parseDeliveryNotes(selectedDelivery.delivery_notes);
                              return (
                                <div className="mt-2 bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-600 space-y-1 max-w-md">
                                  <p className="font-extrabold text-[10px] text-brand-forest">RECIPIENT SPECIFICATIONS:</p>
                                  <p><span className="font-bold">Contact Name:</span> {noteDetails.recipient_name || "N/A"}</p>
                                  {noteDetails.recipient_phone && <p><span className="font-bold">Contact Phone:</span> {noteDetails.recipient_phone}</p>}
                                  {noteDetails.notes && <p><span className="font-bold">Dispatcher Notes:</span> {noteDetails.notes}</p>}
                                </div>
                              );
                            })()}

                            {/* Render Proof Image/Signature if available */}
                            {selectedDelivery.proofs?.[0] && (
                              <div className="mt-2.5">
                                <p className="font-extrabold text-[10px] text-brand-forest uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <ShieldCheck size={12} />
                                  Verification Signoff Proof:
                                </p>
                                <div className="inline-block border border-brand-sage/30 bg-white p-1 rounded-xl shadow-sm">
                                  <img 
                                    src={selectedDelivery.proofs[0].photo_url} 
                                    alt="Signoff verification" 
                                    className="max-h-24 max-w-[280px] object-contain rounded-lg"
                                  />
                                </div>
                                {selectedDelivery.proofs[0].gps_latitude && (
                                  <p className="text-[8px] text-gray-400 font-semibold font-mono mt-1 flex items-center gap-1">
                                    <MapPin size={9} />
                                    GPS Verification coords: {selectedDelivery.proofs[0].gps_latitude}, {selectedDelivery.proofs[0].gps_longitude}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <p>Awaiting client physical delivery checkoff</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer / Action buttons */}
              <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-t border-brand-sage/20 print:hidden">
                <Button 
                  onClick={() => window.print()}
                  variant="outline" 
                  className="h-9.5 px-4 rounded-xl text-xs font-extrabold gap-1.5 border-gray-250 cursor-pointer text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText size={14} />
                  Print Gatepass
                </Button>

                <div className="flex gap-2">
                  <Link href={`/orders`}>
                    <Button 
                      className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5 cursor-pointer"
                    >
                      View Order Ledger
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => setSelectedDelivery(null)}
                    className="h-9.5 px-4 rounded-xl bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold cursor-pointer"
                  >
                    Close Manifest
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ASSIGN DELIVERY MODAL OVERLAY */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Assign Delivery</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Assign an order dispatch route to a driver and vehicle</p>
                </div>
                <Button 
                  onClick={() => setShowAssignModal(false)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAssignDelivery} className="p-6 space-y-5">
                <div className="space-y-4">
                  {/* Select Order */}
                  {selectedOrderId ? (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Selected Order</label>
                      <div className="bg-brand-sage/10 text-brand-forest font-bold text-xs px-3.5 py-2.5 rounded-xl border border-brand-sage/30 flex items-center justify-between">
                        <span>{assignableOrders.find(o => o.id === selectedOrderId)?.order_number || "Selected Order"}</span>
                        <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                          {assignableOrders.find(o => o.id === selectedOrderId)?.customer?.name}
                        </span>
                      </div>
                    </div>
                  ) : selectedOrderIds.length > 0 ? (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Selected Orders ({selectedOrderIds.length})</label>
                      <div className="max-h-36 overflow-y-auto space-y-2 border border-brand-sage/40 rounded-xl p-3 bg-gray-50/50">
                        {assignableOrders.filter(o => selectedOrderIds.includes(o.id)).map(o => (
                          <div key={o.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-brand-sage/20 shadow-sm">
                            <span className="font-extrabold text-brand-forest">{o.order_number}</span>
                            <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">{o.customer?.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Select Pending Order *</label>
                      {assignableOrders.length === 0 ? (
                        <div className="text-xs text-red-500 font-bold py-2.5 bg-red-50/50 border border-red-100 rounded-xl px-3 flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          No pending orders available for dispatch.
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedOrderId}
                          onChange={(e) => setSelectedOrderId(e.target.value)}
                          className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                        >
                          <option value="">-- Choose Order --</option>
                          {assignableOrders.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.order_number} - {o.customer?.name || "Client"}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Select Driver */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Select Active Driver *</label>
                    <select
                      required
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    >
                      <option value="">-- Choose Driver --</option>
                      {drivers.flatMap(d => {
                        const hasVehicles = d.vehicles && d.vehicles.length > 0;
                        if (!hasVehicles) {
                          return [{
                            id: `${d.id}_`,
                            label: `${d.name} (No vehicle)`,
                            disabled: d.status === 'offline' || d.status === 'busy'
                          }];
                        }
                        return d.vehicles.map((v: any) => ({
                          id: `${d.id}_${v.id}`,
                          label: `${d.name} (${v.registration_number} - ${v.make} ${v.model || ''})`,
                          disabled: d.status === 'offline' || d.status === 'busy'
                        }));
                      }).map(opt => (
                        <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/30">
                  <Button 
                    type="button" 
                    onClick={() => setShowAssignModal(false)} 
                    className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-10 px-4 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isAssigning || (!selectedOrderId && selectedOrderIds.length === 0)}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-10 px-4 cursor-pointer flex items-center gap-1.5"
                  >
                    {isAssigning && <Loader2 className="animate-spin" size={13} />}
                    Assign Dispatch
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* COMPLETE / CONFIRM DELIVERY PROOF OVERLAY MODAL */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Confirm Delivery signoff</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Invoice: {showCompleteModal.order?.order_number} • Customer: {showCompleteModal.order?.customer?.name}</p>
                </div>
                <Button 
                  onClick={() => setShowCompleteModal(null)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCompleteDelivery} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                
                {/* Geolocation info disclaimer */}
                <div className="bg-green-50 border border-green-200/50 p-3 rounded-xl flex items-start gap-2.5 text-green-800 text-[11px] font-medium leading-relaxed">
                  <Compass size={18} className="text-green-600 shrink-0 mt-0.5 animate-spin-slow" />
                  <p>
                    <strong>GPS Coordinates Tracking:</strong> When you click confirm, the portal will capture your browser's current latitude and longitude values to certify physical site arrival.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Recipient Name */}
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Recipient Full Name *</label>
                    <Input 
                      required
                      placeholder="e.g. John Mugisha (Manager)"
                      className="h-9.5 text-xs font-semibold rounded-xl border border-brand-sage/50"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>

                  {/* Recipient Phone */}
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Recipient Contact Phone</label>
                    <Input 
                      placeholder="e.g. +256772000111"
                      className="h-9.5 text-xs font-semibold rounded-xl border border-brand-sage/50"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Fulfillment Delivery Notes</label>
                  <textarea 
                    placeholder="Provide any recipient remarks, stock count verification anomalies, or returns details..."
                    className="w-full min-h-[60px] p-2.5 text-xs font-semibold rounded-xl border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>

                {/* Verification Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Verification Proof Mode</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVerificationMode("signature")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        verificationMode === "signature"
                          ? "bg-brand-forest/5 text-brand-forest border-brand-forest"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Plus size={14} className="rotate-45" /> {/* Signature pencil alternative icon */}
                      Digital Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerificationMode("photo")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        verificationMode === "photo"
                          ? "bg-brand-forest/5 text-brand-forest border-brand-forest"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Truck size={14} />
                      Upload Photo Proof
                    </button>
                  </div>
                </div>

                {/* Verification Input details */}
                {verificationMode === "signature" ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Draw Recipient Signature *</label>
                      <button 
                        type="button"
                        onClick={clearSignature}
                        className="text-[10px] text-red-600 hover:text-red-700 font-bold bg-transparent border-none cursor-pointer"
                      >
                        Clear Signature
                      </button>
                    </div>
                    <div className="border border-brand-sage/40 rounded-xl overflow-hidden shadow-inner bg-white">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[140px] cursor-crosshair block"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 italic">Sign inside the white grid above using your mouse cursor or touchscreen.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Choose Recipient Delivery Photo Proof *</label>
                    <div className="border-2 border-dashed border-brand-sage/40 rounded-xl p-5 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-2">
                        <div className="mx-auto h-9 w-9 bg-brand-sage/10 rounded-full flex items-center justify-center text-brand-forest">
                          <Truck size={18} />
                        </div>
                        <p className="text-xs text-gray-600 font-bold">{photoFileName || "Click to browse photo files"}</p>
                        <p className="text-[10px] text-gray-400">Accepts PNG, JPG, or JPEG images (Max: 5MB)</p>
                      </div>
                    </div>
                    {photoFile && (
                      <div className="mt-2.5 text-center">
                        <img 
                          src={photoFile} 
                          alt="Proof preview" 
                          className="max-h-24 mx-auto object-contain rounded-lg border border-brand-sage/20 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submit buttons */}
                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-brand-sage/30">
                  <Button 
                    type="button" 
                    onClick={() => setShowCompleteModal(null)}
                    className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-10 px-4 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCompleting}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-10 px-4.5 cursor-pointer flex items-center gap-1.5"
                  >
                    {isCompleting && <Loader2 className="animate-spin" size={13} />}
                    Verify & Complete Delivery
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
