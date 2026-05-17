"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Calculator,
  Save,
  AlertCircle,
  Building2,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer HQ is required"),
  branch_id: z.string().optional(),
  order_date: z.string(),
  required_delivery_date: z.string(),
  urgency: z.enum(["normal", "urgent", "critical"]),
  order_notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
  })).min(1, "At least one item is required"),
}).superRefine((data, ctx) => {
  // If the customer selected has branches in our DB model, branch_id becomes strictly required
  const customerHasBranches = ["shoprite", "mega"].includes(data.customer_id);
  if (customerHasBranches && !data.branch_id) {
    ctx.addIssue({
      path: ["branch_id"],
      code: z.ZodIssueCode.custom,
      message: "Please select a specific delivery branch location",
    });
  }
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Unified corporate customer records with branches
  const customers = [
    { label: "Shoprite Supermarkets (HQ)", value: "shoprite", hasBranches: true, branches: [
      { label: "Shoprite Lugogo Branch", value: "shoprite-lugogo" },
      { label: "Shoprite Acacia Branch", value: "shoprite-acacia" }
    ]},
    { label: "Mega Standard Supermarkets (HQ)", value: "mega", hasBranches: true, branches: [
      { label: "Mega Standard Downtown", value: "mega-downtown" },
      { label: "Mega Standard Nakasero", value: "mega-nakasero" },
      { label: "Mega Standard Entebbe", value: "mega-entebbe" }
    ]},
    { label: "KFC Bukoto (Standalone)", value: "kfc", hasBranches: false, branches: [] },
    { label: "Café Javas Oasis Mall (Standalone)", value: "cj", hasBranches: false, branches: [] },
  ];

  const products = [
    { label: "White Eggs (Trays)", value: "p1", price: 12000 },
    { label: "Brown Eggs (Trays)", value: "p2", price: 13500 },
    { label: "Dressed Chicken (Unit)", value: "p3", price: 25000 },
    { label: "Chicken Manure (Kg)", value: "p4", price: 1500 },
  ];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split("T")[0],
      required_delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      urgency: "normal",
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const selectedCustomerId = watch("customer_id");
  
  const selectedCustomerObj = customers.find(c => c.value === selectedCustomerId);
  const showBranchSelector = selectedCustomerObj?.hasBranches || false;
  const branchOptions = selectedCustomerObj?.branches || [];

  const totalAmount = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0);

  const onSubmit = async (data: OrderFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Submitting branch-aware order:", data);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/orders");
    }, 1500);
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.value === productId);
    if (product) {
      setValue(`items.${index}.unit_price`, product.price);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="text-brand-forest hover:bg-brand-sage/25 h-10 w-10 rounded-full"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Record New Order</h1>
            <p className="text-gray-500 font-body">Capture intake orders under corporate or standalone customer accounts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6">
                <CardTitle className="text-base font-bold text-brand-forest">Corporate Account Assignment</CardTitle>
                <CardDescription className="text-xs">Select customer headquarters and designate branch routing if applicable</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-6 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Customer Headquarters (HQ)"
                    options={customers.map(c => ({ label: c.label, value: c.value }))}
                    {...register("customer_id")}
                    error={errors.customer_id?.message}
                    required
                  />
                  
                  {/* DYNAMIC BRANCH SELECTOR */}
                  {showBranchSelector ? (
                    <Select
                      label="Delivery Branch Location"
                      options={branchOptions}
                      {...register("branch_id")}
                      error={errors.branch_id?.message}
                      required
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-400 font-medium flex items-center gap-2 h-10 self-end">
                      <Building2 size={14} className="text-gray-300" />
                      Selected customer has no sub-branches
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Urgency Level"
                    options={[
                      { label: "Normal Delivery", value: "normal" },
                      { label: "Urgent (Within 24hrs)", value: "urgent" },
                      { label: "Critical Priority", value: "critical" },
                    ]}
                    {...register("urgency")}
                    error={errors.urgency?.message}
                  />
                  <Input
                    label="Order Date"
                    type="date"
                    {...register("order_date")}
                    error={errors.order_date?.message}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Required Delivery Date"
                    type="date"
                    {...register("required_delivery_date")}
                    error={errors.required_delivery_date?.message}
                    required
                  />
                  <Input
                    label="Order Delivery Notes"
                    placeholder="Optional gate instructions or contact numbers..."
                    {...register("order_notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-brand-forest">Ordered Farm Items</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                  className="gap-1.5 h-8 border-brand-sage text-brand-forest font-bold text-xs"
                >
                  <Plus size={14} />
                  Add Product Row
                </Button>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%] text-brand-forest font-bold text-xs">Product Select</TableHead>
                      <TableHead className="text-brand-forest font-bold text-xs">Quantity</TableHead>
                      <TableHead className="text-brand-forest font-bold text-xs">Unit Price (UGX)</TableHead>
                      <TableHead className="text-brand-forest font-bold text-xs">Total Dues</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-brand-sage/5">
                        <TableCell>
                          <Select
                            options={products}
                            {...register(`items.${index}.product_id` as const)}
                            onChange={(e) => {
                              register(`items.${index}.product_id`).onChange(e);
                              handleProductChange(index, e.target.value);
                            }}
                            error={errors.items?.[index]?.product_id?.message}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            error={errors.items?.[index]?.quantity?.message}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                            error={errors.items?.[index]?.unit_price?.message}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-brand-forest text-xs whitespace-nowrap">
                          UGX {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                            disabled={fields.length === 1}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {errors.items?.message && (
                  <p className="text-xs text-red-500 mt-2.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.items.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel Summary */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-brand-forest text-white">
              <CardHeader className="py-5 px-6 border-b border-white/10">
                <CardTitle className="text-white text-base">Receipt Dues Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between text-white/80 text-xs">
                  <span>Subtotal Amount</span>
                  <span className="font-bold">UGX {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/80 text-xs">
                  <span>VAT / Tax (0%)</span>
                  <span className="font-bold">UGX 0</span>
                </div>
                
                <div className="border-t border-white/20 pt-4 flex justify-between text-lg font-black text-brand-yellow font-heading">
                  <span>Total Order Dues</span>
                  <span>UGX {totalAmount.toLocaleString()}</span>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none mt-6 font-bold h-11 text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  isLoading={isLoading}
                >
                  <Save size={16} />
                  Record & Commit Order
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-brand-sage/40 shadow-sm rounded-xl">
              <CardContent className="pt-6 p-5">
                <div className="flex items-start gap-2.5 text-xs text-gray-500 font-body leading-normal">
                  <Calculator size={16} className="text-brand-forest mt-0.5 flex-shrink-0" />
                  <p>Commiting this form schedules warehouse stock deductions, drafts delivery fulfillment sheets and posts pending ledger balances immediately.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
