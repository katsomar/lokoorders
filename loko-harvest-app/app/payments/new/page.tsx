"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  ChevronLeft, 
  CreditCard,
  Save,
  CheckCircle2,
  Wallet
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const paymentSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  payment_date: z.string(),
  amount: z.number().min(0.01, "Amount must be > 0"),
  payment_method: z.enum(["cash", "bank_transfer", "mobile_money", "cheque"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  auto_allocate: z.boolean().default(true),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock customers
  const customers = [
    { label: "Shoprite Lugogo (Bal: 12.5M)", value: "c1", balance: 12500000 },
    { label: "KFC Bukoto (Bal: 8.4M)", value: "c2", balance: 8400000 },
    { label: "Café Javas (Bal: 6.2M)", value: "c3", balance: 6200000 },
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      auto_allocate: true,
    },
  });

  const selectedCustomerId = watch("customer_id");
  const selectedCustomer = customers.find(c => c.value === selectedCustomerId);

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Submitting payment:", data);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/customers"), 2000);
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
            <h2 className="text-3xl font-bold text-brand-forest font-heading">Payment Recorded!</h2>
            <p className="text-gray-500 mt-2 font-body">The customer's account balance has been updated.</p>
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
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record Payment</h1>
            <p className="text-gray-500 font-body">Receive payment and allocate to outstanding invoices</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
               <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <Select
                label="Select Customer"
                options={customers}
                {...register("customer_id")}
                error={errors.customer_id?.message}
                required
              />

              {selectedCustomer && (
                <div className="p-4 bg-red-50 rounded-xl flex items-center justify-between border border-red-100">
                  <div className="flex items-center gap-2 text-red-700">
                    <Wallet size={18} />
                    <span className="text-sm font-medium">Outstanding Balance:</span>
                  </div>
                  <span className="text-lg font-bold text-red-700">
                    UGX {selectedCustomer.balance.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Payment Date"
                  type="date"
                  {...register("payment_date")}
                  error={errors.payment_date?.message}
                  required
                />
                <Select
                  label="Payment Method"
                  options={[
                    { label: "Bank Transfer", value: "bank_transfer" },
                    { label: "Cash", value: "cash" },
                    { label: "Mobile Money", value: "mobile_money" },
                    { label: "Cheque", value: "cheque" },
                  ]}
                  {...register("payment_method")}
                  error={errors.payment_method?.message}
                  required
                />
              </div>

              <Input
                label="Amount Paid (UGX)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
                error={errors.amount?.message}
                required
              />

              <Input
                label="Reference Number"
                placeholder="Bank slip # or transaction ID"
                {...register("reference_number")}
              />

              <div className="flex items-center gap-3 p-4 bg-brand-sage/30 rounded-xl border border-brand-sage">
                 <input 
                    type="checkbox" 
                    id="auto_allocate" 
                    className="h-5 w-5 rounded border-brand-forest text-brand-forest focus:ring-brand-forest"
                    {...register("auto_allocate")}
                 />
                 <label htmlFor="auto_allocate" className="text-sm font-medium text-brand-forest">
                    Automatically allocate to oldest unpaid invoices
                 </label>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold gap-3" 
                  isLoading={isLoading}
                >
                  <Save size={20} />
                  Record & Post Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
