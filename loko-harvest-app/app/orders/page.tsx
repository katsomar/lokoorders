"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Download,
  Loader2,
  Pencil,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import api from "@/lib/api";

const isCarriedOverUncompleted = (order: any) => {
  if (!order || !order.order_date) return false;
  
  // Get today's local date string (YYYY-MM-DD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  const orderDateStr = order.order_date.split(' ')[0];
  
  const isPastDay = orderDateStr < todayStr;
  const isUncompleted = !["delivered", "dispatched"].includes((order.status || "").toLowerCase());
  
  return isPastDay && isUncompleted;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      const aCarried = isCarriedOverUncompleted(a);
      const bCarried = isCarriedOverUncompleted(b);
      if (aCarried && !bCarried) return -1;
      if (!aCarried && bCarried) return 1;
      return 0;
    });
  }, [orders]);

  const [metrics, setMetrics] = useState({
    totalUrgent: 0,
    totalPending: 0,
    totalDispatched: 0,
    totalDelivered: 0,
    totalUndelivered: 0,
    totalReplacementValue: 0,
    netExpectedValue: 0
  });

  // Debounce search term to prevent duplicate API hits
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/orders", {
        params: {
          search: debouncedSearch,
          status: statusFilter || undefined,
          urgency: urgencyFilter || undefined,
          page: currentPage,
          per_page: 15,
        }
      });
      const responseData = res.data.data;
      if (responseData) {
        setOrders(responseData.data || []);
        setCurrentPage(responseData.current_page || 1);
        setTotalPages(responseData.last_page || 1);
        setTotalItems(responseData.total || 0);
        setPerPage(responseData.per_page || 15);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/orders/metrics");
      const data = res.data.data;
      if (data) {
        setMetrics({
          totalUrgent: data.totalUrgent || 0,
          totalPending: data.totalPending || 0,
          totalDispatched: data.totalDispatched || 0,
          totalDelivered: data.totalDelivered || 0,
          totalUndelivered: data.totalUndelivered || 0,
          totalReplacementValue: data.totalReplacementValue || 0,
          netExpectedValue: data.netExpectedValue || 0
        });
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber}? This will refund store stock and reverse account invoices.`)) {
      return;
    }
    try {
      await api.delete(`/orders/${orderId}`);
      alert("Order deleted successfully!");
      fetchOrders();
      fetchMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete order.");
    }
  };


  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, statusFilter, urgencyFilter, currentPage]);

  useEffect(() => {
    fetchMetrics();
  }, [orders]);

  const getUrgencyBadge = (urgency: string) => {
    switch ((urgency || "").toLowerCase()) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Critical</Badge>;
      case "urgent":
        return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Urgent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string, requiredDeliveryDate?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isMissed = (status || "").toLowerCase() !== "delivered" && requiredDeliveryDate && requiredDeliveryDate.split(' ')[0] < todayStr;
    if (isMissed) {
      return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Missed</Badge>;
    }
    switch ((status || "").toLowerCase()) {
      case "pending":
        return <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Processing</Badge>;
      case "ready_for_dispatch":
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Ready</Badge>;
      case "dispatched":
        return <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Dispatched</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Delivered</Badge>;
      case "undone":
        return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Undone Claim</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 text-[10px] font-bold py-0.5 px-2 rounded-lg">{status}</Badge>;
    }
  };

  const getLogoColor = (name: string = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("shoprite")) return "bg-red-600 text-white";
    if (lower.includes("kfc")) return "bg-red-800 text-white";
    if (lower.includes("javas")) return "bg-amber-800 text-white";
    if (lower.includes("mega")) return "bg-blue-800 text-white";
    return "bg-brand-forest text-brand-yellow";
  };

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order Number", "Customer", "Fulfillment Store", "Urgency", "Status", "Order Date", "Required Delivery", "Total Amount"];
    const rows = orders.map(o => [
      o.order_number,
      o.customer?.name || "N/A",
      o.sales_store?.name || "N/A",
      o.urgency,
      o.status,
      o.order_date,
      o.required_delivery_date,
      o.total_amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_pipeline_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Standardized Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading">Order Pipeline & Fulfillment</h1>
            <p className="text-gray-500 font-body text-sm mt-0.5">Track, schedule, and dispatch bulk deliveries to client outlets</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs">
              <Plus size={15} />
              New Order
            </Button>
          </Link>
        </div>

        {/* Dynamic Orders Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Urgent / Critical */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Urgent Action</span>
              <span className={`h-2 w-2 rounded-full bg-red-500 ${metrics.totalUrgent > 0 ? "animate-pulse" : ""}`} />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-red-600 font-heading leading-none">{metrics.totalUrgent}</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">Critical & Urgent</p>
            </div>
          </div>

          {/* Card 2: Pending Approval */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending Orders</span>
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-gray-700 font-heading leading-none">{metrics.totalPending}</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">Awaiting Review</p>
            </div>
          </div>

          {/* Card 3: Dispatched */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dispatched</span>
              <span className={`h-1.5 w-1.5 rounded-full bg-purple-500 ${metrics.totalDispatched > 0 ? "animate-pulse" : ""}`} />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-purple-600 font-heading leading-none">{metrics.totalDispatched}</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">In Transit</p>
            </div>
          </div>

          {/* Card 4: Delivered */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivered</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-green-600 font-heading leading-none">{metrics.totalDelivered}</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">Fulfillments Cleared</p>
            </div>
          </div>

          {/* Card 5: Total Undelivered */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Undelivered Pipeline</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-brand-forest font-heading leading-none">{metrics.totalUndelivered}</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">Active Operations</p>
            </div>
          </div>

          {/* Card 6: Expected Value (Adjusted) */}
          <div className="bg-brand-yellow/10 p-4 rounded-xl shadow-sm border border-brand-yellow/30 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-forest font-bold uppercase tracking-wider">Net Expected Value</span>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-forest" />
            </div>
            <div className="mt-3">
              <h3 className="text-[13px] font-black text-brand-forest font-heading leading-none">
                UGX {metrics.netExpectedValue.toLocaleString()}
              </h3>
              <p className="text-[8px] text-gray-500 font-bold mt-1.5 uppercase tracking-tight">
                Replacements: -UGX {metrics.totalReplacementValue.toLocaleString()}
              </p>
            </div>
          </div>

        </div>

        {/* Standardized Filters Panel */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40">
          <div className="flex flex-col md:flex-row gap-3 w-full lg:max-w-3xl items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Search by order # or customer..." 
                className="pl-10 h-10 text-xs rounded-xl border-brand-sage/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-[160px]">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                options={[
                  { label: "All Statuses", value: "" },
                  { label: "Pending", value: "pending" },
                  { label: "Processing", value: "processing" },
                  { label: "Ready", value: "ready_for_dispatch" },
                  { label: "Dispatched", value: "dispatched" },
                  { label: "Delivered", value: "delivered" },
                  { label: "Missed", value: "missed" }
                ]}
              />
            </div>

            <div className="w-[160px]">
              <Select
                value={urgencyFilter}
                onChange={(e) => { setUrgencyFilter(e.target.value); setCurrentPage(1); }}
                options={[
                  { label: "All Urgencies", value: "" },
                  { label: "Normal", value: "normal" },
                  { label: "Urgent", value: "urgent" },
                  { label: "Critical", value: "critical" }
                ]}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button 
              variant="outline" 
              onClick={exportCSV} 
              className="gap-1.5 h-9.5 px-4 text-xs font-bold rounded-xl border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 w-full lg:w-auto"
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Legend Key */}
        <div className="flex flex-wrap items-center gap-6 bg-white px-5 py-3 rounded-xl border border-brand-sage/40 shadow-sm text-xs font-bold text-gray-600">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Indicator Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse inline-block border border-red-400" />
            <span className="text-red-600 font-extrabold animate-pulse">Carried Over (Action Required)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
            <span>Missed Deadline / Undone Attempt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Returns Recorded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Replacements Delivered</span>
          </div>
        </div>

        {/* Improved Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-sage/40 overflow-hidden min-h-[200px] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/70 border-b border-brand-sage/30">
                <TableRow>
                  <TableHead className="text-xs font-bold text-brand-forest pl-6">Order #</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">FDN</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Customer Details</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Fulfillment Store</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Batch Reference</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Order Date</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Required Delivery</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Urgency</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold text-brand-forest">Total Value</TableHead>
                  <TableHead className="text-right text-xs font-bold text-brand-forest pr-6 w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500 font-bold">
                        <Loader2 className="animate-spin text-brand-forest" size={24} />
                        Loading orders pipeline...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-500 font-body text-xs">
                      No orders found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => {
                    const name = order.customer?.name || "Unknown Customer";
                    const storeName = order.sales_store?.name || "Main Sales Store";
                    const logoLetter = name.toLowerCase().includes("shoprite") ? "S" :
                                       name.toLowerCase().includes("kfc") ? "K" :
                                       name.toLowerCase().includes("javas") ? "CJ" :
                                       name.toLowerCase().includes("mega") ? "M" :
                                       name.charAt(0).toUpperCase();

                    const hasUndone = order.deliveries?.some((d: any) => d.status === 'undone');
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isMissed = (order.status || "").toLowerCase() !== "delivered" && order.required_delivery_date && order.required_delivery_date.split(' ')[0] < todayStr;
                    const hasIssues = hasUndone || isMissed;
                    const hasReturns = Array.isArray(order.return_vouchers) && order.return_vouchers.length > 0;
                    const hasReplacements = Array.isArray(order.return_vouchers) && order.return_vouchers.some((v: any) => parseFloat(v.replacement_quantity) > 0);
                    const isCarriedOver = isCarriedOverUncompleted(order);

                    return (
                      <TableRow 
                        key={order.id} 
                        className={`hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0 ${
                          isCarriedOver ? "animate-throb-red-row" : ""
                        }`}
                      >
                        <TableCell className={`pl-6 py-3.5 ${isCarriedOver ? "border-l-4 border-l-red-600" : ""}`}>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand-forest">
                            {order.order_number}
                            <div className="flex items-center gap-1 shrink-0">
                              {hasIssues && (
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" title="Order has issues (missed deadline or undone delivery attempt)" />
                              )}
                              {hasReturns && (
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" title="Order has return items recorded" />
                              )}
                              {hasReplacements && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" title="Order has physical replacements delivered" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gray-700">
                          {order.fiscal_document_number || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {order.customer?.logo_url ? (
                              <img 
                                src={order.customer.logo_url} 
                                alt={name} 
                                className="h-8 w-8 rounded-xl object-cover shadow-sm select-none shrink-0 border border-brand-sage/40 bg-white"
                              />
                            ) : (
                              <div className={`h-8 w-8 rounded-xl font-heading font-black text-xs flex items-center justify-center shadow-sm select-none shrink-0 ${getLogoColor(name)}`}>
                                {logoLetter}
                              </div>
                            )}
                            <span className="font-bold text-gray-800 text-xs">{name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          {storeName}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          {(() => {
                            const batchRefs = Array.from(
                              new Set((order.items || []).map((item: any) => item.batch_reference).filter(Boolean))
                            ) as string[];
                            return batchRefs.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {batchRefs.map(b => (
                                  <span key={b} className="bg-brand-sage/15 border border-brand-sage/30 text-brand-forest px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px] font-body">FIFO / None</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-medium">
                          {format(new Date(order.order_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 font-semibold">
                          {format(new Date(order.required_delivery_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(order.urgency)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status, order.required_delivery_date)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-extrabold text-brand-forest font-heading">
                          UGX {parseFloat(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-brand-sage/30 rounded-lg">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            
                            {!(order.status === "dispatched" || order.status === "delivered") ? (
                              <>
                                <Link href={`/orders/${order.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg">
                                    <Pencil size={14} />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteOrder(order.id, order.order_number)}
                                  className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 cursor-not-allowed" disabled>
                                  <Pencil size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 cursor-not-allowed" disabled>
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Standardized Pagination Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-brand-sage/30 bg-gray-50/30">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {totalItems > 0 
                ? `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, totalItems)} of ${totalItems} orders`
                : "No orders to display"
              }
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white" 
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white" 
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
