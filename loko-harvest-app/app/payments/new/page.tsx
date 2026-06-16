"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ChevronLeft, 
  Save,
  CheckCircle2,
  Wallet,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

const paymentSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  payment_date: z.string(),
  amount: z.number().min(0.01, "Amount must be > 0"),
  payment_method: z.enum(["cash", "bank_transfer", "mobile_money", "cheque"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  auto_allocate: z.boolean(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  // Load real customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/customers", { params: { per_page: 200 } });
        const list = res.data.data?.data || res.data.data || [];
        setDbCustomers(list);
        if (list.length > 0) {
          setValue("customer_id", list[0].id);
        }
      } catch (err) {
        console.error("Failed to load customers for payment:", err);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchCustomers();
  }, [setValue]);

  const selectedCustomer = dbCustomers.find(c => c.id === selectedCustomerId);
  const currentBalance = selectedCustomer?.account?.current_balance 
    ? parseFloat(selectedCustomer.account.current_balance) 
    : 0;

  const customerOptions = dbCustomers.map(c => {
    const bal = c.account?.current_balance ? parseFloat(c.account.current_balance) : 0;
    return {
      label: `${c.name} (Bal: UGX ${bal.toLocaleString()})`,
      value: c.id
    };
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    try {
      await api.post("/payments", {
        customer_id: data.customer_id,
        payment_date: data.payment_date,
        amount: data.amount,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        notes: data.notes || null,
        auto_allocate: data.auto_allocate,
      });
      setIsSuccess(true);
      setTimeout(() => router.push("/customers"), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Loading payment resources...
        </div>
      </DashboardLayout>
    );
  }

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-200 shadow-sm">
            <CheckCircle2 size={64} className="animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-forest font-heading">Payment Recorded!</h2>
            <p className="text-gray-500 mt-2 font-body text-sm">The customer's account balance has been updated and outstanding invoices cleared.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="text-brand-forest h-10 w-10 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-full flex items-center justify-center border border-brand-sage/30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record Payment</h1>
            <p className="text-gray-500 font-body text-sm mt-0.5">Receive payment and allocate to outstanding invoices</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6">
               <CardTitle className="text-base font-bold text-brand-forest">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6 space-y-6">
              <Select
                label="Select Customer"
                options={customerOptions}
                {...register("customer_id")}
                error={errors.customer_id?.message}
                required
              />

              {selectedCustomerId && (
                <div className={`p-4 rounded-xl flex items-center justify-between border ${
                  currentBalance > 0 
                    ? "bg-red-50 text-red-700 border-red-100" 
                    : "bg-green-50 text-green-700 border-green-100"
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    <Wallet size={18} />
                    <span className="text-sm">Outstanding Balance:</span>
                  </div>
                  <span className="text-lg font-bold">
                    UGX {currentBalance.toLocaleString()}
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

              <div className="flex items-center gap-3 p-4 bg-brand-sage/10 rounded-xl border border-brand-sage/30">
                 <input 
                    type="checkbox" 
                    id="auto_allocate" 
                    className="h-5 w-5 rounded border-brand-forest text-brand-forest focus:ring-brand-forest cursor-pointer"
                    {...register("auto_allocate")}
                 />
                 <label htmlFor="auto_allocate" className="text-sm font-medium text-brand-forest cursor-pointer select-none">
                    Automatically allocate to oldest unpaid invoices
                 </label>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-sm font-bold bg-brand-yellow hover:bg-[#E08C00] text-brand-forest border-none shadow-sm rounded-xl gap-2 cursor-pointer flex items-center justify-center" 
                  isLoading={isLoading}
                >
                  <Save size={18} />
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
