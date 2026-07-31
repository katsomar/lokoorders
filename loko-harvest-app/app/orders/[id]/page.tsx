"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  User, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  Printer,
  MapPin,
  Warehouse,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Camera,
  FileCheck2,
  Smartphone,
  UserCheck,
  Map,
  ExternalLink
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import api from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideErrorMessage, setOverrideErrorMessage] = useState("");
  const [pendingStatusToRetry, setPendingStatusToRetry] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxScale, setLightboxScale] = useState<number>(1);

  const [isEditingFdn, setIsEditingFdn] = useState(false);
  const [fdnValue, setFdnValue] = useState("");
  const [isSavingFdn, setIsSavingFdn] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [showRedispatchModal, setShowRedispatchModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isRedispatching, setIsRedispatching] = useState(false);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const res = await api.get("/drivers");
        if (res.data?.success) {
          setDrivers(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
      }
    }
    fetchDrivers();
  }, []);

  const handleRedispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      alert("Please select a driver.");
      return;
    }

    setIsRedispatching(true);
    try {
      const [drvId, vehId] = selectedDriverId.split("_");
      const payload: any = {
        order_id: orderId,
        driver_id: drvId,
      };
      if (vehId) {
        payload.vehicle_id = vehId;
      }

      await api.post("/deliveries/assign", payload);
      alert("Order re-dispatched successfully!");
      setShowRedispatchModal(false);
      setSelectedDriverId("");
      await fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to re-dispatch order.");
    } finally {
      setIsRedispatching(false);
    }
  };

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.data) {
        setOrder(res.data.data);
        setFdnValue(res.data.data.fiscal_document_number || "");
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFdn = async () => {
    setIsSavingFdn(true);
    try {
      await api.put(`/orders/${orderId}/fdn`, {
        fiscal_document_number: fdnValue || null
      });
      alert("Fiscal Document Number updated successfully!");
      setIsEditingFdn(false);
      await fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update Fiscal Document Number.");
    } finally {
      setIsSavingFdn(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const getUrgencyBadge = (urgency: string) => {
    switch ((urgency || "").toLowerCase()) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Critical</Badge>;
      case "urgent":
        return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Urgent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string, requiredDeliveryDate?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isMissed = (status || "").toLowerCase() !== "delivered" && requiredDeliveryDate && requiredDeliveryDate.split(' ')[0] < todayStr;
    if (isMissed) {
      return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Missed</Badge>;
    }
    switch ((status || "").toLowerCase()) {
      case "pending":
        return <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Processing</Badge>;
      case "ready_for_dispatch":
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Ready</Badge>;
      case "dispatched":
        return <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Dispatched</Badge>;
      case "on_route":
      case "on route":
        return <Badge className="bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">On Route</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Delivered</Badge>;
      case "undone":
        return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Undone Claim</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-lg shrink-0">{status}</Badge>;
    }
  };

  const handleStatusTransition = async () => {
    const nextStatus = getNextStatus(order?.status);
    if (!nextStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.post(`/orders/${orderId}/status`, {
        status: nextStatus,
        notes: `Advanced order stage to ${nextStatus.replace(/_/g, ' ')}`
      });
      await fetchOrderDetails();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "";
      if (err.response?.status === 422 && errMsg.includes("Insufficient stock") && errMsg.includes("override reason required")) {
        setOverrideErrorMessage(errMsg);
        setPendingStatusToRetry(nextStatus);
        setIsOverrideModalOpen(true);
      } else {
        alert(errMsg || "Failed to update order status.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("Please provide a reason for the override.");
      return;
    }

    setIsUpdatingStatus(true);
    setIsOverrideModalOpen(false);
    try {
      await api.post(`/orders/${orderId}/status`, {
        status: pendingStatusToRetry,
        admin_override_reason: overrideReason,
        notes: `Advanced order stage to ${pendingStatusToRetry?.replace(/_/g, ' ')} with admin override. Reason: ${overrideReason}`
      });
      setOverrideReason("");
      setOverrideErrorMessage("");
      setPendingStatusToRetry("");
      await fetchOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status with override.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete order ${order?.order_number}? This will refund store stock and reverse account invoices.`)) {
      return;
    }
    try {
      await api.delete(`/orders/${orderId}`);
      alert("Order deleted successfully!");
      router.push("/orders");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete order.");
    }
  };


  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending": return "processing";
      case "processing": return "ready_for_dispatch";
      case "ready_for_dispatch": return "dispatched";
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending": return "Move to Processing";
      case "processing": return "Mark Ready for Dispatch";
      case "ready_for_dispatch": return "Mark as Dispatched";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Loading order details...
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-red-500 font-bold">
          <AlertCircle size={36} />
          Order not found.
          <Button onClick={() => router.push("/orders")} variant="outline" className="mt-4">
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const nextStatusLabel = getNextStatusLabel(order.status);

  // Compute timeline
  const timelineHistory = order.status_history?.map((h: any) => ({
    status: h.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    user: h.user?.name || "System",
    time: format(new Date(h.created_at || h.changed_at), "dd MMM yyyy, hh:mm a"),
    notes: h.notes
  })) || [];

  const baseTimeline = [
    {
      status: "Order Created",
      user: "Operator",
      time: order.created_at ? format(new Date(order.created_at), "dd MMM yyyy, hh:mm a") : "",
      notes: "Order recorded successfully in system."
    },
    ...timelineHistory
  ];

  const deliveryWithProof = order.deliveries?.find((d: any) => d.proofs && d.proofs.length > 0) || order.deliveries?.[0];
  const proof = deliveryWithProof?.proofs?.[0];

  const parsedNotes = (() => {
    try {
      return deliveryWithProof?.delivery_notes ? JSON.parse(deliveryWithProof.delivery_notes) : null;
    } catch (e) {
      return { notes: deliveryWithProof?.delivery_notes };
    }
  })();

  const formatDeliveredAt = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "EEEE, dd MMMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const formatConfirmedAt = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const returnVouchers = order?.return_vouchers || [];
  const physicalReplacements = returnVouchers.filter((v: any) => v.return_type === 'physical_replacement');
  const totalReplacementValue = physicalReplacements.reduce(
    (sum: number, v: any) => sum + (parseFloat(v.replacement_quantity) * parseFloat(v.unit_price)),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Standardized Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="h-9.5 w-9.5 p-0 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-xl text-brand-forest transition-colors flex items-center justify-center shrink-0 border border-brand-sage/30"
            >
              <ChevronLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-brand-forest font-heading leading-none">{order.order_number}</h1>
                {getStatusBadge(order.status, order.required_delivery_date)}
                {getUrgencyBadge(order.urgency)}
              </div>
              <p className="text-gray-500 font-body text-xs mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Order Placed: <strong className="text-gray-700">{format(new Date(order.order_date), "dd MMMM yyyy")}</strong></span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-500">FDN:</span>
                  {isEditingFdn ? (
                    <span className="flex items-center gap-1">
                      <input 
                        value={fdnValue}
                        onChange={(e) => setFdnValue(e.target.value)}
                        placeholder="Enter FDN..."
                        className="h-6 py-0 px-2 text-xs w-28 bg-white border border-brand-sage focus:outline-none focus:ring-1 focus:ring-brand-forest text-brand-forest font-mono rounded"
                        disabled={isSavingFdn}
                      />
                      <Button 
                        size="sm"
                        onClick={handleSaveFdn}
                        disabled={isSavingFdn}
                        className="h-6 px-2 bg-brand-forest hover:bg-brand-forest/90 text-brand-yellow font-extrabold text-[9px] rounded"
                      >
                        {isSavingFdn ? "..." : "Save"}
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFdnValue(order.fiscal_document_number || "");
                          setIsEditingFdn(false);
                        }}
                        className="h-6 px-1.5 text-gray-500 font-bold text-[9px] rounded hover:bg-gray-150"
                        disabled={isSavingFdn}
                      >
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <strong className="text-gray-800 font-mono text-xs">
                        {order.fiscal_document_number || "Not entered"}
                      </strong>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditingFdn(true)}
                        className="h-5 w-5 p-0 text-brand-forest hover:bg-brand-sage/20 hover:text-brand-forest rounded flex items-center justify-center shrink-0 border border-brand-sage/20"
                      >
                        <Pencil size={9} />
                      </Button>
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm"
            >
              <Printer size={14} />
              Print Order
            </Button>
            {!(order.status === "dispatched" || order.status === "on_route" || order.status === "on route" || order.status === "delivered") && (
              <>
                <Link href={`/orders/${order.id}/edit`}>
                  <Button 
                    variant="outline" 
                    className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm"
                  >
                    <Pencil size={14} />
                    Edit Order
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleDelete}
                  className="h-9.5 px-4 text-xs font-extrabold text-red-600 hover:text-red-700 border-red-200/50 hover:bg-red-50 rounded-xl gap-1.5 shadow-sm bg-white"
                >
                  <Trash2 size={14} />
                  Delete Order
                </Button>
              </>
            )}
            {nextStatus && (
              <Button 
                onClick={handleStatusTransition}
                disabled={isUpdatingStatus}
                className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <>
                    {nextStatusLabel}
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>
            )}
            {order.status === "undone" && (
              <Button 
                onClick={() => {
                  setSelectedDriverId("");
                  setShowRedispatchModal(true);
                }}
                className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5"
              >
                Re-dispatch Order
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Missed Deadline Alert Box */}
        {(() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isMissed = (order.status || "").toLowerCase() !== "delivered" && order.required_delivery_date && order.required_delivery_date.split(' ')[0] < todayStr;
          if (isMissed) {
            return (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-black text-red-950 uppercase tracking-wider">Missed Delivery Deadline Warning</h4>
                  <p className="text-xs text-red-700 font-semibold mt-1">
                    This order was expected for delivery on {format(new Date(order.required_delivery_date), "EEEE, dd MMMM yyyy")} but is currently marked as {order.status.replace(/_/g, ' ')}. Please follow up with the logistics manager or assigned driver immediately.
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Active Undone Claim Alert Box */}
        {order.deliveries?.some((d: any) => d.status === 'undone') && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Active Undone Delivery Claim</h4>
              <p className="text-xs text-amber-700 font-semibold mt-1">
                A driver has declared this order undone/incomplete. The goods have been returned to inventory at the specified sales store. Please review the Undone Claims history below and click "Re-dispatch Order" to select a new driver if needed.
              </p>
            </div>
          </div>
        )}

        {/* Returns Recorded Alert Box */}
        {returnVouchers.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <FileCheck2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">Returns and Replacements Registered</h4>
              <p className="text-xs text-blue-700 font-semibold mt-1">
                This order has {returnVouchers.length} return voucher(s) logged. Out of these, {physicalReplacements.length} are physical replacements. A total of UGX {totalReplacementValue.toLocaleString()} worth of replacements has been delivered to this customer.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Customer & Delivery Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Customer & Delivery details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    
                    {/* Customer Info with Corporate Logo Badge */}
                    <div className="flex gap-3.5">
                      {order.customer?.logo_url ? (
                        <img 
                          src={order.customer.logo_url} 
                          alt={order.customer.name} 
                          className="h-12 w-12 rounded-xl object-cover shadow-sm select-none shrink-0 border border-brand-sage/40 bg-white"
                        />
                      ) : (
                        <div className={`h-12 w-12 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${
                          order.customer?.name?.toLowerCase().includes("shoprite") ? "bg-red-600 text-white" :
                          order.customer?.name?.toLowerCase().includes("kfc") ? "bg-red-800 text-white" :
                          order.customer?.name?.toLowerCase().includes("javas") ? "bg-amber-800 text-white" :
                          order.customer?.name?.toLowerCase().includes("mega") ? "bg-blue-800 text-white" :
                          "bg-brand-forest text-brand-yellow"
                        }`}>
                          {order.customer?.name?.toLowerCase().includes("shoprite") ? "S" :
                           order.customer?.name?.toLowerCase().includes("kfc") ? "K" :
                           order.customer?.name?.toLowerCase().includes("javas") ? "CJ" :
                           order.customer?.name?.toLowerCase().includes("mega") ? "M" :
                           order.customer?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Customer Outlet</p>
                        <p className="font-bold text-gray-800 text-xs mt-0.5">{order.customer?.name || "N/A"}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {order.customer?.contact_person || "No contact info"} • {order.customer?.phone_primary || "No phone"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Address & Zone</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{order.customer?.address || "N/A"}</p>
                        <p className="text-xs text-brand-forest font-extrabold mt-0.5">{order.customer?.zone?.name || "N/A"}</p>
                      </div>
                    </div>

                  </div>
                  
                  <div className="space-y-5">
                    
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Warehouse size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fulfillment Sales Store</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{order.sales_store?.name || "Main Sales Store"}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">Code: {order.sales_store?.code || "MAIN-SALES"}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Required Delivery Date</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{format(new Date(order.required_delivery_date), "EEEE, dd MMMM yyyy")}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {(order.order_notes || order.admin_override_reason) && (
                  <div className="mt-6 pt-6 border-t border-gray-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.order_notes && (
                      <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-200">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Instructions</p>
                        <p className="text-xs text-gray-700 italic mt-1">"{order.order_notes}"</p>
                      </div>
                    )}
                    {order.admin_override_reason && (
                      <div className="bg-red-50/50 rounded-xl p-3.5 border border-red-100">
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={12} /> Admin Override Reason
                        </p>
                        <p className="text-xs text-red-700 font-medium mt-1">"{order.admin_override_reason}"</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proof of Delivery Details Card */}
            {order.status === 'delivered' && (
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-brand-forest font-heading flex items-center gap-2">
                    <FileCheck2 size={16} className="text-brand-forest" />
                    Proof of Delivery Details
                  </CardTitle>
                  {deliveryWithProof?.delivered_at && (
                    <Badge className="bg-green-100 text-green-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg">
                      Delivered
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-5">
                  {proof ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left side: Metadata */}
                        <div className="space-y-5">
                          <div className="flex gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                              <UserCheck size={16} />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Recipient Name & Contact</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">
                                {parsedNotes?.recipient_name || "N/A"}
                              </p>
                              {parsedNotes?.recipient_phone && (
                                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                  <Smartphone size={12} className="text-gray-400" />
                                  {parsedNotes.recipient_phone}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivered By (Driver)</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">
                                {(() => {
                                  let driverName = deliveryWithProof?.driver?.full_name || deliveryWithProof?.driver?.name;
                                  if (!driverName && deliveryWithProof?.delivery_notes) {
                                    try {
                                      const notes = typeof deliveryWithProof.delivery_notes === "string" ? JSON.parse(deliveryWithProof.delivery_notes) : deliveryWithProof.delivery_notes;
                                      if (notes?.emergency_driver) {
                                        driverName = `${notes.emergency_driver} (${notes.emergency_phone || "Emergency Boda"})`;
                                      }
                                    } catch (e) {}
                                  }
                                  return driverName || "Emergency Rider / Driver";
                                })()}
                              </p>
                              {deliveryWithProof?.delivered_at && (
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">
                                  Time: {formatDeliveredAt(deliveryWithProof.delivered_at)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                              <MapPin size={16} />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">GPS Delivery Location</p>
                              {proof.gps_latitude && proof.gps_longitude ? (
                                <>
                                  <p className="text-xs font-bold text-gray-800 mt-0.5">
                                    {parseFloat(proof.gps_latitude).toFixed(6)}, {parseFloat(proof.gps_longitude).toFixed(6)}
                                  </p>
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${proof.gps_latitude},${proof.gps_longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-brand-forest font-extrabold hover:underline mt-1 inline-flex items-center gap-1.5 bg-brand-sage/20 px-2 py-0.5 rounded-md"
                                  >
                                    <Map size={10} />
                                    View on Google Maps
                                    <ExternalLink size={8} />
                                  </a>
                                </>
                              ) : (
                                <p className="text-xs font-bold text-gray-800 mt-0.5">N/A</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Delivery notes */}
                        <div className="space-y-5">
                          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200 h-full flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Driver Delivery Notes</p>
                              <p className="text-xs text-gray-700 italic mt-2 leading-relaxed">
                                {parsedNotes?.notes ? `"${parsedNotes.notes}"` : "No notes provided by driver."}
                              </p>
                            </div>
                            {proof.confirmed_at && (
                              <div className="text-[9px] text-gray-400 font-bold uppercase mt-4 pt-4 border-t border-gray-150">
                                Confirmed: {formatConfirmedAt(proof.confirmed_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Proof Images Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        {/* Signed Document Photo */}
                        <div className="space-y-2">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Camera size={12} /> Signed Document Proof
                          </p>
                          {proof.document_proof_url ? (
                            <div 
                              className="relative group overflow-hidden rounded-xl border border-brand-sage/40 bg-gray-50 h-48 w-full cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                              onClick={() => { setLightboxImage(proof.document_proof_url); setLightboxScale(1); }}
                            >
                              <img 
                                src={proof.document_proof_url} 
                                alt="Signed Document Proof" 
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                                <ExternalLink size={14} /> Click to Enlarge
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-4">
                              <AlertTriangle size={24} className="text-amber-500 mb-2" />
                              <p className="text-xs font-semibold">No document photo uploaded</p>
                            </div>
                          )}
                        </div>

                        {/* Recipient Signature */}
                        <div className="space-y-2">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Pencil size={12} /> Recipient Signature
                          </p>
                          {proof.signature_proof_url ? (
                            <div 
                              className="relative group overflow-hidden rounded-xl border border-brand-sage/40 bg-gray-50 h-48 w-full cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                              onClick={() => { setLightboxImage(proof.signature_proof_url); setLightboxScale(1); }}
                            >
                              <img 
                                src={proof.signature_proof_url} 
                                alt="Recipient Signature" 
                                className="w-full h-full object-contain p-4 group-hover:scale-102 transition-transform duration-300 bg-white"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                                <ExternalLink size={14} /> Click to Enlarge
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-4">
                              <AlertTriangle size={24} className="text-amber-500 mb-2" />
                              <p className="text-xs font-semibold">No signature recorded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-amber-50/50 rounded-xl border border-amber-100 p-5">
                      <AlertTriangle className="text-amber-500 mb-2" size={28} />
                      <h4 className="text-xs font-bold text-gray-800">Electronic Proof of Delivery Missing</h4>
                      <p className="text-[11px] text-gray-500 max-w-md mt-1">
                        This order is marked as delivered, but no electronic proof (document image, signature, coordinates) was uploaded or recorded for this delivery.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Undone Delivery Claims Card */}
            {order.deliveries?.some((d: any) => d.status === 'undone') && (
              <Card className="border border-red-200 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-red-50/50 border-b border-red-200 py-3.5 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-red-900 font-heading flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    Undone Delivery Claims History
                  </CardTitle>
                  <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg">
                    Incomplete Attempts
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {order.deliveries
                    .filter((d: any) => d.status === 'undone')
                    .map((d: any, idx: number) => {
                      const isExempted = d.undone_reason === 'traffic' || d.undone_reason === 'late_dispatch';
                      return (
                        <div key={d.id} className="border border-red-100 bg-red-50/20 p-4 rounded-xl space-y-3 last:mb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-red-900 text-xs">Trip #{idx + 1} Attempt</span>
                              <Badge className={`text-[9px] font-black uppercase px-2 py-0.25 border-none ${
                                isExempted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {isExempted ? "Exempted from Penalty" : "Penalized Claim"}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">
                              Claimed: {formatDeliveredAt(d.undone_at)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Driver</p>
                              <p className="font-bold text-gray-800 mt-0.5">
                                {(() => {
                                  let dName = d.driver?.full_name || d.driver?.name;
                                  if (!dName && d.delivery_notes) {
                                    try {
                                      const notes = typeof d.delivery_notes === "string" ? JSON.parse(d.delivery_notes) : d.delivery_notes;
                                      if (notes?.emergency_driver) {
                                        dName = `${notes.emergency_driver} (${notes.emergency_phone || 'Emergency Boda'})`;
                                      }
                                    } catch (e) {}
                                  }
                                  return dName || "Emergency Rider / Driver";
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dispatched Time</p>
                              <p className="font-bold text-gray-700 mt-0.5">{formatDeliveredAt(d.dispatched_at)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Returned To Sales Store</p>
                              <p className="font-bold text-brand-forest mt-0.5">
                                {d.return_sales_store?.name ? `${d.return_sales_store.name} (${d.return_sales_store.code})` : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-red-100">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Driver Claimed Reason</p>
                            <p className="text-xs text-red-800 font-semibold mt-1">
                              "{d.undone_reason ? d.undone_reason.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'No reason specified'}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}

            {/* Items Table Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Ordered Items & Packaging
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6">Product Details</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest">Fulfillment Quantity</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Subtotal Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item: any) => {
                      const uom = item.product?.unit_of_measure || "trays";
                      return (
                        <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                          <TableCell className="pl-6 py-4">
                            <p className="font-bold text-brand-forest text-xs">{item.product?.name || "N/A"}</p>
                            <p className="text-[10px] text-gray-400 font-semibold tracking-wider font-mono mt-0.5">{item.product?.code || "N/A"}</p>
                          </TableCell>
                          <TableCell className="text-center font-bold text-gray-800 text-xs">
                            {parseFloat(item.quantity).toLocaleString()} {uom}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-500 text-xs">
                            UGX {parseFloat(item.unit_price).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-extrabold pr-6 text-brand-forest text-xs font-heading">
                            UGX {parseFloat(item.line_total).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="hover:bg-transparent bg-gray-50/20 border-t border-brand-sage/20">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subtotal</TableCell>
                      <TableCell className="text-right font-bold text-gray-700 text-xs pr-6">
                        UGX {parseFloat(order.total_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent bg-gray-50/20 border-none">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">V.A.T (0%)</TableCell>
                      <TableCell className="text-right font-bold text-gray-700 text-xs pr-6">UGX 0</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent bg-brand-sage/10 border-t border-brand-sage/30">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-xs font-extrabold text-brand-forest uppercase tracking-wider">Total Value</TableCell>
                      <TableCell className="text-right text-sm font-black text-brand-forest font-heading pr-6">
                        UGX {parseFloat(order.total_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {totalReplacementValue > 0 && (
                      <TableRow className="hover:bg-transparent bg-blue-50/35 border-t border-blue-200">
                        <TableCell colSpan={2} />
                        <TableCell className="text-right text-xs font-extrabold text-blue-900 uppercase tracking-wider">Replacements Given</TableCell>
                        <TableCell className="text-right text-sm font-black text-blue-900 font-heading pr-6">
                          UGX {totalReplacementValue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Returns & Replacements Registry Card */}
            {returnVouchers.length > 0 && (
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white mt-8">
                <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                    Returns & Physical Replacements Registry
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-brand-forest pl-6">Returned Product</TableHead>
                        <TableHead className="text-xs font-bold text-brand-forest">Return Type</TableHead>
                        <TableHead className="text-center text-xs font-bold text-brand-forest">Qty Returned</TableHead>
                        <TableHead className="text-center text-xs font-bold text-brand-forest">Qty Replaced</TableHead>
                        <TableHead className="text-xs font-bold text-brand-forest">Replacement Source Store</TableHead>
                        <TableHead className="text-xs font-bold text-brand-forest">Replacement Batch</TableHead>
                        <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Replacement Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnVouchers.map((voucher: any) => {
                        const replacedQty = parseFloat(voucher.replacement_quantity) || 0;
                        const val = replacedQty * parseFloat(voucher.unit_price);
                        return (
                          <TableRow key={voucher.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0 text-xs">
                            <TableCell className="pl-6 py-4 font-semibold text-gray-800">
                              {voucher.product?.name || "Product"}
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono mt-1">
                                {voucher.voucher_number} • Returned: {voucher.return_date}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-gray-600">
                              {voucher.return_type === 'physical_replacement' ? 'Physical Replacement' : 'Account Credit'}
                            </TableCell>
                            <TableCell className="text-center font-bold text-gray-800">
                              {parseFloat(voucher.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center font-bold text-gray-800">
                              {replacedQty.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-600">
                              {voucher.replacement_sales_store?.name 
                                ? `${voucher.replacement_sales_store.name} (${voucher.replacement_sales_store.code})`
                                : voucher.return_type === 'physical_replacement' ? 'Pending' : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-gray-600">
                              {voucher.replacement_batch_reference || (voucher.return_type === 'physical_replacement' ? 'Pending' : 'N/A')}
                            </TableCell>
                            <TableCell className="text-right font-extrabold text-blue-900 pr-6">
                              UGX {val.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            
            {/* Timeline */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-brand-forest">
                  Order Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-sage/50">
                  {baseTimeline.map((event, index) => (
                    <div key={index} className="relative pl-7">
                      <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-white border-2 border-brand-forest z-10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-brand-yellow rounded-full" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-brand-forest text-xs">{event.status}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{event.time}</p>
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                          <User size={10} className="text-gray-400" /> {event.user}
                        </div>
                        {event.notes && (
                          <p className="text-[10px] text-gray-600 bg-brand-sage/20 p-2.5 rounded-lg mt-2 leading-relaxed">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions / Info */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-brand-sage/10">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="text-brand-amber shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Stock deduction and delivery logs occur immediately when order transitions. If Loko Sales Store stock is insufficient, admin override verification is requested.
                  </p>
                </div>
                {order.invoice && (
                  <Link href={`/invoices/${order.invoice.id}`}>
                    <Button variant="outline" className="w-full text-brand-forest border-brand-forest/60 hover:bg-brand-forest hover:text-white h-9.5 text-xs font-extrabold rounded-xl transition-colors">
                      View Linked Invoice Statement
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-sage/40 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-heading font-black text-base text-brand-forest">Stock Shortage Detected</h3>
              </div>
              
              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/80">
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  {overrideErrorMessage}
                </p>
              </div>

              <form onSubmit={handleOverrideSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="override-reason" className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                    Admin Override Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="override-reason"
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest bg-white placeholder-gray-400 font-medium resize-none text-gray-800"
                    placeholder="Provide justification for proceeding with negative/override stock..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOverrideModalOpen(false);
                      setOverrideReason("");
                      setOverrideErrorMessage("");
                      setPendingStatusToRetry("");
                    }}
                    className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs"
                  >
                    Confirm Override
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / FULL-SIZE IMAGE PREVIEW OVERLAY */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop close trigger */}
          <div 
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
          />
          
          {/* Top Toolbar */}
          <div className="relative z-10 flex items-center gap-3 bg-black/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 mb-4 text-white shadow-xl">
            {!lightboxImage.toLowerCase().endsWith('.pdf') && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxScale(prev => Math.max(0.5, prev - 0.25))}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold w-12 text-center">
                  {Math.round(lightboxScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxScale(prev => Math.min(4, prev + 0.25))}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxScale(1)}
                  className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <div className="h-4 w-px bg-white/20 mx-1" />
              </>
            )}
            <button 
              type="button"
              onClick={() => setLightboxImage(null)}
              className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer font-bold text-sm"
              title="Close Preview"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Image/PDF Container with Scroll/Overflow Support */}
          <div className="relative max-w-4xl w-full h-[75vh] flex items-center justify-center z-10 border border-white/10 rounded-2xl bg-white shadow-2xl overflow-hidden">
            {lightboxImage.toLowerCase().endsWith('.pdf') ? (
              <iframe 
                src={lightboxImage} 
                className="w-full h-full rounded-2xl border-none"
                title="PDF Document Preview"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4 scrollbar-thin scrollbar-thumb-white/25">
                <img 
                  src={lightboxImage} 
                  alt="Full preview" 
                  className="rounded-lg shadow-inner transition-transform duration-200 ease-out origin-center max-w-full max-h-[70vh] object-contain"
                  style={{ transform: `scale(${lightboxScale})` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {showRedispatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-sage/40 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-forest px-5 py-3.5 flex justify-between items-center text-white">
              <div>
                <h3 className="font-heading font-black text-sm text-brand-yellow">Re-dispatch Order</h3>
                <p className="text-[10px] text-brand-sage font-medium mt-0.5">Assign this undone order to an active driver</p>
              </div>
              <button 
                onClick={() => setShowRedispatchModal(false)}
                className="text-brand-sage hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRedispatch} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Driver *</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.flatMap((d: any) => {
                    const hasVehicles = d.vehicles && d.vehicles.length > 0;
                    if (!hasVehicles) {
                      return [{
                        id: `${d.id}_`,
                        label: `${d.full_name || d.name} (No vehicle)`,
                        disabled: d.status === 'offline' || d.status === 'busy'
                      }];
                    }
                    return d.vehicles.map((v: any) => ({
                      id: `${d.id}_${v.id}`,
                      label: `${d.full_name || d.name} (${v.registration_number} - ${v.make} ${v.model || ''})`,
                      disabled: d.status === 'offline' || d.status === 'busy'
                    }));
                  }).map((opt: any) => (
                    <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-brand-sage/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRedispatchModal(false)}
                  className="h-9.5 px-4 text-xs font-bold border-brand-sage bg-white text-gray-600 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRedispatching || !selectedDriverId}
                  className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs"
                >
                  {isRedispatching ? "Dispatching..." : "Assign & Dispatch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
