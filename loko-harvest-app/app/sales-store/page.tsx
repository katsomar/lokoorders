"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRightLeft, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  Warehouse,
  History,
  AlertTriangle,
  DollarSign,
  Calculator,
  RefreshCw,
  TrendingUp,
  Boxes,
  MapPin,
  ClipboardList
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

interface SalesStockItem {
  id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  unitPrice: number; // Sale price
  status: "good" | "low" | "out";
  category: "cream" | "white" | "brown" | "damaged" | "poultry" | "manure";
  capacity: number; // Storage capacity for progress tracking
}

const mockStock: SalesStockItem[] = [
  // Cream Egg Packaged Products
  { id: "1", product: "Cream Eggs - Single Pack", code: "EGG-CRM-SGL", quantity: 450, unit: "Trays", unitPrice: 15000, status: "good", category: "cream", capacity: 1000 },
  { id: "2", product: "Cream Eggs - 15-Pack", code: "EGG-CRM-15P", quantity: 300, unit: "Packs", unitPrice: 8500, status: "good", category: "cream", capacity: 800 },
  { id: "3", product: "Cream Eggs - 6-Pack", code: "EGG-CRM-06P", quantity: 1200, unit: "Packs", unitPrice: 3800, status: "good", category: "cream", capacity: 2000 },
  
  // White Egg Packaged Products
  { id: "4", product: "White Eggs - Single Pack", code: "EGG-WHT-SGL", quantity: 840, unit: "Trays", unitPrice: 15000, status: "good", category: "white", capacity: 1500 },
  { id: "5", product: "White Eggs - 15-Pack", code: "EGG-WHT-15P", quantity: 500, unit: "Packs", unitPrice: 8500, status: "good", category: "white", capacity: 1000 },
  { id: "6", product: "White Eggs - 6-Pack", code: "EGG-WHT-06P", quantity: 1500, unit: "Packs", unitPrice: 3800, status: "good", category: "white", capacity: 2500 },
  
  // Brown Egg Products (Plain Trays only)
  { id: "7", product: "Brown Eggs - Plain Trays", code: "EGG-BRN-TRYS", quantity: 210, unit: "Trays", unitPrice: 14000, status: "low", category: "brown", capacity: 1500 },
  
  // Damaged Egg Products
  { id: "8", product: "Loose Damaged Eggs", code: "EGG-DMG-LOOSE", quantity: 1500, unit: "Eggs", unitPrice: 300, status: "good", category: "damaged", capacity: 5000 },
  { id: "9", product: "Damaged Egg Trays", code: "EGG-DMG-TRYS", quantity: 40, unit: "Trays", unitPrice: 7000, status: "good", category: "damaged", capacity: 200 },
  
  // Other farm items
  { id: "10", product: "Dressed Chicken", code: "POU-DRS-UNIT", quantity: 125, unit: "Units", unitPrice: 25000, status: "good", category: "poultry", capacity: 500 },
  { id: "11", product: "Chicken Manure (50kg Bag)", code: "BY-MNR-50KG", quantity: 1500, unit: "Bags", unitPrice: 1500, status: "good", category: "manure", capacity: 3000 },
];

const mockMovements = [
  { id: "1", date: "2026-05-17 02:30 PM", product: "White Eggs - Single Pack", type: "transfer_in", quantity: 200, unit: "Trays", ref: "TRF-0943" },
  { id: "2", date: "2026-05-17 01:15 PM", product: "Dressed Chicken", type: "dispatch_out", quantity: 15, unit: "Units", ref: "LHI-2026-0042" },
  { id: "3", date: "2026-05-16 11:00 AM", product: "Brown Eggs - Plain Trays", type: "transfer_in", quantity: 100, unit: "Trays", ref: "TRF-0912" },
  { id: "4", date: "2026-05-16 09:30 AM", product: "Cream Eggs - 15-Pack", type: "transfer_in", quantity: 120, unit: "Packs", ref: "TRF-0911" },
];

