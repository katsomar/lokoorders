"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowDownToLine, 
  ArrowRightLeft, 
  Search, 
  Warehouse,
  History,
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
  TrendingDown,
  Activity,
  CheckCircle,
  Trash2,
  Edit2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import api from "@/lib/api";

interface ProductionStockItem {
  id: string;
  product_id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  capacity: number;
  unitValuePrice: number; // Valuation per tray/unit
  category: "cream" | "white" | "brown" | "damaged" | "poultry";
  batch_reference?: string;
}

export default function ProductionStorePage() {
  const [stockItems, setStockItems] = useState<ProductionStockItem[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transfer state
  const [transferType, setTransferType] = useState<"cream" | "white" | "brown" | "damaged">("cream");
  const [transferQty, setTransferQty] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Batch Filter state
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionStockItem | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleStartEdit = (item: ProductionStockItem) => {
    setEditingItem(item);
    setEditQty(item.quantity.toString());
    setEditPrice(item.unitValuePrice.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmittingEdit(true);
    try {
      await api.put(`/production-stock/${editingItem.id}`, {
        current_quantity: parseFloat(editQty) || 0,
        valuation_price: parseFloat(editPrice) || 0,
      });
      alert("Stock updated successfully!");
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update stock.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteStock = async (item: ProductionStockItem) => {
    if (!confirm(`Are you sure you want to delete the stock record for ${item.product}? This will remove it from the table.`)) return;
    try {
      await api.delete(`/production-stock/${item.id}`);
      alert("Stock record deleted successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete stock.");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stockRes, intakeRes] = await Promise.all([
        api.get('/production-stock'),
        api.get('/production-intakes')
      ]);
      
      const stockData = stockRes.data.data || [];
      const mappedStock: ProductionStockItem[] = stockData.map((item: any) => {
        let cat = "damaged";
        if (item.product.code.includes("WHT")) cat = "white";
        else if (item.product.code.includes("CRM")) cat = "cream";
        else if (item.product.code.includes("BRN")) cat = "brown";
        else if (item.product.category === "poultry") cat = "poultry";
        
        let cap = 5000;
        if (cat === "white") cap = 4000;
        else if (cat === "cream") cap = 3000;
        else if (cat === "brown") cap = 2000;
        else if (cat === "damaged") cap = 10000;

        return {
          id: item.id,
          product_id: item.product_id,
          product: item.product.name,
          code: item.product.code,
          quantity: parseFloat(item.current_quantity),
          unit: item.product.unit_of_measure === 'trays' ? 'Trays' : item.product.unit_of_measure === 'units' ? 'Units' : 'Kg',
          capacity: cap,
          unitValuePrice: item.valuation_price ? parseFloat(item.valuation_price) : parseFloat(item.product.default_unit_price),
          category: cat as any,
          batch_reference: item.batch_reference || 'N/A'
        };
      });
      setStockItems(mappedStock);

      const mappedIntakes = (intakeRes.data.data.data || []).map((intake: any) => ({
        id: intake.id,
        date: new Date(intake.intake_date || intake.created_at).toLocaleString('en-US', { 
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
        }),
        product: intake.product?.name,
        quantity: parseFloat(intake.quantity),
        unit: intake.product?.unit_of_measure === 'trays' ? 'Trays' : intake.product?.unit_of_measure === 'units' ? 'Units' : 'Kg',
        batch: intake.batch_number || intake.batch_reference || 'N/A',
        recorded_by: intake.user?.name || 'System'
      }));
      setIntakeLogs(mappedIntakes);
      
    } catch (err) {
      console.error("Failed to fetch production store data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute valuations
  const calculateTotalValuation = () => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.unitValuePrice), 0);
  };

  const getUniqueBatches = () => {
    const batches = stockItems.map(item => item.batch_reference || 'N/A');
    return ["all", ...Array.from(new Set(batches))];
  };

  const getFilteredStock = () => {
    return stockItems.filter(item => {
      const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBatch = selectedBatchFilter === "all" || (item.batch_reference || 'N/A') === selectedBatchFilter;
      return matchesSearch && matchesBatch;
    });
  };

  // Live Conversion Previews for the transfer dialog
  const getTransferPreview = () => {
    const qty = parseFloat(transferQty) || 0;
    if (transferType === "cream" || transferType === "white") {
      return {
        singlePacks: qty, // 1 tray = 1 Single Pack (Tray)
        pack15: qty * 2,  // 1 tray = 2 x 15-Packs
        pack6: qty * 5,   // 1 tray = 5 x 6-Packs
        eggsCount: qty * 30,
        plainTrays: 0,
        looseEggs: 0,
        damagedTrays: 0,
        remainderEggs: 0
      };
    } else if (transferType === "brown") {
      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggsCount: qty * 30,
        plainTrays: qty,  // Brown eggs are sold as plain trays
        looseEggs: 0,
        damagedTrays: 0,
        remainderEggs: 0
      };
    } else {
      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggsCount: 0,
        plainTrays: 0,
        looseEggs: qty,   // Damaged eggs are sold as loose eggs
        damagedTrays: Math.floor(qty / 30),
        remainderEggs: qty % 30
      };
    }
  };

  const handlePostTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transferQty) || 0;
    if (qty <= 0) return;

    // Verify stock availability
    const targetCode = transferType === "cream" ? "EGG-CRM" : 
                       transferType === "white" ? "EGG-WHT" :
                       transferType === "brown" ? "EGG-BRN" : "EGG-DMG";
    
    const targetItem = stockItems.find(item => item.code.includes(targetCode));
    if (!targetItem || targetItem.quantity < qty) {
      alert(`Insufficient stock! Only ${targetItem?.quantity || 0} ${targetItem?.unit || "items"} available in Production Store.`);
      return;
    }

    setIsSubmittingTransfer(true);
    
    try {
      const response = await api.post("/store-transfers", {
        product_id: targetItem.product_id,
        quantity: qty,
        transfer_date: new Date().toISOString().split('T')[0],
        notes: `Transfer requested from Production Store UI for ${transferType}`
      });

      if (response.data.success) {
        alert("Transfer request successful! Converted packaged products are now pending receipt at the Sales Store.");
        setShowTransferModal(false);
        setTransferQty("");
        fetchData(); // Refresh stock and logs
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process transfer. Please try again.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Production Store</h1>
            <p className="text-gray-500 font-body">Manage farm bulk egg intake, evaluate inventory financial worth, and route transfers to Sales packaging</p>
          </div>
          
          <div className="flex gap-2.5 items-center">
            <Button 
              onClick={() => setShowTransferModal(true)}
              className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs"
            >
              <ArrowRightLeft size={15} />
              Transfer to Sales
            </Button>
            <Link href="/production-store/intake">
              <Button className="gap-1.5 bg-transparent border border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-4 rounded-xl text-xs shadow-sm">
                <ArrowDownToLine size={15} />
                New Harvest Intake
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Valuation & Stock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TOTAL STORE VALUATION */}
          <Card className="border-none shadow-xl bg-brand-forest text-white md:col-span-2">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Production Inventory Financial Valuation</p>
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[9px]">ACTIVE VALUE</Badge>
                </div>
                <h3 className="text-3xl font-black font-heading mt-2">
                  UGX {calculateTotalValuation().toLocaleString()}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <Activity size={14} className="text-brand-yellow animate-pulse" />
                  <span>Calculated from live farm intake volumes</span>
                </div>
                <span className="font-bold text-brand-yellow">100% Bulk Stocked</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Bulk Egg Trays</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
                {stockItems
                  .filter(item => item.unit === "Trays")
                  .reduce((acc, item) => acc + item.quantity, 0)
                  .toLocaleString()} Trays
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4 flex items-center gap-1">
                <CheckCircle size={12} className="text-green-500" />
                Fresh harvested from layers today
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Loose Damaged Eggs</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
                {stockItems.find(item => item.code.includes("EGG-DMG"))?.quantity.toLocaleString() || "0"} Eggs
              </h3>
              <p className="text-xs text-red-500 font-bold mt-4 flex items-center gap-1">
                Worth UGX {((stockItems.find(item => item.code.includes("EGG-DMG"))?.quantity || 0) * 200).toLocaleString()}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Live Inventory Breakdown Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Warehouse size={18} className="text-brand-forest" />
                  Bulk Stock Inventory & Sales Valuation
                </CardTitle>
                <CardDescription className="text-xs">Real-time stock list and corresponding monetary valuation sheet</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest w-full sm:w-40"
                >
                  <option value="all">All Batches</option>
                  {getUniqueBatches().filter(b => b !== "all").map(batch => (
                    <option key={batch} value={batch}>Batch: {batch}</option>
                  ))}
                </select>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    placeholder="Search bulk products..." 
                    className="pl-9 h-9 text-xs border-brand-sage rounded-xl" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-brand-forest pl-6">Batch No</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Bulk Product</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Stock Code</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Stock Quantity</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Valuation Price</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Total Dues Value</TableHead>
                    <TableHead className="text-center text-xs font-bold text-brand-forest pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredStock().map((item) => {
                    const itemValue = item.quantity * item.unitValuePrice;
                    return (
                      <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6 font-mono text-xs text-gray-700 font-bold">
                          <Badge className="border border-brand-sage bg-gray-50 text-brand-forest font-bold">
                            {item.batch_reference || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-brand-forest text-sm">
                          {item.product}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-400 font-bold">{item.code}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-brand-forest">
                            {item.quantity.toLocaleString()}{" "}
                            <span className="text-xs text-gray-400 font-medium">{item.unit}</span>
                          </div>
                          
                          {/* Utilization bar */}
                          <div className="w-24 bg-gray-100 h-1 rounded-full overflow-hidden mt-1 ml-auto">
                            <div 
                              className="bg-brand-mid h-full" 
                              style={{ width: `${(item.quantity / item.capacity) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-gray-500">
                          UGX {item.unitValuePrice.toLocaleString()}{" "}<span className="text-[10px] text-gray-400 font-normal">/ {item.unit.replace("s", "")}</span>
                        </TableCell>
                        <TableCell className="text-right font-black text-brand-forest font-heading text-sm">
                          UGX {itemValue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-gray-500 hover:text-brand-forest hover:bg-gray-100 rounded-lg transition-colors animate-pulse-subtle"
                              title="Edit Stock"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteStock(item)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Intake Ledger Sidebar */}
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4">
              <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                <History size={18} className="text-brand-forest" />
                Recent Intake Activity
              </CardTitle>
              <CardDescription className="text-xs">Audit log of latest egg harvest entries</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-brand-sage/30">
                {intakeLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-brand-sage/5 transition-colors flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.date}</span>
                      <Badge className={`border-none text-[9px] font-bold ${log.quantity > 0 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {log.quantity > 0 ? "INTAKE" : "TRANSFER"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-forest">{log.product}</span>
                      <span className={`font-black text-xs ${log.quantity > 0 ? "text-green-600" : "text-amber-600"}`}>
                        {log.quantity > 0 ? "+" : ""}{log.quantity.toLocaleString()} {log.unit.toLowerCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span className="font-mono">Batch: {log.batch}</span>
                      <span>By: {log.recorded_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* PRODUCTION TO SALES TRANSFER REQUEST DIALOG */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Bulk Transfer to Sales Store</h3>
                <p className="text-[10px] text-white/70">Request bulk egg transfers to be processed and packaged inside Sales department</p>
              </div>
            </div>

            <form onSubmit={handlePostTransfer} className="p-6 space-y-4">
              
              {/* Product Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-forest block mb-1">
                  Egg Bulk Category to Transfer
                </label>
                <select 
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as any)}
                  className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                >
                  <option value="cream">Cream Eggs Bulk Trays</option>
                  <option value="white">White Eggs Bulk Trays</option>
                  <option value="brown">Brown Eggs Bulk Trays</option>
                  <option value="damaged">Loose Damaged Eggs</option>
                </select>
              </div>

              {/* Quantity */}
              <Input
                label={transferType === "damaged" ? "Quantity to Transfer (Individual Eggs)" : "Quantity to Transfer (Trays of 30 Eggs)"}
                type="number"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                placeholder={transferType === "damaged" ? "Enter egg count" : "Enter tray count"}
                required
              />

              {/* LIVE CONVERSION CONVERTER PREVIEW DISPLAY */}
              <div className="bg-brand-sage/10 border border-brand-sage/30 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-brand-forest border-b border-brand-sage/20 pb-1.5">
                  Live Converted Sales Product Estimates
                </p>
                
                {transferType === "cream" || transferType === "white" ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Single Packs</p>
                      <p className="text-sm font-black text-brand-forest mt-1">
                        {getTransferPreview().singlePacks.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Trays</span>
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">15-Packs</p>
                      <p className="text-sm font-black text-brand-forest mt-1">
                        {getTransferPreview().pack15.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Packs</span>
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">6-Packs</p>
                      <p className="text-sm font-black text-brand-forest mt-1">
                        {getTransferPreview().pack6.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Packs</span>
                      </p>
                    </div>
                  </div>
                ) : transferType === "brown" ? (
                  <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Plain Brown Trays</p>
                    <p className="text-sm font-black text-brand-forest mt-1">
                      {getTransferPreview().plainTrays.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Trays</span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Loose Eggs</p>
                      <p className="text-sm font-black text-brand-forest mt-1">
                        {getTransferPreview().looseEggs.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Eggs</span>
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Damaged Trays Equivalent</p>
                      <p className="text-sm font-black text-brand-forest mt-1">
                        {getTransferPreview().damagedTrays.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Trays</span>
                      </p>
                      {getTransferPreview().remainderEggs > 0 && (
                        <p className="text-[9px] text-red-500 font-bold mt-0.5">+{getTransferPreview().remainderEggs} loose eggs leftover</p>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-[9px] text-gray-400 text-center font-medium">
                  Formula calculations: 1 bulk tray of 30 eggs yields: 1 Single Pack (Tray) OR 2 x 15-Packs OR 5 x 6-Packs.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTransferModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md"
                  isLoading={isSubmittingTransfer}
                >
                  Confirm Transfer Request
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <Edit2 size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Edit Product Stock Details</h3>
                <p className="text-[10px] text-white/70">Modify current quantity and active valuation price for {editingItem.product}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              
              <Input
                label={`Current Stock Quantity (${editingItem.unit})`}
                type="number"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                required
              />

              <Input
                label="Valuation Price (UGX)"
                type="number"
                step="1"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md"
                  isLoading={isSubmittingEdit}
                >
                  Save Changes
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
