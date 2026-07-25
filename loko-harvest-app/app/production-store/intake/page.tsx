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
  DollarSign,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/store/useAuth";

const optionalNumeric = z.any()
  .transform((val): number => {
    if (val === "" || val === undefined || val === null || val === "NaN" || (typeof val === "number" && isNaN(val))) {
      return 0;
    }
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  });

const todayStr = new Date().toISOString().split('T')[0];

const intakeSchema = z.object({
  production_store_id: z.string().min(1, "Production store is required"),
  product_id: z.string().min(1, "Product is required"),
  quantity: z.any()
    .transform((val): number | undefined => {
      if (val === "" || val === undefined || val === null || val === "NaN" || (typeof val === "number" && isNaN(val))) {
        return undefined;
      }
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : Math.max(0, parsed);
    }),
  intake_date: z.string().refine((date) => date <= todayStr, {
    message: "Intake date cannot be in the future",
  }),
  valuation_price: optionalNumeric,
  batch_number: z.string().max(50, "Batch number cannot exceed 50 characters")
    .refine((val) => !val || /^[A-Za-z0-9\-_]+$/.test(val), {
      message: "Batch number can only contain letters, numbers, hyphens, and underscores",
    })
    .optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  good_stacks: optionalNumeric,
  good_extra_trays: optionalNumeric,
  good_extra_eggs: optionalNumeric,
  d1_trays: optionalNumeric,
  d1_extra_eggs: optionalNumeric,
  d2_trays: optionalNumeric,
  d2_extra_eggs: optionalNumeric,
  d3_trays: optionalNumeric,
  d3_extra_eggs: optionalNumeric,
  shell_trays: optionalNumeric,
  shell_extra_eggs: optionalNumeric,
  good_valuation_price: optionalNumeric,
  good_egg_valuation_price: optionalNumeric,
  d1_valuation_price: optionalNumeric,
  d1_egg_valuation_price: optionalNumeric,
  d2_valuation_price: optionalNumeric,
  d2_egg_valuation_price: optionalNumeric,
  d3_valuation_price: optionalNumeric,
  d3_egg_valuation_price: optionalNumeric,
  shell_valuation_price: optionalNumeric,
  shell_egg_valuation_price: optionalNumeric,
});

type IntakeFormValues = {
  production_store_id: string;
  product_id: string;
  quantity?: number;
  intake_date: string;
  valuation_price: number;
  batch_number?: string;
  notes?: string;
  good_stacks?: number;
  good_extra_trays?: number;
  good_extra_eggs?: number;
  d1_trays?: number;
  d1_extra_eggs?: number;
  d2_trays?: number;
  d2_extra_eggs?: number;
  d3_trays?: number;
  d3_extra_eggs?: number;
  shell_trays?: number;
  shell_extra_eggs?: number;
  good_valuation_price?: number;
  good_egg_valuation_price?: number;
  d1_valuation_price?: number;
  d1_egg_valuation_price?: number;
  d2_valuation_price?: number;
  d2_egg_valuation_price?: number;
  d3_valuation_price?: number;
  d3_egg_valuation_price?: number;
  shell_valuation_price?: number;
  shell_egg_valuation_price?: number;
};

