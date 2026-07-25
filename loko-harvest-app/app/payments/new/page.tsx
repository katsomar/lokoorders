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
  Loader2,
  FileText,
  Coins,
  Check
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
  
  // Custom Invoice allocations state
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});

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
  const autoAllocate = watch("auto_allocate");
  const amountPaid = watch("amount") || 0;

  // Load real customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/customers", { params: { minimal: 1, with_balance: 1 } });
        const list = res.data.data?.data || res.data.data || [];
        
        // Filter out customers with 0 balance
        const filteredList = list.filter((c: any) => {
          const bal = c.account?.current_balance ? parseFloat(c.account.current_balance) : 0;
          return bal > 0;
        });

        setDbCustomers(filteredList);
        if (filteredList.length > 0) {
          setValue("customer_id", filteredList[0].id);
        } else {
          setValue("customer_id", "");
        }
      } catch (err) {
        console.error("Failed to load customers for payment:", err);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchCustomers();
  }, [setValue]);

  // Load customer's unpaid invoices when customer or auto_allocate changes
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      if (!selectedCustomerId || autoAllocate) {
        setUnpaidInvoices([]);
        setManualAllocations({});
        return;
      }
      
      setIsInvoicesLoading(true);
      try {
        const res = await api.get("/invoices", {
          params: {
            customer_id: selectedCustomerId,
            status: "unpaid,partially_paid",
            per_page: 100,
          }
        });
        const list = res.data.data?.data || res.data.data || [];
        setUnpaidInvoices(list);
        setManualAllocations({});
      } catch (err) {
        console.error("Failed to load unpaid invoices:", err);
      } finally {
        setIsInvoicesLoading(false);
      }
    };
    
    fetchUnpaidInvoices();
  }, [selectedCustomerId, autoAllocate]);

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

  const getInvoiceOutstanding = (inv: any) => {
    const total = parseFloat(inv.total_amount || 0);
    const allocated = inv.allocations?.reduce((sum: number, al: any) => sum + parseFloat(al.amount_allocated), 0) || 0;
    return Math.max(0, total - allocated);
  };

  const handleAllocationChange = (invoiceId: string, valStr: string) => {
    const val = parseFloat(valStr);
    setManualAllocations(prev => ({
      ...prev,
      [invoiceId]: isNaN(val) || val <= 0 ? 0 : val
    }));
  };

  const handleAutoDistribute = () => {
    if (amountPaid <= 0) {
      alert("Please enter a valid amount paid first.");
      return;
    }
    
    let remaining = amountPaid;
    const distributions: Record<string, number> = {};
    
    // Sort oldest first based on issue date
    const sorted = [...unpaidInvoices].sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime());
    
    for (const inv of sorted) {
      if (remaining <= 0) break;
      const outstanding = getInvoiceOutstanding(inv);
      if (outstanding > 0) {
        const allocated = Math.min(remaining, outstanding);
        distributions[inv.id] = parseFloat(allocated.toFixed(2));
        remaining -= allocated;
      }
    }
    
    setManualAllocations(distributions);
  };

  const totalAllocated = Object.values(manualAllocations).reduce((sum, val) => sum + val, 0);

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    try {
      let finalAllocations: any[] = [];
      if (!data.auto_allocate) {
        finalAllocations = Object.entries(manualAllocations)
          .filter(([_, amt]) => amt > 0)
          .map(([invoiceId, amt]) => ({
            invoice_id: invoiceId,
            amount_allocated: amt
          }));
          
        if (finalAllocations.length === 0) {
          alert("Please allocate at least a portion of the payment to one or more invoices, or check 'Automatically allocate'.");
          setIsLoading(false);
          return;
        }
        
        // Validation check to ensure full distribution of payment
        if (Math.abs(totalAllocated - data.amount) > 0.01) {
          alert(`Allocation mismatch: Total allocated (${totalAllocated.toLocaleString()}) must match payment amount (${data.amount.toLocaleString()}).`);
          setIsLoading(false);
          return;
        }
      }

      await api.post("/payments", {
        customer_id: data.customer_id,
        payment_date: data.payment_date,
        amount: data.amount,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        notes: data.notes || null,
        auto_allocate: data.auto_allocate,
        allocations: data.auto_allocate ? null : finalAllocations
      });
      setIsSuccess(true);
      setTimeout(() => router.push("/payments"), 2000);
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
          <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-200 shadow-sm animate-pulse">
            <CheckCircle2 size={48} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-brand-forest font-heading">Payment Recorded!</h2>
            <p className="text-gray-500 mt-2 font-body text-xs max-w-md">The customer's account balance has been updated and outstanding invoices cleared.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-3.5">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="text-brand-forest h-9 w-9 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-xl flex items-center justify-center border border-brand-sage/30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading leading-none">Record Payment</h1>
            <p className="text-gray-500 font-body text-xs mt-1.5">Receive payment and allocate to outstanding invoices</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
               <CardTitle className="text-sm font-bold text-brand-forest font-heading">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Select Customer"
                  options={customerOptions}
                  {...register("customer_id")}
                  error={errors.customer_id?.message}
                  required
                />

                {selectedCustomerId && (
                  <div className={`p-4 rounded-xl flex items-center justify-between border self-end h-10 ${
                    currentBalance > 0 
                      ? "bg-red-50 text-red-700 border-red-100" 
                      : "bg-green-50 text-green-700 border-green-100"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Wallet size={14} />
                      <span>Outstanding Balance:</span>
                    </div>
                    <span className="text-sm font-black font-heading">
                      UGX {currentBalance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {dbCustomers.length === 0 && (
                <div className="p-3.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 shadow-sm leading-relaxed">
                  ✅ All customer accounts are fully settled. There are currently no customers with outstanding balances.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Payment Date"
                  type="date"
                  className="text-xs h-9.5 rounded-xl border-brand-sage/60 focus:ring-brand-forest"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Amount Paid (UGX)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="text-xs h-9.5 rounded-xl border-brand-sage/60 focus:ring-brand-forest font-heading font-bold"
                  {...register("amount", { valueAsNumber: true })}
                  error={errors.amount?.message}
                  required
                />

                <Input
                  label="Reference Number"
                  placeholder="Bank slip # or transaction ID"
                  className="text-xs h-9.5 rounded-xl border-brand-sage/60 focus:ring-brand-forest font-mono"
                  {...register("reference_number")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 font-body block">Notes / Description</label>
                <textarea
                  placeholder="Add optional payment details, bank description or allocation memo..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest focus:border-brand-forest bg-white placeholder-gray-400 font-medium resize-none text-gray-800"
                  {...register("notes")}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-brand-sage/10 rounded-xl border border-brand-sage/30">
                 <input 
                    type="checkbox" 
                    id="auto_allocate" 
                    className="h-5 w-5 rounded border-brand-forest text-brand-forest focus:ring-brand-forest cursor-pointer"
                    {...register("auto_allocate")}
                 />
                 <label htmlFor="auto_allocate" className="text-xs font-bold text-brand-forest cursor-pointer select-none">
                    Automatically allocate to oldest unpaid invoices
                 </label>
              </div>

              {/* MANUAL ALLOCATIONS SECTION */}
              {!autoAllocate && selectedCustomerId && (
                <div className="space-y-4 pt-4 border-t border-gray-150 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-xs font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} />
                        Outstanding Invoices Allocation
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Specify how much of the payment is allocated to each invoice</p>
                    </div>
                    
                    {amountPaid > 0 && unpaidInvoices.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoDistribute}
                        className="h-8 text-[10px] font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 gap-1.5 rounded-lg flex items-center shrink-0 shadow-sm"
                      >
                        <Coins size={12} />
                        Oldest-First Auto-Distribute
                      </Button>
                    )}
                  </div>

                  {isInvoicesLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-500 font-bold">
                      <Loader2 className="animate-spin text-brand-forest" size={20} />
                      Loading customer invoices...
                    </div>
                  ) : unpaidInvoices.length === 0 ? (
                    <div className="p-5 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-xs italic">
                      No unpaid invoices found for this customer. Any recorded payment will be credited directly to their customer account balance.
                    </div>
                  ) : (
                    <div className="border border-brand-sage/30 rounded-xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50/60 border-b border-brand-sage/20">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold text-brand-forest pl-4">Invoice #</TableHead>
                            <TableHead className="text-[10px] font-bold text-brand-forest">Issue Date</TableHead>
                            <TableHead className="text-right text-[10px] font-bold text-brand-forest">Invoice Total</TableHead>
                            <TableHead className="text-right text-[10px] font-bold text-brand-forest">Outstanding</TableHead>
                            <TableHead className="text-right text-[10px] font-bold text-brand-forest pr-4 w-44">Allocated (UGX)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unpaidInvoices.map((inv) => {
                            const outstanding = getInvoiceOutstanding(inv);
                            return (
                              <TableRow key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/20">
                                <TableCell className="font-mono text-xs font-extrabold text-brand-forest pl-4">
                                  {inv.invoice_number}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500 font-medium">
                                  {inv.issue_date ? format(new Date(inv.issue_date), "dd MMM yyyy") : "N/A"}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold text-gray-600">
                                  UGX {parseFloat(inv.total_amount).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold text-brand-amber">
                                  UGX {outstanding.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right pr-4 py-2">
                                  <div className="flex justify-end">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={outstanding}
                                      placeholder="0"
                                      className="w-36 h-8 text-right text-xs rounded-lg border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest px-2.5 font-bold text-brand-forest"
                                      value={manualAllocations[inv.id] || ""}
                                      onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Summary Row */}
                          <TableRow className="bg-brand-sage/5 font-extrabold border-t border-brand-sage/20">
                            <TableCell colSpan={3} className="pl-4 py-3 text-xs text-brand-forest font-bold">
                              Summary Check
                            </TableCell>
                            <TableCell className="text-right text-xs text-brand-forest">
                              Total Allocated:
                            </TableCell>
                            <TableCell className="text-right pr-4 text-xs font-heading">
                              <span className={Math.abs(totalAllocated - amountPaid) < 0.01 ? "text-green-600 font-black" : "text-brand-amber font-black"}>
                                UGX {totalAllocated.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                                Target: UGX {amountPaid.toLocaleString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Warning banner if mismatch */}
                  {amountPaid > 0 && Math.abs(totalAllocated - amountPaid) > 0.01 && (
                    <div className="p-3 bg-amber-50 text-brand-amber text-[10px] font-bold rounded-xl border border-brand-yellow/30 flex items-center gap-1.5 leading-relaxed">
                      ⚠️ The total allocated amount (UGX {totalAllocated.toLocaleString()}) must match the payment amount paid (UGX {amountPaid.toLocaleString()}).
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-xs font-extrabold bg-brand-yellow hover:bg-[#E08C00] text-brand-forest border-none shadow-sm rounded-xl gap-2 cursor-pointer flex items-center justify-center" 
                  disabled={isLoading || (!autoAllocate && Math.abs(totalAllocated - amountPaid) > 0.01)}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Check size={16} />
                      Record & Post Payment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
