"use client";

import React, { useState } from "react";
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
  Trash2
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

interface ProductionStockItem {
  id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  capacity: number;
  unitValuePrice: number; // Valuation per tray/unit
  category: "cream" | "white" | "brown" | "damaged" | "poultry";
}

const mockProductionStock: ProductionStockItem[] = [
  { id: "1", product: "Bulk White Eggs", code: "EGG-WHT-BULK", quantity: 2100, unit: "Trays", capacity: 4000, unitValuePrice: 12000, category: "white" },
  { id: "2", product: "Bulk Cream Eggs", code: "EGG-CRM-BULK", quantity: 1200, unit: "Trays", capacity: 3000, unitValuePrice: 11500, category: "cream" },
  { id: "3", product: "Bulk Brown Eggs", code: "EGG-BRN-BULK", quantity: 850, unit: "Trays", capacity: 2000, unitValuePrice: 12500, category: "brown" },
  { id: "4", product: "Loose Damaged Eggs", code: "EGG-DMG-LOOSE", quantity: 4500, unit: "Eggs", capacity: 10000, unitValuePrice: 200, category: "damaged" },
  { id: "5", product: "Dressed Chicken", code: "POU-DRS-BULK", quantity: 350, unit: "Units", capacity: 1000, unitValuePrice: 22000, category: "poultry" },
];

const mockIntakes = [
  { id: "1", date: "2026-05-17 09:30 AM", product: "Bulk White Eggs", quantity: 400, unit: "Trays", batch: "B-0517-A", recorded_by: "Grace Namuli" },
  { id: "2", date: "2026-05-17 08:00 AM", product: "Loose Damaged Eggs", quantity: 300, unit: "Eggs", batch: "D-0517-A", recorded_by: "Grace Namuli" },
  { id: "3", date: "2026-05-16 04:00 PM", product: "Bulk Cream Eggs", quantity: 250, unit: "Trays", batch: "B-0516-C", recorded_by: "Grace Namuli" },
  { id: "4", date: "2026-05-16 02:15 PM", product: "Dressed Chicken", quantity: 120, unit: "Units", batch: "C-0516-X", recorded_by: "Grace Namuli" },
  { id: "5", date: "2026-05-15 11:30 AM", product: "Bulk Brown Eggs", quantity: 150, unit: "Trays", batch: "B-0515-B", recorded_by: "Grace Namuli" },
];

export default function ProductionStorePage() {
  const [stockItems, setStockItems] = useState<ProductionStockItem[]>(mockProductionStock);
  const [intakeLogs, setIntakeLogs] = useState(mockIntakes);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Transfer state
  const [transferType, setTransferType] = useState<"cream" | "white" | "brown" | "damaged">("cream");
  const [transferQty, setTransferQty] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Compute valuations
  const calculateTotalValuation = () => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.unitValuePrice), 0);
  };

  const getFilteredStock = () => {
    return stockItems.filter(item => 
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const handlePostTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transferQty) || 0;
    if (qty <= 0) return;

    // Verify stock availability
    const targetCode = transferType === "cream" ? "EGG-CRM-BULK" : 
                       transferType === "white" ? "EGG-WHT-BULK" :
                       transferType === "brown" ? "EGG-BRN-BULK" : "EGG-DMG-LOOSE";
    
    const targetItem = stockItems.find(item => item.code === targetCode);
    if (!targetItem || targetItem.quantity < qty) {
      alert(`Insufficient stock! Only ${targetItem?.quantity || 0} ${targetItem?.unit || "items"} available in Production Store.`);
      return;
    }

    setIsSubmittingTransfer(true);
    
    setTimeout(() => {
      // Deduct from Production Stock
      setStockItems(prev => prev.map(item => 
        item.code === targetCode 
          ? { ...item, quantity: item.quantity - qty } 
          : item
      ));

      // Append dummy intake/transfer log
      const newLog = {
        id: Math.random().toString(),
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        product: `Transfer out: ${targetItem.product}`,
        quantity: -qty,
        unit: targetItem.unit,
        batch: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
        recorded_by: "Grace Namuli"
      };
      
      setIntakeLogs(prev => [newLog, ...prev]);
      setIsSubmittingTransfer(false);
      setShowTransferModal(false);
      setTransferQty("");
      alert("Transfer request successful! Converted packaged products are now pending receipt at the Sales Store.");
    }, 1200);
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
                {stockItems.find(item => item.code === "EGG-DMG-LOOSE")?.quantity.toLocaleString()} Eggs
              </h3>
              <p className="text-xs text-red-500 font-bold mt-4 flex items-center gap-1">
                Worth UGX {((stockItems.find(item => item.code === "EGG-DMG-LOOSE")?.quantity || 0) * 200).toLocaleString()}
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
              
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search bulk products..." 
                  className="pl-9 h-9 text-xs border-brand-sage" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-brand-forest pl-6">Bulk Product</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Stock Code</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Stock Quantity</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Valuation Price</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Total Dues Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredStock().map((item) => {
                    const itemValue = item.quantity * item.unitValuePrice;
                    return (
                      <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6 font-bold text-brand-forest text-sm">
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
                        <TableCell className="text-right pr-6 font-black text-brand-forest font-heading text-sm">
                          UGX {itemValue.toLocaleString()}
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

    </DashboardLayout>
  );
}