const formatQuantityGlobal = (qty: number, unit: string, isBaseEgg: boolean = false) => {
  const val = isNaN(qty) ? 0 : qty;
  if (unit.toLowerCase() === "trays") {
    if (isBaseEgg) {
      const stacks = Math.floor(val / 30);
      const trays = Math.floor(val % 30);
      const eggs = Math.round((val - Math.floor(val)) * 30);
      
      const parts = [];
      if (stacks > 0) parts.push(`${stacks} Stacks`);
      if (trays > 0 || (stacks === 0 && eggs === 0)) parts.push(`${trays} Trays`);
      if (eggs > 0) parts.push(`${eggs} Eggs`);
      return parts.join(", ");
    } else {
      const trays = Math.floor(val);
      const decimal = val - trays;
      const eggs = Math.round(decimal * 30);
      return `${trays} Trays & ${eggs} Eggs`;
    }
  }
  return `${val.toLocaleString()} ${unit}`;
};

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
    resolver: zodResolver(intakeSchema as any),
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
      good_egg_valuation_price: 0,
      d1_valuation_price: 0,
      d1_egg_valuation_price: 0,
      d2_valuation_price: 0,
      d2_egg_valuation_price: 0,
      d3_valuation_price: 0,
      d3_egg_valuation_price: 0,
      shell_valuation_price: 0,
      shell_egg_valuation_price: 0,
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
  const watchGoodEggValuationPrice = watch("good_egg_valuation_price") || 0;
  const watchD1ValuationPrice = watch("d1_valuation_price") || 0;
  const watchD1EggValuationPrice = watch("d1_egg_valuation_price") || 0;
  const watchD2ValuationPrice = watch("d2_valuation_price") || 0;
  const watchD2EggValuationPrice = watch("d2_egg_valuation_price") || 0;
  const watchD3ValuationPrice = watch("d3_valuation_price") || 0;
  const watchD3EggValuationPrice = watch("d3_egg_valuation_price") || 0;
  const watchShellValuationPrice = watch("shell_valuation_price") || 0;
  const watchShellEggValuationPrice = watch("shell_egg_valuation_price") || 0;
  
  const lastProductIdRef = React.useRef("");
  const [existingBatches, setExistingBatches] = useState<string[]>([]);
  const [batchSource, setBatchSource] = useState<'existing' | 'new'>('new');
  const watchStoreId = watch("production_store_id");

  useEffect(() => {
    if (productionStores.length > 0) {
      setValue("production_store_id", productionStores[0].id);
    }
  }, [productionStores, setValue]);

  useEffect(() => {
    if (!watchStoreId) return;
    const fetchStoreStocks = async () => {
      try {
        const res = await api.get(`/production-stock?production_store_id=${watchStoreId}`);
        const stocks = res.data.data || [];
        const batches: string[] = Array.from(
          new Set(
            stocks
              .map((s: any) => s.batch_reference)
              .filter((b: any) => b && b.trim() !== "")
          )
        ) as string[];
        setExistingBatches(batches);
      } catch (err) {
        console.error("Failed to fetch store stocks for batch numbers", err);
      }
    };
    fetchStoreStocks();
  }, [watchStoreId]);

  useEffect(() => {
    if (existingBatches.length > 0) {
      setBatchSource('existing');
      setValue("batch_number", existingBatches[0]);
    } else {
      setBatchSource('new');
      setValue("batch_number", "");
    }
  }, [existingBatches, setValue]);

  const handleBatchSourceChange = (source: 'existing' | 'new') => {
    setBatchSource(source);
    if (source === 'existing' && existingBatches.length > 0) {
      setValue("batch_number", existingBatches[0]);
    } else {
      setValue("batch_number", "");
    }
  };

  const allowedIntakeCodes = ["EGG-WHT", "EGG-BRN", "EGG-CRM", "POU-DRS", "POU-LVE", "BY-MNR"];
  const filteredProducts = products.filter((p) => allowedIntakeCodes.includes(p.code));

  useEffect(() => {
    if (watchProductId && products.length > 0 && watchProductId !== lastProductIdRef.current) {
      const selected = products.find((p) => p.id === watchProductId);
      if (selected) {
        const basePrice = parseFloat(selected.production_unit_price) || 0;
        const eggBasePrice = parseFloat(selected.production_egg_unit_price) || 0;
        setValue("valuation_price", basePrice);
        setValue("good_valuation_price", basePrice);
        setValue("good_egg_valuation_price", eggBasePrice);
 
        const d1Prod = products.find(p => p.code === `${selected.code}-D1`);
        const d2Prod = products.find(p => p.code === `${selected.code}-D2`);
        const d3Prod = products.find(p => p.code === `${selected.code}-D3`);
        const shlProd = products.find(p => p.code === `${selected.code}-SHL`);
 
        setValue("d1_valuation_price", d1Prod ? (parseFloat(d1Prod.production_unit_price) || 0) : 0);
        setValue("d1_egg_valuation_price", d1Prod ? (parseFloat(d1Prod.production_egg_unit_price) || 0) : 0);
        setValue("d2_valuation_price", d2Prod ? (parseFloat(d2Prod.production_unit_price) || 0) : 0);
        setValue("d2_egg_valuation_price", d2Prod ? (parseFloat(d2Prod.production_egg_unit_price) || 0) : 0);
        setValue("d3_valuation_price", 0);
        setValue("d3_egg_valuation_price", 0);
        setValue("shell_valuation_price", shlProd ? (parseFloat(shlProd.production_unit_price) || 0) : 0);
        setValue("shell_egg_valuation_price", shlProd ? (parseFloat(shlProd.production_egg_unit_price) || 0) : 0);
 
        lastProductIdRef.current = watchProductId;
      }
    }
  }, [watchProductId, products, setValue]);

  const getMissingPriceDetails = () => {
    if (!watchProductId || products.length === 0) return [];
    const selected = products.find((p) => p.id === watchProductId);
    if (!selected) return [];
    
    const isEgg = ["EGG-WHT", "EGG-BRN", "EGG-CRM"].includes(selected.code);
    const missing = [];
    
    if (isEgg) {
      // Check base
      const basePrice = parseFloat(selected.production_unit_price) || 0;
      const eggBasePrice = parseFloat(selected.production_egg_unit_price) || 0;
      if (basePrice <= 0 || eggBasePrice <= 0) {
        missing.push(`${selected.name} (Base)`);
      }
      
      // Check D1
      const d1Prod = products.find(p => p.code === `${selected.code}-D1`);
      if (!d1Prod || (parseFloat(d1Prod.production_unit_price) || 0) <= 0 || (parseFloat(d1Prod.production_egg_unit_price) || 0) <= 0) {
        missing.push(`${selected.name} - Class 1 Damages (D1)`);
      }
      
      // Check D2
      const d2Prod = products.find(p => p.code === `${selected.code}-D2`);
      if (!d2Prod || (parseFloat(d2Prod.production_unit_price) || 0) <= 0 || (parseFloat(d2Prod.production_egg_unit_price) || 0) <= 0) {
        missing.push(`${selected.name} - Class 2 Damages (D2)`);
      }
      
      // Check SHL
      const shlProd = products.find(p => p.code === `${selected.code}-SHL`);
      if (!shlProd || (parseFloat(shlProd.production_unit_price) || 0) <= 0 || (parseFloat(shlProd.production_egg_unit_price) || 0) <= 0) {
        missing.push(`${selected.name} - Shell Eggs (SHL)`);
      }
    } else {
      const price = parseFloat(selected.production_unit_price) || 0;
      if (price <= 0) {
        missing.push(selected.name);
      }
    }
    return missing;
  };

  const missingPrices = getMissingPriceDetails();
  const hasMissingPrices = missingPrices.length > 0;

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
    const goodVal = (watchGoodStacks * 30 + watchGoodExtraTrays) * watchGoodValuationPrice + watchGoodExtraEggs * watchGoodEggValuationPrice;
    const d1Val = watchD1Trays * watchD1ValuationPrice + watchD1ExtraEggs * watchD1EggValuationPrice;
    const d2Val = watchD2Trays * watchD2ValuationPrice + watchD2ExtraEggs * watchD2EggValuationPrice;
    const d3Val = watchD3Trays * watchD3ValuationPrice + watchD3ExtraEggs * watchD3EggValuationPrice;
    const shellVal = watchShellTrays * watchShellValuationPrice + watchShellExtraEggs * watchShellEggValuationPrice;
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
          <form onSubmit={handleSubmit(onSubmit, (errors) => console.error("Validation Errors:", errors))} className="lg:col-span-2 space-y-6">
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

                {hasMissingPrices && (
                  <div className="p-4 bg-red-50 border border-red-250 text-red-700 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle size={18} />
                      <span>Missing Production Prices</span>
                    </div>
                    <p className="text-xs">
                      You cannot record an intake for this product because production prices have not been set for the following items. Please go to the <strong>Prices</strong> tab in the Production Store to configure them first:
                    </p>
                    <ul className="list-disc list-inside text-xs pl-2 space-y-1">
                      {missingPrices.map((item, idx) => (
                        <li key={idx} className="font-semibold">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

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
                          label="Good Eggs Price (UGX) Per Tray" 
                          type="number" 
                          placeholder="12000" 
                          readOnly={true}
                          className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                          {...register("good_valuation_price", { valueAsNumber: true })} 
                          error={errors.good_valuation_price?.message} 
                        />
                        <Input 
                          label="Good Eggs Price (UGX) Per Egg" 
                          type="number" 
                          placeholder="400" 
                          readOnly={true}
                          className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                          {...register("good_egg_valuation_price", { valueAsNumber: true })} 
                          error={errors.good_egg_valuation_price?.message} 
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
                            label="D1 Price (UGX) Per Tray" 
                            type="number" 
                            placeholder="5000" 
                            readOnly={true}
                            className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                            {...register("d1_valuation_price", { valueAsNumber: true })} 
                            error={errors.d1_valuation_price?.message} 
                          />
                          <Input 
                            label="D1 Price (UGX) Per Egg" 
                            type="number" 
                            placeholder="167" 
                            readOnly={true}
                            className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                            {...register("d1_egg_valuation_price", { valueAsNumber: true })} 
                            error={errors.d1_egg_valuation_price?.message} 
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
                            label="D2 Price (UGX) Per Tray" 
                            type="number" 
                            placeholder="3000" 
                            readOnly={true}
                            className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                            {...register("d2_valuation_price", { valueAsNumber: true })} 
                            error={errors.d2_valuation_price?.message} 
                          />
                          <Input 
                            label="D2 Price (UGX) Per Egg" 
                            type="number" 
                            placeholder="100" 
                            readOnly={true}
                            className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                            {...register("d2_egg_valuation_price", { valueAsNumber: true })} 
                            error={errors.d2_egg_valuation_price?.message} 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-brand-sage/20 space-y-2">
                        <span className="text-[10px] font-bold text-red-655 uppercase block font-heading">Class 3 Damages (Severely cracked/rotten - Waste)</span>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="D3 Trays" type="number" placeholder="0" {...register("d3_trays", { valueAsNumber: true })} error={errors.d3_trays?.message} />
                          <Input label="D3 Extra Eggs" type="number" placeholder="0" {...register("d3_extra_eggs", { valueAsNumber: true })} error={errors.d3_extra_eggs?.message} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="D3 Price (UGX) Per Tray" type="number" disabled placeholder="0" {...register("d3_valuation_price", { valueAsNumber: true })} error={errors.d3_valuation_price?.message} />
                          <Input label="D3 Price (UGX) Per Egg" type="number" disabled placeholder="0" {...register("d3_egg_valuation_price", { valueAsNumber: true })} error={errors.d3_egg_valuation_price?.message} />
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
                          label="Shell Price (UGX) Per Tray" 
                          type="number" 
                          placeholder="2000" 
                          readOnly={true}
                          className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                          {...register("shell_valuation_price", { valueAsNumber: true })} 
                          error={errors.shell_valuation_price?.message} 
                        />
                        <Input 
                          label="Shell Price (UGX) Per Egg" 
                          type="number" 
                          placeholder="67" 
                          readOnly={true}
                          className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                          {...register("shell_egg_valuation_price", { valueAsNumber: true })} 
                          error={errors.shell_egg_valuation_price?.message} 
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
                      label={`Valuation Price (UGX) / ${selectedProduct?.unit_of_measure || 'unit'}`} 
                      type="number" 
                      step="1" 
                      placeholder="0" 
                      readOnly={true}
                      className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75"
                      {...register("valuation_price", { valueAsNumber: true })} 
                      error={errors.valuation_price?.message} 
                      required 
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  {existingBatches.length > 0 ? (
                    <div className="w-full space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 font-body block">
                        Batch Number <span className="text-xs text-gray-400 font-normal">(Select existing or enter new)</span>
                      </label>
                      <div className="flex rounded-lg bg-gray-100 p-0.5 w-full mb-1">
                        <button
                          type="button"
                          onClick={() => handleBatchSourceChange('existing')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all border-none cursor-pointer ${
                            batchSource === 'existing'
                              ? "bg-white text-brand-forest shadow-sm"
                              : "text-gray-500 hover:text-gray-700 bg-transparent"
                          }`}
                        >
                          Choose Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchSourceChange('new')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all border-none cursor-pointer ${
                            batchSource === 'new'
                              ? "bg-white text-brand-forest shadow-sm"
                              : "text-gray-500 hover:text-gray-700 bg-transparent"
                          }`}
                        >
                          Create New
                        </button>
                      </div>
                      {batchSource === 'existing' ? (
                        <Select
                          options={existingBatches.map((b) => ({ label: b, value: b }))}
                          {...register("batch_number")}
                          error={errors.batch_number?.message}
                        />
                      ) : (
                        <Input
                          placeholder="e.g. B-0516-A"
                          {...register("batch_number")}
                          error={errors.batch_number?.message}
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      label="Batch Number"
                      placeholder="e.g. B-0516-A"
                      {...register("batch_number")}
                      error={errors.batch_number?.message}
                    />
                  )}
                  <Input label="Notes / Observations" placeholder="Any quality notes or specific details..." {...register("notes")} />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={hasMissingPrices}
                    className={`w-full h-12 text-base font-bold gap-2.5 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl shadow-md border-none ${
                      hasMissingPrices ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                    isLoading={isLoading}
                  >
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
                      {isEggProduct ? formatQuantityGlobal(calculatedQty, "trays", true) : `${calculatedQty.toLocaleString()} ${selectedProduct?.unit_of_measure || ""}`}
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
                      <span>Total Intake:</span>
                      <span>{formatQuantityGlobal(calculated.total, "trays", true)}</span>
                    </div>
                    <div className="pl-2 space-y-1 text-[11px] text-white/80">
                      <div className="flex justify-between">
                        <span>- Good:</span>
                        <span>{formatQuantityGlobal(calculated.good, "trays", true)} <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchGoodValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Class 1 Damages:</span>
                        <span>{formatQuantityGlobal(calculated.d1, "trays", false)} <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchD1ValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Class 2 Damages:</span>
                        <span>{formatQuantityGlobal(calculated.d2, "trays", false)} <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchD2ValuationPrice.toLocaleString()}/T)</span></span>
                      </div>
                      <div className="flex justify-between text-red-300">
                        <span>- Class 3 Damages (Waste):</span>
                        <span>{formatQuantityGlobal(calculated.d3, "trays", false)} <span className="text-[10px] text-red-400 font-mono">(UGX 0/T)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Shell Eggs:</span>
                        <span>{formatQuantityGlobal(calculated.shell, "trays", false)} <span className="text-[10px] text-brand-yellow font-mono">(UGX {watchShellValuationPrice.toLocaleString()}/T)</span></span>
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
