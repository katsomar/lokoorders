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

const intakeSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().min(0.01, "Quantity must be > 0"),
  intake_date: z.string(),
  valuation_price: z.number().min(0, "Valuation price must be >= 0"),
  batch_number: z.string().optional(),
  notes: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export default function ProductionIntakePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
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
    },
  });

  const watchProductId = watch("product_id");
  const watchQty = watch("quantity") || 0;
  const watchPrice = watch("valuation_price") || 0;
  const watchBatch = watch("batch_number") || "";

  useEffect(() => {
    if (watchProductId && products.length > 0) {
      const selected = products.find((p) => p.id === watchProductId);
      if (selected) {
        setValue("valuation_price", parseFloat(selected.default_unit_price) || 0);
      }
    }
  }, [watchProductId, products, setValue]);

  const onSubmit = async (data: IntakeFormValues) => {
    setIsLoading(true);
    try {
      await api.post("/production-intakes", data);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/production-store"), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save intake record. Please check validation errors.");
      setIsLoading(false);
    }
  };

  const productOptions = products.map((p) => ({
    label: `${p.name} (Code: ${p.code})`,
    value: p.id,
  }));

  const selectedProduct = products.find((p) => p.id === watchProductId);

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
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-forest flex items-center justify-center h-10 w-10 hover:bg-brand-sage/20 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record Product Intake</h1>
            <p className="text-gray-500 font-body">Log new products arriving from the poultry farm</p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Column */}
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
                    label="Product Type"
                    options={productOptions}
                    {...register("product_id")}
                    error={errors.product_id?.message}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Quantity Received"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("quantity", { valueAsNumber: true })}
                    error={errors.quantity?.message}
                    required
                  />
                  <Input
                    label="Valuation Price (UGX)"
                    type="number"
                    step="1"
                    placeholder="0"
                    {...register("valuation_price", { valueAsNumber: true })}
                    error={errors.valuation_price?.message}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Batch Number"
                    placeholder="e.g. B-0516-A"
                    {...register("batch_number")}
                  />
                  <Input
                    label="Notes / Observations"
                    placeholder="Any quality notes or specific details..."
                    {...register("notes")}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold gap-2.5 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl shadow-md" 
                    isLoading={isLoading}
                  >
                    <Save size={18} />
                    Save Intake Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Real-time preview sidebar */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-brand-forest text-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-5">
                <CardTitle className="text-xs font-bold tracking-wider uppercase text-brand-yellow font-heading">Live Valuation Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Estimated Batch Value</p>
                  <h3 className="text-3xl font-black font-heading text-white">
                    UGX {(watchQty * watchPrice).toLocaleString()}
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
                      {watchQty.toLocaleString()} <span className="text-[10px] text-white/50">{selectedProduct?.unit_of_measure || ""}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Valuation Rate:</span>
                    <span className="font-bold text-brand-yellow">UGX {watchPrice.toLocaleString()} / unit</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Batch No:</span>
                    <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{watchBatch || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Helper Tips */}
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
