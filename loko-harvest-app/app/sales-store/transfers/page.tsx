"use client";

import React, { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const transferSchema = z.object({
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

  // Mock data
  const products = [
    { label: "White Eggs (Trays)", value: "p1", available: 1250 },
    { label: "Brown Eggs (Trays)", value: "p2", available: 840 },
    { label: "Cream Eggs (Trays)", value: "p3", available: 600 },
    { label: "Dressed Chicken (Units)", value: "p4", available: 300 },
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transfer_date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedProductId = watch("product_id");
  const selectedProduct = products.find(p => p.value === selectedProductId);

  const onSubmit = async (data: TransferFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Submitting transfer:", data);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/sales-store"), 2000);
    }, 1500);
  };

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
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Stock Transfer</h1>
            <p className="text-gray-500 font-body">Move products from Production to Sales Store</p>
          </div>
        </div>

        <Card className="border-none shadow-xl">
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
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Product to Transfer"
                  options={products}
                  {...register("product_id")}
                  error={errors.product_id?.message}
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

              {selectedProduct && (
                <div className="p-4 bg-brand-sage/30 rounded-xl flex items-center justify-between border border-brand-sage">
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-brand-forest" />
                    <span className="text-sm font-medium text-brand-forest">Current Production Stock:</span>
                  </div>
                  <span className="text-lg font-bold text-brand-forest">
                    {selectedProduct.available.toLocaleString()} Trays
                  </span>
                </div>
              )}

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
                placeholder="Batch number or special handling instructions..."
                {...register("notes")}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold gap-3" 
                  isLoading={isLoading}
                  disabled={selectedProduct && watch("quantity") > selectedProduct.available}
                >
                  <ArrowRightLeft size={20} />
                  Execute Transfer
                </Button>
                {selectedProduct && watch("quantity") > selectedProduct.available && (
                  <p className="text-center text-xs text-red-500 font-medium mt-3">
                    Error: Transfer quantity exceeds available production stock.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
