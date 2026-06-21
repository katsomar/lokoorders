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
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.data) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
    } finally {
      setIsLoading(false);
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
      case "delivered":
        return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Delivered</Badge>;
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
              <p className="text-gray-500 font-body text-xs mt-1.5">
                Order Placed: <strong className="text-gray-700">{format(new Date(order.order_date), "dd MMMM yyyy")}</strong>
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
            {!(order.status === "dispatched" || order.status === "delivered") && (
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
          </div>
        </div>

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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
    </DashboardLayout>
  );
}
