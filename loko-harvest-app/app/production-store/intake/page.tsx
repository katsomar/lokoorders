"use client";

import React, { useState } from "react";
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
  Layers
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const intakeSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().min(0.01, "Quantity must be > 0"),
  intake_date: z.string(),
  batch_number: z.string().optional(),
  notes: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export default function ProductionIntakePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock products
  const products = [
    { label: "White Eggs (Trays)", value: "p1" },
    { label: "Brown Eggs (Trays)", value: "p2" },
    { label: "Cream Eggs (Trays)", value: "p3" },
    { label: "Dressed Chicken (Units)", value: "p4" },
    { label: "Chicken Manure (Kg)", value: "p5" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      intake_date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: IntakeFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Submitting intake:", data);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/production-store"), 2000);
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
            <h2 className="text-3xl font-bold text-brand-forest font-heading">Intake Recorded!</h2>
            <p className="text-gray-500 mt-2 font-body">Production stock has been updated successfully.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-forest">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record Product Intake</h1>
            <p className="text-gray-500 font-body">Log new products arriving from the poultry farm</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-brand-sage/20 border-b border-brand-sage flex flex-row items-center gap-3">
               <ArrowDownToLine className="text-brand-forest" size={24} />
               <CardTitle className="text-lg">Intake Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Product Type"
                  options={products}
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
                  label="Batch Number"
                  placeholder="e.g. B-0516-A"
                  {...register("batch_number")}
                />
              </div>

              <Input
                label="Notes / Observations"
                placeholder="Any quality notes or specific details..."
                {...register("notes")}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold gap-3" 
                  isLoading={isLoading}
                >
                  <Save size={20} />
                  Save Intake Record
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-white rounded-xl shadow-sm border border-brand-sage flex gap-3 items-start">
                <Calendar size={18} className="text-brand-mid mt-0.5" />
                <p className="text-xs text-gray-500">Intakes should be recorded immediately upon arrival at the store.</p>
             </div>
             <div className="p-4 bg-white rounded-xl shadow-sm border border-brand-sage flex gap-3 items-start">
                <Layers size={18} className="text-brand-mid mt-0.5" />
                <p className="text-xs text-gray-500">Batch numbers help track product quality and aging (FIFO).</p>
             </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