export default function SalesStorePage() {
  const [stockItems, setStockItems] = useState<SalesStockItem[]>(mockStock);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "cream" | "white" | "brown" | "other">("all");
  
  // State for interactive calculator
  const [calcEggType, setCalcEggType] = useState<"cream" | "white">("cream");
  const [calcDirection, setCalcDirection] = useState<"trays-to-packs" | "packs-to-trays">("trays-to-packs");
  const [calcTraysInput, setCalcTraysInput] = useState("10");
  
  const [calcPacksType, setCalcPacksType] = useState<"single" | "15pack" | "6pack">("15pack");
  const [calcPacksInput, setCalcPacksInput] = useState("40");

  const getFilteredStock = () => {
    return stockItems.filter(item => {
      const matchesSearch = 
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
        
      if (!matchesSearch) return false;
      if (activeCategory === "all") return true;
      if (activeCategory === "cream") return item.category === "cream";
      if (activeCategory === "white") return item.category === "white";
      if (activeCategory === "brown") return item.category === "brown";
      return ["damaged", "poultry", "manure"].includes(item.category);
    });
  };

  const calculateTotalValuation = () => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  // Calculator Conversion Live Logic
  const getCalcResults = () => {
    if (calcDirection === "trays-to-packs") {
      const trays = parseFloat(calcTraysInput) || 0;
      return {
        singlePacks: trays,          // 1 tray = 1 Single Pack (Tray)
        pack15: trays * 2,           // 1 tray = 2 x 15-Packs
        pack6: trays * 5,            // 1 tray = 5 x 6-Packs
        eggs: trays * 30,
        equivalentTrays: 0,
        totalEggs: 0,
        remainderEggs: 0
      };
    } else {
      const packs = parseFloat(calcPacksInput) || 0;
      let trays = 0;
      let eggs = 0;
      
      if (calcPacksType === "single") {
        trays = packs;
        eggs = packs * 30;
      } else if (calcPacksType === "15pack") {
        trays = packs / 2;
        eggs = packs * 15;
      } else {
        trays = packs / 5;
        eggs = packs * 6;
      }

      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggs: 0,
        equivalentTrays: trays,
        totalEggs: eggs,
        remainderEggs: eggs % 30
      };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Sales Store</h1>
            <p className="text-gray-500 font-body">Track packaged products, monitor sales valuation worth, and calculate egg packaging conversions</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/sales-store/transfers">
              <Button className="gap-1.5 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none h-9.5 px-4 font-extrabold rounded-xl text-xs shadow-sm">
                <ArrowRightLeft size={15} />
                Fulfill Stock Transfer
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Valuation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TOTAL SALES STORE VALUATION */}
          <Card className="border-none shadow-xl bg-brand-forest text-white md:col-span-2">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Packaged Sales Inventory Financial Valuation</p>
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[9px]">TOTAL SALES VALUE</Badge>
                </div>
                <h3 className="text-3xl font-black font-heading mt-2">
                  UGX {calculateTotalValuation().toLocaleString()}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-brand-yellow animate-pulse" />
                  <span>Aggregated worth of all converted packaging categories</span>
                </div>
                <span className="font-bold text-brand-yellow">Ready for Dispatch</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Converted Packs</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
                {stockItems
                  .filter(item => item.unit === "Packs")
                  .reduce((acc, item) => acc + item.quantity, 0)
                  .toLocaleString()} Units
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4 flex items-center gap-1">
                <Boxes size={12} className="text-brand-forest" />
                Includes 15-pack and 6-pack cartons
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Plain & Single Trays</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
                {stockItems
                  .filter(item => item.unit === "Trays")
                  .reduce((acc, item) => acc + item.quantity, 0)
                  .toLocaleString()} Trays
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                Bulk White, Brown and Cream trays
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Live Inventory Breakdown & Interactive Conversion Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inventory Breakdown Table */}
          <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Warehouse size={18} className="text-brand-forest" />
                  Sales Store Packaged Inventory Valuation
                </CardTitle>
                <CardDescription className="text-xs">Real-time stock of packaged, sorted and plain eggs with unit sales values</CardDescription>
              </div>
              
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search products..." 
                  className="pl-9 h-9 text-xs border-brand-sage" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-3 bg-gray-50/40 border-b border-brand-sage/20 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: "All Items", icon: "📦" },
                  { id: "cream", label: "Cream Products", icon: "🥚" },
                  { id: "white", label: "White Products", icon: "🥚" },
                  { id: "brown", label: "Brown Products", icon: "🥚" },
                  { id: "other", label: "Damaged & Side", icon: "🌾" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 border whitespace-nowrap ${
                      activeCategory === tab.id
                        ? 'bg-brand-forest text-white border-brand-forest shadow-sm'
                        : 'bg-white text-gray-500 border-brand-sage/60 hover:bg-brand-sage/10 hover:text-brand-forest'
                    }`}
                  >
                    <span className="text-xs">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <Table>
                <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-brand-forest pl-6">Packaged Product</TableHead>
                    <TableHead className="text-xs font-bold text-brand-forest">Stock Code</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Current Stock</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest">Sales Price</TableHead>
                    <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Total Dues Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredStock().map((item) => {
                    const itemValue = item.quantity * item.unitPrice;
                    
                    // Fallback for Fast Refresh preserving old state without capacity
                    const capacityValue = item.capacity || (item.quantity > 1000 ? 2500 : item.quantity > 300 ? 1000 : 200);
                    const percent = Math.min((item.quantity / capacityValue) * 100, 100);
                    
                    // Turns red if quantity < 50 or status is 'low'
                    const isLow = item.status === 'low' || item.quantity < 50;

                    return (
                      <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6">
                          <div className="font-bold text-brand-forest text-sm">{item.product}</div>
                          {isLow && (
                            <Badge className="bg-red-50 text-red-600 border-none text-[8px] px-1 py-0 h-4 mt-0.5 animate-pulse">
                              LOW STOCK ALERT
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-400 font-bold">{item.code}</TableCell>
                        <TableCell className="text-right font-bold text-brand-forest">
                          <div>
                            {item.quantity.toLocaleString()}{" "}
                            <span className="text-xs text-gray-400 font-medium">{item.unit}</span>
                          </div>
                          
                          {/* Sleek Animated Progress bar inside fixed-width container */}
                          <div className="bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto shadow-inner" style={{ width: "96px" }}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLow 
                                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse' 
                                  : 'bg-gradient-to-r from-brand-mid via-emerald-400 to-brand-forest'
                              }`} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-gray-500">
                          UGX {item.unitPrice.toLocaleString()}{" "}<span className="text-[10px] text-gray-400 font-normal">/ {item.unit.replace("s", "")}</span>
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

          {/* INTERACTIVE PACK & TRAY CONVERTER WIDGET */}
          <div className="space-y-6">
            
            <Card className="border border-brand-sage shadow-md rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-brand-forest text-white py-4 px-5">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator size={18} className="text-brand-yellow" />
                  Store Pack & Tray Converter
                </CardTitle>
                <CardDescription className="text-white/60 text-[10px]">
                  Calculate bulk tray inputs to finished packaging packs, or trace carton stocks back to tray equivalence
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4">
                
                {/* Mode Select */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border border-gray-150 rounded-xl">
                  <button
                    onClick={() => setCalcDirection("trays-to-packs")}
                    className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      calcDirection === "trays-to-packs"
                        ? "bg-brand-forest text-white shadow-sm"
                        : "text-gray-500 hover:text-brand-forest"
                    }`}
                  >
                    Trays ➜ Packs
                  </button>
                  <button
                    onClick={() => setCalcDirection("packs-to-trays")}
                    className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      calcDirection === "packs-to-trays"
                        ? "bg-brand-forest text-white shadow-sm"
                        : "text-gray-500 hover:text-brand-forest"
                    }`}
                  >
                    Packs ➜ Trays
                  </button>
                </div>

                {/* Egg Color Category Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-forest block">Egg Category</label>
                  <select 
                    value={calcEggType}
                    onChange={(e) => setCalcEggType(e.target.value as any)}
                    className="w-full text-xs font-bold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  >
                    <option value="cream">Cream Eggs</option>
                    <option value="white">White Eggs</option>
                  </select>
                </div>

                {/* INPUT CONDITIONAL RENDER */}
                {calcDirection === "trays-to-packs" ? (
                  <Input
                    label="Quantity in Bulk Trays (30 Eggs/Tray)"
                    type="number"
                    value={calcTraysInput}
                    onChange={(e) => setCalcTraysInput(e.target.value)}
                    placeholder="Enter trays count"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-forest block">Pack Type</label>
                      <select 
                        value={calcPacksType}
                        onChange={(e) => setCalcPacksType(e.target.value as any)}
                        className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      >
                        <option value="single">Single Pack (Tray)</option>
                        <option value="15pack">15-Egg Pack</option>
                        <option value="6pack">6-Egg Pack</option>
                      </select>
                    </div>
                    <Input
                      label="Packs Count"
                      type="number"
                      value={calcPacksInput}
                      onChange={(e) => setCalcPacksInput(e.target.value)}
                      placeholder="Enter packs count"
                    />
                  </div>
                )}

                {/* CONVERSION LIVE OUTPUTS */}
                <div className="bg-brand-sage/10 rounded-xl p-4 border border-brand-sage/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-sage/20 pb-1.5">
                    <span className="text-[10px] font-bold text-brand-forest uppercase tracking-wider">Conversion Results</span>
                    <RefreshCw size={12} className="text-brand-mid animate-spin-slow" />
                  </div>

                  {calcDirection === "trays-to-packs" ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">Single Pack (Tray) Equivalent:</span>
                        <span className="font-extrabold text-brand-forest">
                          {getCalcResults().singlePacks?.toLocaleString()} Trays
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">15-Egg Carton Packs:</span>
                        <span className="font-extrabold text-brand-forest">
                          {getCalcResults().pack15?.toLocaleString()} Packs
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">6-Egg Carton Packs:</span>
                        <span className="font-extrabold text-brand-forest">
                          {getCalcResults().pack6?.toLocaleString()} Packs
                        </span>
                      </div>
                      <div className="border-t border-brand-sage/20 pt-2 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                        <span>Total Loose Eggs:</span>
                        <span>{getCalcResults().eggs?.toLocaleString()} Eggs</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Bulk Trays Consumed</p>
                        <p className="text-base font-black text-brand-forest mt-1">
                          {getCalcResults().equivalentTrays?.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">Trays</span>
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 pt-1.5 border-t border-brand-sage/20">
                        <span>Total Loose Eggs Equivalent:</span>
                        <span>{getCalcResults().totalEggs?.toLocaleString()} Eggs</span>
                      </div>
                      
                      {getCalcResults().remainderEggs && getCalcResults().remainderEggs > 0 ? (
                        <p className="text-[9px] text-red-500 font-bold text-center">
                          ⚠️ Warning: Leaves {getCalcResults().remainderEggs} eggs which do not fit into full trays.
                        </p>
                      ) : null}
                    </div>
                  )}
                  
                </div>

                <div className="text-[9px] text-gray-400 font-medium leading-relaxed leading-normal">
                  💡 **Packaging Rules**: 1 bulk egg tray contains exactly **30 eggs**. 
                  * Cream & White eggs convert to packs (Single Pack, 15-pack, 6-pack).
                  * Brown eggs are only sold as plain 30-egg trays.
                  * Damaged eggs are sold loose at UGX 300 or trays at UGX 7,000.
                </div>

              </CardContent>
            </Card>

            {/* Recent movements log */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-brand-forest flex items-center gap-2">
                  <ClipboardList size={16} className="text-brand-forest" />
                  Recent Movements
                </CardTitle>
                <Link href="/sales-store/movements" className="text-[9px] text-brand-forest font-bold hover:underline">
                  View All
                </Link>
              </CardHeader>
              
              <CardContent className="p-0 divide-y divide-brand-sage/30">
                {mockMovements.map((move) => (
                  <div key={move.id} className="p-3.5 hover:bg-brand-sage/5 transition-colors flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brand-forest text-xs">{move.product}</span>
                      <span className={`font-black text-xs ${move.type === 'transfer_in' ? 'text-green-600' : 'text-amber-600'}`}>
                        {move.type === 'transfer_in' ? '+' : '-'}{move.quantity} {move.unit.toLowerCase()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span>Ref: {move.ref}</span>
                      <span>{move.date}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
