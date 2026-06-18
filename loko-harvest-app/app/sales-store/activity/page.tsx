"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Calendar, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Loader2, 
  Download, 
  Warehouse, 
  Activity,
  ArrowRightLeft
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SalesStoreActivityPage() {
  const router = useRouter();
  
  // Tabs State
  const [activityTab, setActivityTab] = useState<"transfers" | "sales">("transfers");

  // Core Data States
  const [items, setItems] = useState<any[]>([]);
  const [allItemsForAnalytics, setAllItemsForAnalytics] = useState<any[]>([]);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fromStore, setFromStore] = useState("");
  const [toStore, setToStore] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(15);

  // Load baseline filter data on mount
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [storesRes, productsRes] = await Promise.all([
          api.get("/sales-stores"),
          api.get("/products")
        ]);
        setSalesStores(storesRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      }
    };
    loadFiltersData();
  }, []);

  // Fetch paginated activity
  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const endpoint = activityTab === "transfers" ? "/sales-store-transfers" : "/sales-store-sales";
      const params: any = {
        product_id: selectedProduct || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        per_page: 15
      };

      if (activityTab === "transfers") {
        params.from_sales_store_id = fromStore || undefined;
        params.to_sales_store_id = toStore || undefined;
      } else {
        params.sales_store_id = fromStore || undefined;
      }

      const res = await api.get(endpoint, { params });
      const responseData = res.data.data;
      if (responseData) {
        setItems(responseData.data || []);
        setCurrentPage(responseData.current_page || 1);
        setTotalPages(responseData.last_page || 1);
        setTotalItems(responseData.total || 0);
        setPerPage(responseData.per_page || 15);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all filtered records for full-context analytics
  const fetchAllForAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const endpoint = activityTab === "transfers" ? "/sales-store-transfers" : "/sales-store-sales";
      const params: any = {
        product_id: selectedProduct || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        per_page: 1000 // Large page size to pull entire context
      };

      if (activityTab === "transfers") {
        params.from_sales_store_id = fromStore || undefined;
        params.to_sales_store_id = toStore || undefined;
      } else {
        params.sales_store_id = fromStore || undefined;
      }

      const res = await api.get(endpoint, { params });
      setAllItemsForAnalytics(res.data.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    fetchAllForAnalytics();
  }, [activityTab, startDate, endDate, fromStore, toStore, selectedProduct, currentPage]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Dynamic analytics calculations
  const analytics = useMemo(() => {
    let totalValuation = 0;
    let totalQuantity = 0;
    const count = allItemsForAnalytics.length;

    // Category value distributions
    const productValues: { [name: string]: number } = {};

    allItemsForAnalytics.forEach(t => {
      const qty = parseFloat(t.quantity) || 0;
      
      let price = 0;
      if (activityTab === "transfers") {
        price = parseFloat(t.product?.sales_unit_price || t.product?.default_unit_price || 0);
      } else {
        price = parseFloat(t.unit_price || t.product?.sales_unit_price || t.product?.default_unit_price || 0);
      }
      
      const value = qty * price;
      
      totalValuation += value;
      totalQuantity += qty;

      const prodName = t.product?.name || "Other Products";
      productValues[prodName] = (productValues[prodName] || 0) + value;
    });

    const averageValuation = count > 0 ? totalValuation / count : 0;

    return {
      totalValuation,
      totalQuantity,
      count,
      averageValuation,
      productValues
    };
  }, [allItemsForAnalytics, activityTab]);

  const getLogoColor = (productName: string = "") => {
    const lower = productName.toLowerCase();
    if (lower.includes("cream")) return "bg-[#FDF6E2] text-[#B08A26] border border-[#F3E5C8]";
    if (lower.includes("white")) return "bg-gray-50 text-gray-700 border border-gray-200";
    if (lower.includes("brown")) return "bg-[#F7EFE5] text-[#8C6239] border border-[#ECDCC9]";
    return "bg-red-50 text-red-700 border border-red-100";
  };

  const exportCSV = () => {
    if (allItemsForAnalytics.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activityTab === "transfers") {
      headers = ["Date", "Product", "Product Code", "From Store", "To Store", "Quantity", "Sales Unit Price (UGX)", "Total Valuation (UGX)", "Authorized By", "Notes"];
      rows = allItemsForAnalytics.map(t => [
        t.transfer_date || format(new Date(t.created_at), "yyyy-MM-dd"),
        t.product?.name || "N/A",
        t.product?.code || "N/A",
        t.from_store?.name || "N/A",
        t.to_store?.name || "N/A",
        t.quantity,
        (t.product?.sales_unit_price || t.product?.default_unit_price || 0),
        (parseFloat(t.quantity) * parseFloat(t.product?.sales_unit_price || t.product?.default_unit_price || 0)),
        t.user?.name || "System",
        t.notes || ""
      ]);
    } else {
      headers = ["Date", "Order Reference", "Customer", "Product", "Product Code", "Sales Store", "Quantity", "Sold Unit Price (UGX)", "Total Revenue (UGX)", "Operator"];
      rows = allItemsForAnalytics.map(t => [
        t.order?.order_date || format(new Date(t.created_at), "yyyy-MM-dd"),
        t.order?.order_number || "N/A",
        t.order?.customer?.name || "N/A",
        t.product?.name || "N/A",
        t.product?.code || "N/A",
        t.order?.sales_store?.name || "N/A",
        t.quantity,
        t.unit_price,
        (parseFloat(t.quantity) * parseFloat(t.unit_price || 0)),
        t.order?.user?.name || "System"
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activityTab === "transfers" ? "sales_transfers" : "sales_revenue"}_audit_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => router.push("/sales-store")}
              className="h-9.5 w-9.5 p-0 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-xl text-brand-forest transition-colors flex items-center justify-center shrink-0 border border-brand-sage/30 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-brand-forest font-heading">Sales Store Activity Log</h1>
              <p className="text-gray-500 font-body text-xs mt-0.5">Audit tracking of stock transfers and direct product sales from sales outlets</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={exportCSV}
            className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={14} />
            Export CSV Log
          </Button>
        </div>

        {/* Activity Tab Selection */}
        <div className="flex border-b border-brand-sage/40 gap-6 text-sm font-bold pt-2">
          <button 
            onClick={() => { setActivityTab("transfers"); handleFilterChange(); }}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activityTab === "transfers" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft size={16} />
              Inter-Store Transfers
            </span>
            {activityTab === "transfers" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          
          <button 
            onClick={() => { setActivityTab("sales"); handleFilterChange(); }}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activityTab === "sales" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp size={16} />
              Product Sales Activity
            </span>
            {activityTab === "sales" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
        </div>

        {/* Analytics Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Total Value Outflow */}
          <Card className="border-none shadow-xl bg-brand-forest text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  {activityTab === "transfers" ? "Total Sales Value Transferred" : "Total Revenue from Sales"}
                </p>
                <DollarSign size={16} className="text-brand-yellow" />
              </div>
              <h3 className="text-2xl font-black font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-white h-6 w-6" />
                ) : (
                  `UGX ${analytics.totalValuation.toLocaleString()}`
                )}
              </h3>
              <p className="text-[10px] text-brand-yellow font-semibold mt-4 flex items-center gap-1">
                <Activity size={12} className="animate-pulse" />
                {activityTab === "transfers" ? "Valued at sales retail prices" : "Calculated from completed orders"}
              </p>
            </CardContent>
          </Card>

          {/* Volume Items */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  {activityTab === "transfers" ? "Total Packaged Units Moved" : "Total Packaged Units Sold"}
                </p>
                <Warehouse size={16} className="text-brand-forest" />
              </div>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-brand-forest h-6 w-6" />
                ) : (
                  `${analytics.totalQuantity.toLocaleString()} Units`
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                {activityTab === "transfers" ? "Total item count transferred" : "Total item count sold"}
              </p>
            </CardContent>
          </Card>

          {/* Average Valuation per Dispatch */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  {activityTab === "transfers" ? "Avg Sales Value / Transfer" : "Avg Revenue / Sale Item"}
                </p>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-brand-forest h-6 w-6" />
                ) : (
                  `UGX ${Math.round(analytics.averageValuation).toLocaleString()}`
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                Calculated across {analytics.count} items
              </p>
            </CardContent>
          </Card>

          {/* Transaction Count */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  {activityTab === "transfers" ? "Total Dispatch Count" : "Total Sales Count"}
                </p>
                <Layers size={16} className="text-brand-forest" />
              </div>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-brand-forest h-6 w-6" />
                ) : (
                  `${analytics.count} Records`
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                {activityTab === "transfers" ? "Logged movements to outlets" : "Logged direct client purchases"}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Visual Distribution and Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Filters Panel */}
          <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-3">
              <CardTitle className="text-sm font-bold text-brand-forest">Filter Activity Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Start Date</label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
                    className="h-10 text-xs border-brand-sage rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">End Date</label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
                    className="h-10 text-xs border-brand-sage rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">
                    {activityTab === "transfers" ? "Source Store (From)" : "Sales Store"}
                  </label>
                  <Select 
                    value={fromStore}
                    onChange={(e) => { setFromStore(e.target.value); handleFilterChange(); }}
                    options={[
                      { label: "All Stores", value: "" },
                      ...salesStores.map(s => ({ label: `${s.name}`, value: s.id }))
                    ]}
                  />
                </div>
                {activityTab === "transfers" && (
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Destination Store (To)</label>
                    <Select 
                      value={toStore}
                      onChange={(e) => { setToStore(e.target.value); handleFilterChange(); }}
                      options={[
                        { label: "All Stores", value: "" },
                        ...salesStores.map(s => ({ label: `${s.name}`, value: s.id }))
                      ]}
                    />
                  </div>
                )}
                <div className={activityTab === "transfers" ? "" : "sm:col-span-2"}>
                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Filter by Product</label>
                  <Select 
                    value={selectedProduct}
                    onChange={(e) => { setSelectedProduct(e.target.value); handleFilterChange(); }}
                    options={[
                      { label: "All Products", value: "" },
                      ...products.map(p => ({ label: `${p.name} (${p.code})`, value: p.id }))
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Outflow Value Distribution Chart */}
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-3">
              <CardTitle className="text-sm font-bold text-brand-forest">Product Value Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col justify-center min-h-[150px]">
              {isAnalyticsLoading ? (
                <div className="flex justify-center py-6 text-gray-400 text-xs gap-1 items-center">
                  <Loader2 className="animate-spin text-brand-forest" size={14} /> Loading breakdown...
                </div>
              ) : Object.keys(analytics.productValues).length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-6">No data to display in distribution.</div>
              ) : (
                <div className="space-y-3.5">
                  {Object.entries(analytics.productValues).map(([name, val]) => {
                    const percentage = analytics.totalValuation > 0 ? (val / analytics.totalValuation) * 100 : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-700">
                          <span className="truncate max-w-[150px]">{name}</span>
                          <span className="font-extrabold text-brand-forest">
                            UGX {val.toLocaleString()} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand-mid h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Detailed Table view */}
        <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-brand-forest">
                {activityTab === "transfers" ? "Audit Ledger - Sales Transfers" : "Sales Ledger - Product Sales"}
              </CardTitle>
              <p className="text-xs text-gray-500">Detailed records matching selected criteria</p>
            </div>
            {totalItems > 0 && (
              <span className="text-[10px] text-gray-400 font-extrabold uppercase bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                {totalItems} RECORDS FOUND
              </span>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/70 border-b border-brand-sage/30">
                  {activityTab === "transfers" ? (
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Date</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Product Details</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">From Store</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">To Store</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Qty Transferred</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Sales Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Total Valuation</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6">Operator</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest pr-6">Notes</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Date</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Order Ref</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Customer</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Product Details</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Sales Store</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Qty Sold</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Sold Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Total Revenue</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6 pr-6">Operator</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={activityTab === "transfers" ? 9 : 9} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500 font-bold">
                          <Loader2 className="animate-spin text-brand-forest" size={24} />
                          Loading transaction records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activityTab === "transfers" ? 9 : 9} className="text-center py-16 text-gray-500 text-xs font-medium">
                        No activity records found matching the filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((t) => {
                      const prodName = t.product?.name || "Unknown Product";
                      const prodCode = t.product?.code || "N/A";
                      const qty = parseFloat(t.quantity) || 0;
                      const uom = t.product?.unit_of_measure === 'trays' ? 'Trays' : t.product?.unit_of_measure === 'kg' ? 'Kg' : 'Units';
                      
                      if (activityTab === "transfers") {
                        const dateStr = t.transfer_date || format(new Date(t.created_at), "yyyy-MM-dd");
                        const fromStore = t.from_store?.name || "Main Sales Store";
                        const toStore = t.to_store?.name || "Main Sales Store";
                        const unitPrice = parseFloat(t.product?.sales_unit_price || t.product?.default_unit_price || 0);
                        const totalVal = qty * unitPrice;
                        const opName = t.user?.name || "System";

                        return (
                          <TableRow key={t.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                            <TableCell className="pl-6 text-xs text-gray-550 font-bold whitespace-nowrap">
                              {format(new Date(dateStr), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className={`h-8 w-8 rounded-xl font-heading font-black text-[10px] flex items-center justify-center shadow-sm shrink-0 select-none ${getLogoColor(prodName)}`}>
                                  {prodCode.replace("EGG-", "")}
                                </div>
                                <div>
                                  <p className="font-bold text-brand-forest text-xs">{prodName}</p>
                                  <p className="text-[10px] text-gray-400 font-bold font-mono">{prodCode}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-650 font-bold whitespace-nowrap">
                              {fromStore}
                            </TableCell>
                            <TableCell className="text-xs text-gray-650 font-bold whitespace-nowrap">
                              {toStore}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-brand-forest whitespace-nowrap">
                              {qty.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{uom}</span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-500 font-bold whitespace-nowrap">
                              UGX {unitPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-black text-brand-forest font-heading text-xs whitespace-nowrap">
                              UGX {totalVal.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-gray-550 font-bold whitespace-nowrap pl-6">
                              {opName}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 font-medium max-w-[200px] truncate pr-6" title={t.notes}>
                              {t.notes || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      } else {
                        const dateStr = t.order?.order_date || format(new Date(t.created_at), "yyyy-MM-dd");
                        const orderNum = t.order?.order_number || "N/A";
                        const customerName = t.order?.customer?.name || "N/A";
                        const salesStoreName = t.order?.sales_store?.name || "Main Sales Store";
                        const unitPrice = parseFloat(t.unit_price || t.product?.sales_unit_price || t.product?.default_unit_price || 0);
                        const totalVal = qty * unitPrice;
                        const opName = t.order?.user?.name || "System";

                        return (
                          <TableRow key={t.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                            <TableCell className="pl-6 text-xs text-gray-550 font-bold whitespace-nowrap">
                              {format(new Date(dateStr), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-xs text-gray-650 font-bold whitespace-nowrap font-mono">
                              {orderNum}
                            </TableCell>
                            <TableCell className="text-xs text-gray-650 font-bold whitespace-nowrap">
                              {customerName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className={`h-8 w-8 rounded-xl font-heading font-black text-[10px] flex items-center justify-center shadow-sm shrink-0 select-none ${getLogoColor(prodName)}`}>
                                  {prodCode.replace("EGG-", "")}
                                </div>
                                <div>
                                  <p className="font-bold text-brand-forest text-xs">{prodName}</p>
                                  <p className="text-[10px] text-gray-400 font-bold font-mono">{prodCode}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-650 font-bold whitespace-nowrap">
                              {salesStoreName}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-brand-forest whitespace-nowrap">
                              {qty.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{uom}</span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-500 font-bold whitespace-nowrap">
                              UGX {unitPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-black text-brand-forest font-heading text-xs whitespace-nowrap">
                              UGX {totalVal.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-gray-550 font-bold whitespace-nowrap pl-6 pr-6">
                              {opName}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-brand-sage/30 bg-gray-50/30">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {totalItems > 0 
                  ? `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, totalItems)} of ${totalItems} entries`
                  : "No activity to display"
                }
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white cursor-pointer" 
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white cursor-pointer" 
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
