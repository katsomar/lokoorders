"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  ChevronLeft, 
  Warehouse,
  ArrowRight,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Calculator,
  AlertTriangle,
  Egg
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface CategoryInput {
  trays: string;
  eggs: string;
}

export default function StockTransferPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transferredSummary, setTransferredSummary] = useState<string[]>([]);

  const [productionStores, setProductionStores] = useState<any[]>([]);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [rawStockData, setRawStockData] = useState<any[]>([]);

  const [selectedProdStoreId, setSelectedProdStoreId] = useState("");
  const [selectedSalesStoreId, setSelectedSalesStoreId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBatchRef, setSelectedBatchRef] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Transfer Mode: "eggs_multi" vs "single_product"
  const [transferMode, setTransferMode] = useState<"eggs_multi" | "single_product">("eggs_multi");
  const [eggColorFamily, setEggColorFamily] = useState<"WHT" | "CRM" | "BRN">("WHT");

  // Multi-Category Quantities: Good, D1, D2, D3, SHL
  const [categoryInputs, setCategoryInputs] = useState<{ [key: string]: CategoryInput }>({
    good: { trays: "", eggs: "" },
    d1: { trays: "", eggs: "" },
    d2: { trays: "", eggs: "" },
    d3: { trays: "", eggs: "" },
    shl: { trays: "", eggs: "" },
  });

  // Single Product Mode State
  const [singleProductId, setSingleProductId] = useState("");
  const [singleQty, setSingleQty] = useState("");

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Load stores & all system products on mount
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoadingStores(true);
      try {
        const [prodStoresRes, salesStoresRes, productsRes] = await Promise.all([
          api.get('/production-stores'),
          api.get('/sales-stores'),
          api.get('/products')
        ]);
        
        const prodData = prodStoresRes.data.data || [];
        const salesData = salesStoresRes.data.data || [];
        const prods = productsRes.data.data || [];
        
        setProductionStores(prodData);
        setSalesStores(salesData);
        setAllProducts(prods);

        if (prodData.length > 0) setSelectedProdStoreId(prodData[0].id);
        if (salesData.length > 0) setSelectedSalesStoreId(salesData[0].id);
      } catch (err) {
        console.error("Failed to load initial transfer lookups", err);
      } finally {
        setIsLoadingStores(false);
      }
    };
    loadInitial();
  }, []);

  // Load stock whenever selected production store changes
  useEffect(() => {
    if (!selectedProdStoreId) {
      setRawStockData([]);
      return;
    }

    const loadStock = async () => {
      setIsLoadingStock(true);
      try {
        const res = await api.get('/production-stock', {
          params: { production_store_id: selectedProdStoreId }
        });
        setRawStockData(res.data.data || []);
      } catch (err) {
        console.error("Failed to load production stock", err);
      } finally {
        setIsLoadingStock(false);
      }
    };
    loadStock();
  }, [selectedProdStoreId]);

  // Map products by code suffix for current egg color family
  const getProductForQuality = (qualityKey: string) => {
    let suffix = "";
    if (qualityKey === "good") suffix = `EGG-${eggColorFamily}`;
    else if (qualityKey === "d1") suffix = `EGG-${eggColorFamily}-D1`;
    else if (qualityKey === "d2") suffix = `EGG-${eggColorFamily}-D2`;
    else if (qualityKey === "d3") suffix = `EGG-${eggColorFamily}-D3`;
    else if (qualityKey === "shl") suffix = `EGG-${eggColorFamily}-SHL`;

    return allProducts.find(p => p.code === suffix);
  };

  // Get available stock (in total trays) for a specific product code
  const getAvailableStockForProduct = (productId?: string) => {
    if (!productId || !rawStockData) return 0;
    const matchingItems = rawStockData.filter(s => {
      const matchProd = s.product_id === productId;
      const matchBatch = !selectedBatchRef || s.batch_reference === selectedBatchRef;
      return matchProd && matchBatch;
    });

    return matchingItems.reduce((acc, item) => acc + (parseFloat(item.current_quantity) || 0), 0);
  };

  // Format Trays into "X Trays, Y Eggs"
  const formatTraysAndEggsDisplay = (totalTrays: number) => {
    const fullTrays = Math.floor(totalTrays);
    const looseEggs = Math.round((totalTrays - fullTrays) * 30);
    if (fullTrays === 0 && looseEggs === 0) return "0 Trays";
    if (fullTrays > 0 && looseEggs > 0) return `${fullTrays} Trays, ${looseEggs} Eggs`;
    if (fullTrays > 0) return `${fullTrays} Trays`;
    return `${looseEggs} Loose Eggs`;
  };

  // Calculate entered total trays for a category key
  const getEnteredQtyForCategory = (key: string) => {
    const inp = categoryInputs[key] || { trays: "", eggs: "" };
    const t = parseFloat(inp.trays) || 0;
    const e = parseFloat(inp.eggs) || 0;
    return t + (e / 30);
  };

  // Category definitions for rendering table
  const qualityCategories = [
    { key: "good", label: "Good Quality Eggs", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300" },
    { key: "d1", label: "D1 Hairline Cracks", badgeClass: "bg-amber-100 text-amber-900 border-amber-300" },
    { key: "d2", label: "D2 Medium Cracks", badgeClass: "bg-orange-100 text-orange-900 border-orange-300" },
    { key: "d3", label: "D3 Heavy Cracks", badgeClass: "bg-gray-100 text-gray-800 border-gray-300" },
    { key: "shl", label: "Shell Eggs", badgeClass: "bg-blue-100 text-blue-900 border-blue-300" },
  ];

  // Calculate live sidebar valuation & quantities
  const totalEnteredTraysMulti = qualityCategories.reduce((acc, cat) => acc + getEnteredQtyForCategory(cat.key), 0);
  
  const totalValuationUGXMulti = qualityCategories.reduce((acc, cat) => {
    const prod = getProductForQuality(cat.key);
    const qty = getEnteredQtyForCategory(cat.key);
    const price = parseFloat(prod?.production_unit_price || prod?.default_unit_price || 0);
    return acc + (qty * price);
  }, 0);

  // Single Product Calculations
  const selectedSingleProduct = allProducts.find(p => p.id === singleProductId);
  const singleAvailable = getAvailableStockForProduct(singleProductId);
  const singleEnteredQty = parseFloat(singleQty) || 0;
  const singleValuationUGX = singleEnteredQty * parseFloat(selectedSingleProduct?.production_unit_price || selectedSingleProduct?.default_unit_price || 0);

  // Check validation errors
  const isMultiError = qualityCategories.some(cat => {
    const prod = getProductForQuality(cat.key);
    const avail = getAvailableStockForProduct(prod?.id);
    const entered = getEnteredQtyForCategory(cat.key);
    return entered > avail + 0.001;
  });

  const handleCategoryInputChange = (key: string, field: "trays" | "eggs", val: string) => {
    setCategoryInputs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val
      }
    }));
  };

  const handlePostTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdStoreId || !selectedSalesStoreId) {
      alert("Please select both source production store and destination sales store.");
      return;
    }

    setIsLoading(true);
    const itemsToTransfer: { product_id: string; productName: string; quantity: number }[] = [];

    if (transferMode === "eggs_multi") {
      qualityCategories.forEach(cat => {
        const prod = getProductForQuality(cat.key);
        const qty = getEnteredQtyForCategory(cat.key);
        if (prod && qty > 0) {
          itemsToTransfer.push({
            product_id: prod.id,
            productName: prod.name,
            quantity: qty
          });
        }
      });
    } else {
      if (selectedSingleProduct && singleEnteredQty > 0) {
        itemsToTransfer.push({
          product_id: selectedSingleProduct.id,
          productName: selectedSingleProduct.name,
          quantity: singleEnteredQty
        });
      }
    }

    if (itemsToTransfer.length === 0) {
      alert("Please enter a transfer quantity for at least one item.");
      setIsLoading(false);
      return;
    }

    try {
      const summaryList: string[] = [];
      // Submit transfers sequentially
      for (const item of itemsToTransfer) {
        await api.post("/store-transfers", {
          production_store_id: selectedProdStoreId,
          sales_store_id: selectedSalesStoreId,
          product_id: item.product_id,
          quantity: item.quantity,
          transfer_date: transferDate,
          batch_reference: selectedBatchRef || null,
          notes: internalNotes || `Multi-Category Stock Transfer to Sales Store`
        });
        summaryList.push(`${item.productName}: ${formatTraysAndEggsDisplay(item.quantity)}`);
      }

      setTransferredSummary(summaryList);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/sales-store"), 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to execute stock transfer. Please check stock balances.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-lg mx-auto">
          <div className="h-24 w-24 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg">
            <CheckCircle2 size={64} className="animate-bounce" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-brand-forest font-heading">Stock Transfer Successful!</h2>
            <p className="text-gray-500 font-body text-xs">All requested egg categories have been transferred to the Sales Store.</p>
          </div>

          <div className="w-full bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Transferred Categories Summary:</span>
            {transferredSummary.map((sum, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>{sum}</span>
                <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase">Transferred</Badge>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-brand-forest flex items-center justify-center h-10 w-10 hover:bg-brand-sage/20 rounded-xl transition-colors cursor-pointer border-none bg-transparent">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest font-heading flex items-center gap-2">
                <ArrowRightLeft className="text-brand-forest" size={24} />
                Multi-Category Stock Transfer
              </h1>
              <p className="text-gray-500 font-body text-xs mt-0.5">Move Good, D1, D2, D3, and Shell egg categories at once into Sales Store packaging</p>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Column */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-brand-sage/20 border-b border-brand-sage pb-6">
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-brand-forest">
                    <Warehouse size={24} />
                  </div>
                  <span className="text-xs font-bold text-brand-forest uppercase tracking-wider">Production Facility</span>
                </div>
                
                <ArrowRight className="text-brand-mid animate-pulse" size={24} />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-brand-forest flex items-center justify-center shadow-sm text-white">
                    <Warehouse size={24} />
                  </div>
                  <span className="text-xs font-bold text-brand-forest uppercase tracking-wider">Sales Store</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 px-6 pb-6 space-y-6">
              {isLoadingStores ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-forest"></div>
                  <p className="text-xs text-gray-400 font-semibold">Loading facilities...</p>
                </div>
              ) : (
                <form onSubmit={handlePostTransfer} className="space-y-6">
                  
                  {/* Source & Destination Store Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-forest block">Source Production Store *</label>
                      <select 
                        value={selectedProdStoreId}
                        onChange={(e) => setSelectedProdStoreId(e.target.value)}
                        className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 cursor-pointer"
                        required
                      >
                        <option value="">Select source production store...</option>
                        {productionStores.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-forest block">Destination Sales Store *</label>
                      <select 
                        value={selectedSalesStoreId}
                        onChange={(e) => setSelectedSalesStoreId(e.target.value)}
                        className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 cursor-pointer"
                        required
                      >
                        <option value="">Select destination sales store...</option>
                        {salesStores.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Transfer Date & Batch Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-forest block">Transfer Date *</label>
                      <input 
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 cursor-pointer"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-forest block">Source Batch Reference (Optional)</label>
                      <select 
                        value={selectedBatchRef}
                        onChange={(e) => setSelectedBatchRef(e.target.value)}
                        className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 cursor-pointer"
                      >
                        <option value="">FIFO (Oldest batches first)</option>
                        {Array.from(new Set(rawStockData.map(s => s.batch_reference).filter(Boolean))).map(batch => (
                          <option key={batch} value={batch}>Batch: {batch}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Egg size={18} className="text-brand-forest" />
                      <span className="text-xs font-extrabold text-brand-forest">Select Transfer Mode:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferMode("eggs_multi")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          transferMode === "eggs_multi"
                            ? "bg-brand-forest text-white border-brand-forest shadow-xs"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        Egg Color Multi-Category
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferMode("single_product")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          transferMode === "single_product"
                            ? "bg-brand-forest text-white border-brand-forest shadow-xs"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        Single Product
                      </button>
                    </div>
                  </div>

                  {/* MULTI-CATEGORY EGG QUALITY TRANSFER PANEL */}
                  {transferMode === "eggs_multi" ? (
                    <div className="space-y-4">
                      
                      {/* Egg Color Family Picker */}
                      <div className="flex items-center justify-between gap-4 bg-brand-sage/10 p-3 rounded-2xl border border-brand-sage/30">
                        <span className="text-xs font-bold text-brand-forest">Select Egg Color Family:</span>
                        <div className="flex items-center gap-2">
                          {[
                            { code: "WHT", label: "White Eggs" },
                            { code: "CRM", label: "Cream Eggs" },
                            { code: "BRN", label: "Brown Eggs" }
                          ].map(color => (
                            <button
                              key={color.code}
                              type="button"
                              onClick={() => setEggColorFamily(color.code as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                eggColorFamily === color.code
                                  ? "bg-brand-yellow text-brand-forest border-brand-yellow shadow-sm scale-105"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {color.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 5 Quality Classes Input Table Matrix */}
                      <div className="border border-brand-sage/40 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <div className="bg-brand-forest text-white px-4 py-3 flex items-center justify-between text-xs font-extrabold">
                          <span>Quality Category</span>
                          <span>Available Stock in Store</span>
                          <span>Transfer Trays & Eggs</span>
                        </div>

                        <div className="divide-y divide-gray-150">
                          {qualityCategories.map(cat => {
                            const prod = getProductForQuality(cat.key);
                            const availTrays = getAvailableStockForProduct(prod?.id);
                            const availDisplay = formatTraysAndEggsDisplay(availTrays);
                            const inp = categoryInputs[cat.key] || { trays: "", eggs: "" };
                            const enteredQty = getEnteredQtyForCategory(cat.key);
                            const isOver = enteredQty > availTrays + 0.001;

                            return (
                              <div key={cat.key} className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isOver ? "bg-red-50/70" : "hover:bg-gray-50/50"}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${cat.badgeClass} text-[8.5px] font-black uppercase px-2 py-0.5`}>
                                      {cat.label}
                                    </Badge>
                                    <span className="text-[10px] font-mono font-bold text-gray-500">
                                      ({prod?.code || "N/A"})
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs font-mono font-bold text-gray-700">
                                  {isLoadingStock ? (
                                    <span className="text-gray-400 italic">Checking...</span>
                                  ) : (
                                    <span>{availDisplay}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number"
                                      step="1"
                                      min="0"
                                      placeholder="Trays"
                                      value={inp.trays}
                                      onChange={(e) => handleCategoryInputChange(cat.key, "trays", e.target.value)}
                                      className={`w-20 h-9 px-2.5 text-xs font-black font-mono rounded-xl border text-center focus:outline-none ${
                                        isOver ? "border-red-500 bg-red-100 text-red-900" : "border-gray-300 bg-white text-gray-800"
                                      }`}
                                    />
                                    <span className="text-[10px] font-bold text-gray-500">Trays</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="29"
                                      placeholder="Eggs"
                                      value={inp.eggs}
                                      onChange={(e) => handleCategoryInputChange(cat.key, "eggs", e.target.value)}
                                      className={`w-16 h-9 px-2 text-xs font-black font-mono rounded-xl border text-center focus:outline-none ${
                                        isOver ? "border-red-500 bg-red-100 text-red-900" : "border-gray-300 bg-white text-gray-800"
                                      }`}
                                    />
                                    <span className="text-[10px] font-bold text-gray-500">Eggs</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {isMultiError && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-600 shrink-0" />
                          <span>Error: One or more requested category quantities exceed available production store stock.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SINGLE PRODUCT TRANSFER PANEL */
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-forest block">Select Single Product *</label>
                        <select 
                          value={singleProductId}
                          onChange={(e) => setSingleProductId(e.target.value)}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 cursor-pointer"
                          required
                        >
                          <option value="">Select product...</option>
                          {allProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                          ))}
                        </select>
                      </div>

                      {selectedSingleProduct && (
                        <div className="p-3 bg-brand-sage/20 rounded-xl flex items-center justify-between text-xs font-bold text-brand-forest">
                          <span>Available Stock:</span>
                          <span className="font-mono text-sm">{formatTraysAndEggsDisplay(singleAvailable)}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-forest block">Quantity to Transfer *</label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={singleQty}
                          onChange={(e) => setSingleQty(e.target.value)}
                          className="w-full text-xs font-bold border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Internal Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block">Internal Handling Notes</label>
                    <input 
                      type="text"
                      placeholder="Special handling instructions, driver details, packaging instructions..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-sm font-black gap-2 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl shadow-md cursor-pointer border-none" 
                      isLoading={isLoading}
                      disabled={isMultiError || (transferMode === "eggs_multi" && totalEnteredTraysMulti === 0) || (transferMode === "single_product" && singleEnteredQty <= 0)}
                    >
                      <ArrowRightLeft size={18} />
                      <span>Execute Multi-Category Transfer</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Live Valuation & Summary Sidebar */}
          <div className="space-y-6">
            
            <Card className="border-none shadow-xl bg-brand-forest text-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-5">
                <CardTitle className="text-xs font-bold tracking-wider uppercase text-brand-yellow font-heading flex items-center gap-2">
                  <Calculator size={15} />
                  Transfer Valuation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Estimated Total Transfer Value</p>
                  <h3 className="text-3xl font-black font-heading text-white">
                    UGX {(transferMode === "eggs_multi" ? totalValuationUGXMulti : singleValuationUGX).toLocaleString()}
                  </h3>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3 text-xs font-body">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Quantity:</span>
                    <span className="font-extrabold text-white text-right">
                      {transferMode === "eggs_multi" 
                        ? formatTraysAndEggsDisplay(totalEnteredTraysMulti)
                        : `${singleEnteredQty} ${selectedSingleProduct?.unit_of_measure || 'units'}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Categories Selected:</span>
                    <span className="font-bold text-white">
                      {transferMode === "eggs_multi"
                        ? qualityCategories.filter(cat => getEnteredQtyForCategory(cat.key) > 0).length
                        : singleEnteredQty > 0 ? 1 : 0} Item(s)
                    </span>
                  </div>
                </div>

                {/* Package Yield Estimates if eggs */}
                {transferMode === "eggs_multi" && totalEnteredTraysMulti > 0 && (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <p className="text-[10px] text-brand-yellow uppercase font-bold tracking-wider">Retail Packaging Estimates</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-[8px] text-white/60 font-bold uppercase">Single Packs</p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {Math.floor(totalEnteredTraysMulti).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-[8px] text-white/60 font-bold uppercase">15-Packs</p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {(Math.floor(totalEnteredTraysMulti) * 2).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-[8px] text-white/60 font-bold uppercase">6-Packs</p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {(Math.floor(totalEnteredTraysMulti) * 5).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Helper Guidance */}
            <div className="space-y-4 font-body">
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Calendar size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">Multi-Category Batch Routing</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">All 5 egg quality classes (Good, D1, D2, D3, Shells) are transferred together in 1 single transaction click.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Layers size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">Loose Eggs & Trays Support</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Enter quantities as whole trays (30 eggs) and loose individual eggs for maximum farm accuracy.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
