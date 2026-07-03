"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowDownToLine, 
  ChevronLeft, 
  Package, 
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/store/useAuth";

const intakeSchema = z.object({
  production_store_id: z.string().min(1, "Production store is required"),
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().min(0).optional(),
  intake_date: z.string(),
  valuation_price: z.number().min(0, "Valuation price must be >= 0"),
  batch_number: z.string().optional(),
  notes: z.string().optional(),
  good_stacks: z.number().min(0).optional(),
  good_extra_trays: z.number().min(0).optional(),
  good_extra_eggs: z.number().min(0).optional(),
  d1_trays: z.number().min(0).optional(),
  d1_extra_eggs: z.number().min(0).optional(),
  d2_trays: z.number().min(0).optional(),
  d2_extra_eggs: z.number().min(0).optional(),
  d3_trays: z.number().min(0).optional(),
  d3_extra_eggs: z.number().min(0).optional(),
  shell_trays: z.number().min(0).optional(),
  shell_extra_eggs: z.number().min(0).optional(),
  good_valuation_price: z.number().min(0).optional(),
  d1_valuation_price: z.number().min(0).optional(),
  d2_valuation_price: z.number().min(0).optional(),
  d3_valuation_price: z.number().min(0).optional(),
  shell_valuation_price: z.number().min(0).optional(),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export default function ProductionIntakePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productionStores, setProductionStores] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, storeRes] = await Promise.all([
          api.get("/products"),
          api.get("/production-stores")
        ]);
        setProducts(prodRes.data.data || []);
        setProductionStores(storeRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch products or stores", err);
      }
    };
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      intake_date: new Date().toISOString().split("T")[0],
      valuation_price: 0,
      good_stacks: 0,
      good_extra_trays: 0,
      good_extra_eggs: 0,
      d1_trays: 0,
      d1_extra_eggs: 0,
      d2_trays: 0,
      d2_extra_eggs: 0,
      d3_trays: 0,
      d3_extra_eggs: 0,
      shell_trays: 0,
      shell_extra_eggs: 0,
      good_valuation_price: 0,
      d1_valuation_price: 0,
      d2_valuation_price: 0,
      d3_valuation_price: 0,
      shell_valuation_price: 0,
    },
  });

  const watchProductId = watch("product_id");
  const watchQty = watch("quantity") || 0;
  const watchPrice = watch("valuation_price") || 0;
  const watchBatch = watch("batch_number") || "";
  const watchGoodStacks = watch("good_stacks") || 0;
  const watchGoodExtraTrays = watch("good_extra_trays") || 0;
  const watchGoodExtraEggs = watch("good_extra_eggs") || 0;
  const watchD1Trays = watch("d1_trays") || 0;
  const watchD1ExtraEggs = watch("d1_extra_eggs") || 0;
  const watchD2Trays = watch("d2_trays") || 0;
  const watchD2ExtraEggs = watch("d2_extra_eggs") || 0;
  const watchD3Trays = watch("d3_trays") || 0;
  const watchD3ExtraEggs = watch("d3_extra_eggs") || 0;
  const watchShellTrays = watch("shell_trays") || 0;
  const watchShellExtraEggs = watch("shell_extra_eggs") || 0;

  const watchGoodValuationPrice = watch("good_valuation_price") || 0;
  const watchD1ValuationPrice = watch("d1_valuation_price") || 0;
  const watchD2ValuationPrice = watch("d2_valuation_price") || 0;
  const watchD3ValuationPrice = watch("d3_valuation_price") || 0;
  const watchShellValuationPrice = watch("shell_valuation_price") || 0;
  
  const lastProductIdRef = React.useRef("");

  useEffect(() => {
    if (productionStores.length > 0) {
      setValue("production_store_id", productionStores[0].id);
    }
  }, [productionStores, setValue]);

  const allowedIntakeCodes = ["EGG-WHT", "EGG-BRN", "EGG-CRM", "POU-DRS", "POU-LVE", "BY-MNR"];
  const filteredProducts = products.filter((p) => allowedIntakeCodes.includes(p.code));

  useEffect(() => {
    if (watchProductId && products.length > 0 && watchProductId !== lastProductIdRef.current) {
      const selected = products.find((p) => p.id === watchProductId);
      if (selected) {
        const basePrice = parseFloat(selected.default_unit_price) || 0;
        setValue("valuation_price", basePrice);
        setValue("good_valuation_price", basePrice);

        const d1Prod = products.find(p => p.code === `${selected.code}-D1`);
        const d2Prod = products.find(p => p.code === `${selected.code}-D2`);
        const d3Prod = products.find(p => p.code === `${selected.code}-D3`);
        const shlProd = products.find(p => p.code === `${selected.code}-SHL`);

        setValue("d1_valuation_price", d1Prod ? parseFloat(d1Prod.default_unit_price) : 5000);
        setValue("d2_valuation_price", d2Prod ? parseFloat(d2Prod.default_unit_price) : 3000);
        setValue("d3_valuation_price", d3Prod ? parseFloat(d3Prod.default_unit_price) : 0);
        setValue("shell_valuation_price", shlProd ? parseFloat(shlProd.default_unit_price) : 2000);

        lastProductIdRef.current = watchProductId;
      }
    }
  }, [watchProductId, products, setValue]);

  const selectedProduct = filteredProducts.find((p) => p.id === watchProductId);
  const isEggProduct = selectedProduct && ["EGG-WHT", "EGG-BRN", "EGG-CRM"].includes(selectedProduct.code);

  const getCalculatedTrays = () => {
    const goodTrays = watchGoodStacks * 30 + watchGoodExtraTrays + watchGoodExtraEggs / 30;
    const d1Trays = watchD1Trays + watchD1ExtraEggs / 30;
    const d2Trays = watchD2Trays + watchD2ExtraEggs / 30;
    const d3Trays = watchD3Trays + watchD3ExtraEggs / 30;
    const shellTrays = watchShellTrays + watchShellExtraEggs / 30;
    
    return {
      good: goodTrays,
      d1: d1Trays,
      d2: d2Trays,
      d3: d3Trays,
      shell: shellTrays,
      total: goodTrays + d1Trays + d2Trays + d3Trays + shellTrays
    };
  };

  const calculated = getCalculatedTrays();
  const calculatedQty = isEggProduct ? calculated.total : watchQty;

  const getCalculatedValuation = () => {
    if (!isEggProduct) {
      return watchQty * watchPrice;
    }
    const goodVal = calculated.good * watchGoodValuationPrice;
    const d1Val = calculated.d1 * watchD1ValuationPrice;
    const d2Val = calculated.d2 * watchD2ValuationPrice;
    const d3Val = calculated.d3 * watchD3ValuationPrice;
    const shellVal = calculated.shell * watchShellValuationPrice;
    return goodVal + d1Val + d2Val + d3Val + shellVal;
  };

  const estimatedValue = getCalculatedValuation();

  const onSubmit = async (data: IntakeFormValues) => {
    if (!isEggProduct && (!data.quantity || data.quantity <= 0)) {
      alert("Quantity received is required for non-egg products.");
      return;
    }

    if (isEggProduct) {
      data.valuation_price = data.good_valuation_price || 0;
    }
    
    setIsLoading(true);
    try {
      await api.post("/production-intakes", data);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        if (user?.role === "order_manager") {
          router.push("/order-manager");
        } else {
          router.push("/production-store");
        }
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save intake record. Please check validation errors.");
      setIsLoading(false);
    }
  };

  const productOptions = filteredProducts.map((p) => ({
    label: `${p.name} (Code: ${p.code})`,
    value: p.id,
  }));

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={64} className="animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-forest font-heading">Intake Recorded!</h2>
            <p className="text-gray-500 mt-2 font-body">Production stock has been updated successfully.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-forest flex items-center justify-center h-10 w-10 hover:bg-brand-sage/20 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record Product Intake</h1>
            <p className="text-gray-500 font-body">Log new products arriving from the poultry farm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-brand-sage/20 border-b border-brand-sage flex flex-row items-center gap-3 py-5 px-6">
                 <ArrowDownToLine className="text-brand-forest" size={24} />
                 <div>
                   <CardTitle className="text-lg font-heading text-brand-forest font-bold">Intake Details</CardTitle>
                   <CardDescription className="text-xs">Specify the bulk inventory product quantity and override active valuation</CardDescription>
                 </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Destination Production Store"
                    options={productionStores.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))}
                    {...register("production_store_id")}
                    error={errors.production_store_id?.message}
                    required
                  />
                  <Input
                    label="Intake Date"
                    type="date"
                    {...register("intake_date")}
                    error={errors.intake_date?.message}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Select
                    label="Product Type"
                    options={productOptions}
                    {...register("product_id")}
                    error={errors.product_id?.message}
                    required
                  />
                </div>

                {isEggProduct ? (
                  <div className="space-y-6 border border-brand-sage/40 p-5 rounded-2xl bg-gray-50/50">
                    <h3 className="text-xs font-black text-brand-forest uppercase tracking-wider border-b border-brand-sage/30 pb-2">
                      Detailed Egg Intake Breakdown
                    </h3>
                    
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-brand-forest uppercase">1. Good Eggs</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Good Stacks (30 trays)" type="number" placeholder="0" {...register("good_stacks", { valueAsNumber: true })} error={errors.good_stacks?.message} />
                        <Input label="Extra Good Trays" type="number" placeholder="0" {...register("good_extra_trays", { valueAsNumber: true })} error={errors.good_extra_trays?.message} />
                        <Input label="Extra Good Eggs" type="number" placeholder="0" {...register("good_extra_eggs", { valueAsNumber: true })} error={errors.good_extra_eggs?.message} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          label="Good Eggs Valuation Price (UGX) Per Tray" 
                          type="number" 
                          placeholder="12000" 
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
                          {...register("good_valuation_price", { valueAsNumber: true })} 
                          error={errors.good_valuation_price?.message} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-bold text-brand-forest uppercase">2. Damaged Eggs (Classes)</h4>
                      <div className="p-3 bg-white rounded-xl border border-brand-sage/20 space-y-2">
                        <span className="text-[10px] font-bold text-brand-forest uppercase block font-heading">Class 1 Damages (Small cracks/poop/blood - Sellable)</span>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="D1 Trays" type="number" placeholder="0" {...register("d1_trays", { valueAsNumber: true })} error={errors.d1_trays?.message} />
                          <Input label="D1 Extra Eggs" type="number" placeholder="0" {...register("d1_extra_eggs", { valueAsNumber: true })} error={errors.d1_extra_eggs?.message} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                            label="D1 Valuation Price (UGX) Per Tray" 
                            type="number" 
                            placeholder="5000" 
                            readOnly={!isAdmin}
                            className={!isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
                            {...register("d1_valuation_price", { valueAsNumber: true })} 
                            error={errors.d1_valuation_price?.message} 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-brand-sage/20 space-y-2">
                        <span className="text-[10px] font-bold text-brand-forest uppercase block font-heading">Class 2 Damages (Deep cracks/visible yolk - Sellable)</span>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="D2 Trays" type="number" placeholder="0" {...register("d2_trays", { valueAsNumber: true })} error={errors.d2_trays?.message} />
                          <Input label="D2 Extra Eggs" type="number" placeholder="0" {...register("d2_extra_eggs", { valueAsNumber: true })} error={errors.d2_extra_eggs?.message} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                            label="D2 Valuation Price (UGX) Per Tray" 
                            type="number" 
                            placeholder="3000" 
                            readOnly={!isAdmin}
                            className={!isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
                            {...register("d2_valuation_price", { valueAsNumber: true })} 
                            error={errors.d2_valuation_price?.message} 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-brand-sage/20 space-y-2">
                        <span className="text-[10px] font-bold text-red-650 uppercase block font-heading">Class 3 Damages (Severely cracked/rotten - Waste)</span>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="D3 Trays" type="number" placeholder="0" {...register("d3_trays", { valueAsNumber: true })} error={errors.d3_trays?.message} />
                          <Input label="D3 Extra Eggs" type="number" placeholder="0" {...register("d3_extra_eggs", { valueAsNumber: true })} error={errors.d3_extra_eggs?.message} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="D3 Valuation Price (UGX) Per Tray" type="number" disabled placeholder="0" {...register("d3_valuation_price", { valueAsNumber: true })} error={errors.d3_valuation_price?.message} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-bold text-brand-forest uppercase">3. Shell Eggs (Empty shells)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Shell Trays" type="number" placeholder="0" {...register("shell_trays", { valueAsNumber: true })} error={errors.shell_trays?.message} />
                        <Input label="Shell Extra Eggs" type="number" placeholder="0" {...register("shell_extra_eggs", { valueAsNumber: true })} error={errors.shell_extra_eggs?.message} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          label="Shell Valuation Price (UGX) Per Tray" 
                          type="number" 
                          placeholder="2000" 
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
                          {...register("shell_valuation_price", { valueAsNumber: true })} 
                          error={errors.shell_valuation_price?.message} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    <Input label="Quantity Received" type="number" step="0.01" placeholder="0.00" {...register("quantity", { valueAsNumber: true })} error={errors.quantity?.message} required />
                  </div>
                )}
 
                {!isEggProduct && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Valuation Price (UGX) Per Tray" 
                      type="number" 
                      step="1" 
                      placeholder="0" 
                      readOnly={!isAdmin}
                      className={!isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
                      {...register("valuation_price", { valueAsNumber: true })} 
                      error={errors.valuation_price?.message} 
                      required 
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Batch Number" placeholder="e.g. B-0516-A" {...register("batch_number")} />
                  <Input label="Notes / Observations" placeholder="Any quality notes or specific details..." {...register("notes")} />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-12 text-base font-bold gap-2.5 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl shadow-md cursor-pointer border-none" isLoading={isLoading}>
                    <Save size={18} />
                    Save Intake Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-brand-forest text-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-5">
                <CardTitle className="text-xs font-bold tracking-wider uppercase text-brand-yellow font-heading">Live Valuation Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Estimated Batch Value</p>
                  <h3 className="text-3xl font-black font-heading text-white">
                    UGX {Math.round(estimatedValue).toLocaleString()}
                  </h3>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3.5 text-xs font-body">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-white/60">Product:</span>
                    <span className="font-bold text-white text-right">{selectedProduct?.name || "None Selected"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Quantity:</span>
                    <span className="font-bold text-white">
                      {isEggProduct ? `${calculatedQty.toFixed(2)} Trays` : `${calculatedQty.toLocaleString()} ${selectedProduct?.unit_of_measure || ""}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Valuation Rate:</span>
                    <span className="font-bold text-brand-yellow">
                      {isEggProduct ? "Various / Category" : `UGX ${watchPrice.toLocaleString()} / unit`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Batch No:</span>
                    <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{watchBatch || "N/A"}</span>
                  </div>
                </div>

                {isEggProduct && (
                  <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs font-body">
                    <div className="flex justify-between items-center text-brand-yellow font-black">
                      <span>Total Intake Trays:</span>
                      <span>{calculated.total.toFixed(2)} Trays</span>
                    </div>
                    <div className="pl-2 space-y-1 text-[11px] text-white/80">
                      <div className="flex justify-between">
                        <span>- Good Trays:</span>
                        <span>{calculated.good.toFixed(2)} Trays <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchGoodValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Class 1 Damages:</span>
                        <span>{calculated.d1.toFixed(2)} Trays <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchD1ValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Class 2 Damages:</span>
                        <span>{calculated.d2.toFixed(2)} Trays <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchD2ValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between text-red-300">
                        <span>- Class 3 Damages (Waste):</span>
                        <span>{calculated.d3.toFixed(2)} Trays <span className="text-[10px] text-red-400 font-mono">(UGX 0/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Shell Eggs:</span>
                        <span>{calculated.shell.toFixed(2)} Trays <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchShellValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Calendar size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">Immediate Logging</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-body">Intakes must be logged directly upon arrival from the farm to ensure accurate snapshot balance reports.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-md border border-brand-sage/40 flex gap-3 items-start">
                <Layers size={18} className="text-brand-mid mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-forest font-heading">FIFO Quality Batches</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-body">Unique batch identifiers help coordinate FIFO (First In, First Out) routing, minimizing farm egg aging.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
