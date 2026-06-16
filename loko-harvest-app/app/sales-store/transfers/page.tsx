"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowRightLeft, 
  ChevronLeft, 
  Warehouse,
  ArrowRight,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Calculator
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/api";

const transferSchema = z.object({
  production_store_id: z.string().min(1, "Source production store is required"),
  sales_store_id: z.string().min(1, "Target sales store is required"),
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().min(0.01, "Quantity must be > 0"),
  transfer_date: z.string(),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function StockTransferPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [productionStores, setProductionStores] = useState<any[]>([]);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transfer_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchProductionStoreId = watch("production_store_id");
  const watchSalesStoreId = watch("sales_store_id");
  const selectedProductId = watch("product_id");
  const selectedProduct = productsList.find(p => p.value === selectedProductId);
  const watchQty = watch("quantity") || 0;

  // Load stores on mount
  useEffect(() => {
    const loadStores = async () => {
      setIsLoadingStores(true);
      try {
        const [prodStoresRes, salesStoresRes] = await Promise.all([
          api.get('/production-stores'),
          api.get('/sales-stores')
        ]);
        
        const prodData = prodStoresRes.data.data || [];
        const salesData = salesStoresRes.data.data || [];
        
        setProductionStores(prodData);
        setSalesStores(salesData);

        if (prodData.length > 0) {
          setValue("production_store_id", prodData[0].id);
        }
        if (salesData.length > 0) {
          setValue("sales_store_id", salesData[0].id);
        }
      } catch (err) {
        console.error("Failed to load stores", err);
      } finally {
        setIsLoadingStores(false);
      }
    };
    loadStores();
  }, [setValue]);

  // Load product stock when production store changes
  useEffect(() => {
    if (!watchProductionStoreId) {
      setProductsList([]);
      return;
    }
    
    const loadProductionStock = async () => {
      setIsLoadingData(true);
      try {
        const res = await api.get('/production-stock', {
          params: { production_store_id: watchProductionStoreId }
        });
        const stockData = res.data.data || [];
        
        // Aggregate by product to handle different batches
        const aggregated: { [key: string]: { name: string; available: number; unit: string; rate: number } } = {};
        stockData.forEach((item: any) => {
          const prodId = item.product_id;
          const qty = parseFloat(item.current_quantity) || 0;
          const price = parseFloat(item.valuation_price) || parseFloat(item.product.default_unit_price) || 0;
          if (aggregated[prodId]) {
            aggregated[prodId].available += qty;
          } else {
            aggregated[prodId] = {
              name: item.product.name,
              available: qty,
              unit: item.product.unit_of_measure === 'trays' ? 'Trays' : item.product.unit_of_measure === 'units' ? 'Units' : 'Kg',
              rate: price
            };
          }
        });
        
        const list = Object.keys(aggregated).map((prodId) => ({
          value: prodId,
          label: `${aggregated[prodId].name}`,
          available: aggregated[prodId].available,
          unit: aggregated[prodId].unit,
          rate: aggregated[prodId].rate
        }));
        setProductsList(list);
        
        // Reset product selection if previous product is not in the new store list
        if (selectedProductId && !list.find(p => p.value === selectedProductId)) {
          setValue("product_id", "");
        }
      } catch (err) {
        console.error("Failed to load production stock", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadProductionStock();
  }, [watchProductionStoreId, setValue]);

  const getTransferPreview = () => {
    if (!selectedProduct) return null;
    const qty = watchQty;
    const isEggs = selectedProduct.label.toLowerCase().includes("egg");
    const isCreamOrWhite = selectedProduct.label.toLowerCase().includes("cream") || selectedProduct.label.toLowerCase().includes("white");
    const isBrown = selectedProduct.label.toLowerCase().includes("brown");
    
    if (isEggs && isCreamOrWhite) {
      return {
        singlePacks: qty,
        pack15: qty * 2,
        pack6: qty * 5,
        eggsCount: qty * 30,
        plainTrays: 0
      };
    } else if (isEggs && isBrown) {
      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggsCount: qty * 30,
        plainTrays: qty
      };
    }
    return null;
  };

  const onSubmit = async (data: TransferFormValues) => {
    setIsLoading(true);
    try {
      await api.post("/store-transfers", {
        production_store_id: data.production_store_id,
        sales_store_id: data.sales_store_id,
        product_id: data.product_id,
        quantity: data.quantity,
        transfer_date: data.transfer_date,
        notes: data.notes || `Transfer to Sales Store`
      });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/sales-store"), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process stock transfer. Please check stock balances.");
      setIsLoading(false);
    }
  };

  const transferPreview = getTransferPreview();

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={64} className="animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-forest font-heading">Transfer Successful!</h2>
            <p className="text-gray-500 mt-2 font-body">Stock has been moved to the Sales Store.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-forest flex items-center justify-center h-10 w-10 hover:bg-brand-sage/20 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Stock Transfer</h1>
            <p className="text-gray-500 font-body">Move products from Production to Sales Store</p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Column */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-brand-sage/20 border-b border-brand-sage pb-6">
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-brand-forest">
                    <Warehouse size={24} />
                  </div>
                  <span className="text-xs font-bold text-brand-forest uppercase tracking-wider">Production</span>
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
            <CardContent className="pt-8 px-6 pb-6">
              {isLoadingStores ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-forest"></div>
                  <p className="text-xs text-gray-400 font-semibold">Loading facilities...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Store Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Source Production Store"
                      options={productionStores.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                      {...register("production_store_id")}
                      error={errors.production_store_id?.message}
                      required
                    />
                    <Select
                      label="Destination Sales Store"
                      options={salesStores.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                      {...register("sales_store_id")}
                      error={errors.sales_store_id?.message}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Product to Transfer"
                      options={productsList}
                      {...register("product_id")}
                      error={errors.product_id?.message}
                      disabled={isLoadingData || !watchProductionStoreId}
                      required
                    />
                    <Input
                      label="Transfer Date"
                      type="date"
                      {...register("transfer_date")}
                      error={errors.transfer_date?.message}
                      required
                    />
                  </div>

                  {isLoadingData ? (
                    <div className="p-4 bg-brand-sage/10 rounded-xl flex items-center justify-center gap-2 border border-dashed border-brand-sage">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-brand-forest"></div>
                      <span className="text-xs text-brand-forest font-semibold">Loading product stock...</span>
                    </div>
                  ) : selectedProduct ? (
                    <div className="p-4 bg-brand-sage/30 rounded-xl flex items-center justify-between border border-brand-sage">
                      <div className="flex items-center gap-3">
                        <Info size={18} className="text-brand-forest" />
                        <span className="text-sm font-medium text-brand-forest">Current Production Stock in Selected Store:</span>
                      </div>
                      <span className="text-lg font-bold text-brand-forest">
                        {selectedProduct.available.toLocaleString()} {selectedProduct.unit}
                      </span>
                    </div>
                  ) : watchProductionStoreId && productsList.length === 0 ? (
                    <div className="p-4 bg-yellow-50 rounded-xl text-center text-xs text-yellow-700 font-semibold border border-yellow-200">
                      ⚠️ No active stock found in the selected production store. Please log harvest intake first.
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Quantity to Move"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("quantity", { valueAsNumber: true })}
                      error={errors.quantity?.message}
                      required
                    />
                    <Input
                      label="Internal Notes"
                      placeholder="Handling or transfer instructions..."
                      {...register("notes")}
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-bold gap-2.5 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl shadow-md cursor-pointer" 
                      isLoading={isLoading}
                      disabled={selectedProduct && watchQty > selectedProduct.available}
                    >
                      <ArrowRightLeft size={18} />
                      Execute Transfer
                    </Button>
                    {selectedProduct && watchQty > selectedProduct.available && (
                      <p className="text-center text-xs text-red-500 font-medium mt-3">
                        Error: Transfer quantity exceeds available production stock.
                      </p>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Live Conversion Sidebar */}
          <div className="space-y-6">
            
            {/* Live conversion estimator */}
            <Card className="border-none shadow-xl bg-brand-forest text-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-5">
                <CardTitle className="text-xs font-bold tracking-wider uppercase text-brand-yellow font-heading flex items-center gap-2">
                  <Calculator size={15} />
                  Transfer Valuation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Estimated Transfer Value</p>
                  <h3 className="text-3xl font-black font-heading text-white">
                    UGX {selectedProduct ? (watchQty * selectedProduct.rate).toLocaleString() : "0"}
                  </h3>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3.5 text-xs font-body">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-white/60">Selected Product:</span>
                    <span className="font-bold text-white text-right">{selectedProduct?.label || "None Selected"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Amount to Transfer:</span>
                    <span className="font-bold text-white">
                      {watchQty.toLocaleString()} <span className="text-[10px] text-white/50">{selectedProduct?.unit || ""}</span>
                    </span>
                  </div>
                </div>

                {/* Packaging preview if it is eggs */}
                {transferPreview && (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <p className="text-[10px] text-brand-yellow uppercase font-bold tracking-wider">Package Yield Estimates</p>
                    
                    {transferPreview.plainTrays > 0 ? (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                        <p className="text-[9px] text-white/60 font-bold uppercase">Plain Brown Trays</p>
                        <p className="text-base font-black text-white mt-1">
                          {transferPreview.plainTrays.toLocaleString()} <span className="text-[10px] font-normal text-white/60">Trays</span>
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-[8px] text-white/60 font-bold uppercase">Single Packs</p>
                          <p className="text-xs font-black text-white mt-0.5">
                            {transferPreview.singlePacks.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-[8px] text-white/60 font-bold uppercase">15-Packs</p>
                          <p className="text-xs font-black text-white mt-0.5">
                            {transferPreview.pack15.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-[8px] text-white/60 font-bold uppercase">6-Packs</p>
                          <p className="text-xs font-black text-white mt-0.5">
                            {transferPreview.pack6.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-[9px] text-white/40 text-center italic mt-1 font-medium">
                      Yield calculated from {transferPreview.eggsCount.toLocaleString()} total eggs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Helper Guidance */}
            <div className="space-y-4 font-body">
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Calendar size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">Auto-Deductions</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Deductions are automatically routed from the oldest production stock batches first (FIFO).</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Layers size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">Carton Conversion</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Bulk trays are repacked inside Sales into Single, 15-pack, or 6-pack cartons for dispatching.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
