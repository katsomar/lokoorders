"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Calendar, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Search, 
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function ProductionStoreActivityPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any>({
    total_quantity: 0,
    total_quantity_trays: 0,
    total_quantity_others: 0,
    total_valuation: 0,
    count: 0,
    product_values: {}
  });
  const [productionStores, setProductionStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(15);

  // Load baseline filters on mount
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [storesRes, productsRes] = await Promise.all([
          api.get("/production-stores"),
          api.get("/products")
        ]);
        setProductionStores(storesRes.data.data || []);
        // Only show products that are eggs (cream, white, brown, damaged) or poultry to filter bulk items
        const allProds = productsRes.data.data || [];
        setProducts(allProds.filter((p: any) => p.category === 'eggs' || p.category === 'poultry'));
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      }
    };
    loadFiltersData();
  }, []);

  // Fetch paginated transfers
  const fetchTransfers = async () => {
    setIsLoading(true);
    setIsAnalyticsLoading(true);
    try {
      const res = await api.get("/store-transfers", {
        params: {
          production_store_id: selectedStore || undefined,
          product_id: selectedProduct || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page: currentPage,
          per_page: 15
        }
      });
      const responseData = res.data.data;
      if (responseData) {
        setTransfers(responseData.data || []);
        setCurrentPage(responseData.current_page || 1);
        setTotalPages(responseData.last_page || 1);
        setTotalItems(responseData.total || 0);
        setPerPage(responseData.per_page || 15);
        if (responseData.aggregates) {
          setAggregates(responseData.aggregates);
        }
      }
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
    } finally {
      setIsLoading(false);
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [startDate, endDate, selectedStore, selectedProduct, currentPage]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Dynamic analytics calculations
  const analytics = useMemo(() => {
    const totalValuation = aggregates.total_valuation || 0;
    const totalQuantityTrays = aggregates.total_quantity_trays || 0;
    const totalQuantityOthers = aggregates.total_quantity_others || 0;
    const count = aggregates.count || 0;
    const averageValuation = count > 0 ? totalValuation / count : 0;
    const productValues = aggregates.product_values || {};

    return {
      totalValuation,
      totalQuantityTrays,
      totalQuantityOthers,
      count,
      averageValuation,
      productValues
    };
  }, [aggregates]);

  const getLogoColor = (productName: string = "") => {
    const lower = productName.toLowerCase();
    if (lower.includes("cream")) return "bg-[#FDF6E2] text-[#B08A26] border border-[#F3E5C8]";
    if (lower.includes("white")) return "bg-gray-50 text-gray-700 border border-gray-200";
    if (lower.includes("brown")) return "bg-[#F7EFE5] text-[#8C6239] border border-[#ECDCC9]";
    return "bg-red-50 text-red-700 border border-red-100";
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await api.get("/store-transfers", {
        params: {
          production_store_id: selectedStore || undefined,
          product_id: selectedProduct || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          per_page: 2000 // Large page size to pull entire context on-demand for CSV
        }
      });
      const records = res.data.data?.data || [];
      if (records.length === 0) {
        alert("No data available to export.");
        return;
      }
      
      const headers = ["Date", "Product", "Product Code", "Source Store", "Destination Store", "Quantity", "Unit Price (UGX)", "Total Valuation (UGX)", "Authorized By", "Notes"];
      const rows = records.map((t: any) => [
        t.transfer_date || format(new Date(t.created_at), "yyyy-MM-dd"),
        t.product?.name || "N/A",
        t.product?.code || "N/A",
        t.production_store?.name || "N/A",
        t.sales_store?.name || "N/A",
        t.quantity,
        t.unit_price || 0,
        (parseFloat(t.quantity) * parseFloat(t.unit_price || 0)),
        t.user?.name || "System",
        t.notes || ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map((e: any[]) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `production_transfers_audit_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export analytics data:", err);
      alert("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => router.push("/production-store")}
              className="h-9.5 w-9.5 p-0 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-xl text-brand-forest transition-colors flex items-center justify-center shrink-0 border border-brand-sage/30 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-brand-forest font-heading">Transfer Outflow Activity</h1>
              <p className="text-gray-500 font-body text-xs mt-0.5">Comprehensive audit and financial tracking of stock leaving production stores</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={exportCSV}
            disabled={isExporting}
            className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm cursor-pointer"
          >
            {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            {isExporting ? "Exporting..." : "Export CSV Log"}
          </Button>
        </div>

        {/* Analytics Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Total Value Outflow */}
          <Card className="border-none shadow-xl bg-brand-forest text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Total Value Transferred</p>
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
                Valued at production cost rates
              </p>
            </CardContent>
          </Card>

          {/* Volume Trays */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Trays Transferred</p>
                <Warehouse size={16} className="text-brand-forest" />
              </div>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-brand-forest h-6 w-6" />
                ) : (
                  `${analytics.totalQuantityTrays.toLocaleString()} Trays`
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                Total egg count: {(analytics.totalQuantityTrays * 30).toLocaleString()} eggs
              </p>
            </CardContent>
          </Card>

          {/* Average Valuation per Dispatch */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Avg Transfer Value</p>
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
                Calculated across {analytics.count} dispatches
              </p>
            </CardContent>
          </Card>

          {/* Transaction Count */}
          <Card className="border border-brand-sage/40 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Dispatch Count</p>
                <Layers size={16} className="text-brand-forest" />
              </div>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {isAnalyticsLoading ? (
                  <Loader2 className="animate-spin text-brand-forest h-6 w-6" />
                ) : (
                  `${analytics.count} Transfers`
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                Logged movements to packaging
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Visual Distribution and Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Filters Panel */}
          <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-3">
              <CardTitle className="text-sm font-bold text-brand-forest">Filter Transfer Logs</CardTitle>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Fulfillment Production Store</label>
                  <Select 
                    value={selectedStore}
                    onChange={(e) => { setSelectedStore(e.target.value); handleFilterChange(); }}
                    options={[
                      { label: "All Production Stores", value: "" },
                      ...productionStores.map(s => ({ label: `${s.name} (${s.code})`, value: s.id }))
                    ]}
                  />
                </div>
                <div>
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
                  {Object.entries(analytics.productValues).map(([name, val]: [string, any]) => {
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
              <CardTitle className="text-base font-bold text-brand-forest">Audit Ledger - Transfers out of Production</CardTitle>
              <CardDescription className="text-xs">Detailed records matching selected criteria</CardDescription>
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
                  <TableRow>
                    <TableHead className="pl-6 text-xs font-bold text-brand-forest">Date</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Product Details</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Batch Reference</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">From (Prod Store)</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">To (Sales Store)</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Qty Transferred</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Unit Price</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Total Valuation</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest pl-6">Operator</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest pr-6">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500 font-bold">
                          <Loader2 className="animate-spin text-brand-forest" size={24} />
                          Loading transaction records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16 text-gray-500 text-xs font-medium">
                        No transfer activities found matching the filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((t) => {
                      const dateStr = t.created_at || t.transfer_date;
                      const prodName = t.product?.name || "Unknown Product";
                      const prodCode = t.product?.code || "N/A";
                      const fromStore = t.production_store?.name || "Main Production Store";
                      const toStore = t.sales_store?.name || "Main Sales Store";
                      const qty = parseFloat(t.quantity) || 0;
                      const uom = t.product?.unit_of_measure === 'trays' ? 'Trays' : t.product?.unit_of_measure === 'units' ? 'Units' : 'Kg';
                      const unitPrice = parseFloat(t.unit_price || t.product?.production_unit_price || t.product?.default_unit_price || 0);
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
                          <TableCell className="text-xs font-semibold whitespace-nowrap">
                            {t.batch_reference ? (
                              <Badge variant="outline" className="bg-brand-sage/15 text-brand-forest border-brand-sage/35 text-[10px] font-bold">
                                {t.batch_reference}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
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
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-brand-sage/30 bg-gray-50/30">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {totalItems > 0 
                  ? `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, totalItems)} of {totalItems} entries`
                  : "No transfers to display"
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
