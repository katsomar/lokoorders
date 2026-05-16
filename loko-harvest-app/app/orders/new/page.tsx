"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle
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

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  order_date: z.string(),
  required_delivery_date: z.string(),
  urgency: z.enum(["normal", "urgent", "critical"]),
  order_notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
  })).min(1, "At least one item is required"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for dropdowns
  const customers = [
    { label: "Shoprite Lugogo", value: "c1" },
    { label: "KFC Bukoto", value: "c2" },
    { label: "Café Javas", value: "c3" },
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
  const totalAmount = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0);

  const onSubmit = async (data: OrderFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log("Submitting order:", data);
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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">New Order</h1>
            <p className="text-gray-500 font-body">Capture a new customer order</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Customer"
                    options={customers}
                    {...register("customer_id")}
                    error={errors.customer_id?.message}
                    required
                  />
                  <Select
                    label="Urgency Level"
                    options={[
                      { label: "Normal", value: "normal" },
                      { label: "Urgent", value: "urgent" },
                      { label: "Critical", value: "critical" },
                    ]}
                    {...register("urgency")}
                    error={errors.urgency?.message}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Order Date"
                    type="date"
                    {...register("order_date")}
                    error={errors.order_date?.message}
                    required
                  />
                  <Input
                    label="Required Delivery Date"
                    type="date"
                    {...register("required_delivery_date")}
                    error={errors.required_delivery_date?.message}
                    required
                  />
                </div>
                <Input
                  label="Order Notes"
                  placeholder="Optional delivery instructions..."
                  {...register("order_notes")}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                  className="gap-2"
                >
                  <Plus size={16} />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
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
                        <TableCell className="font-medium">
                          UGX {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={fields.length === 1}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {errors.items?.message && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.items.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-brand-forest text-white">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-white/80">
                  <span>Subtotal</span>
                  <span>UGX {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Tax (0%)</span>
                  <span>UGX 0</span>
                </div>
                <div className="border-t border-white/20 pt-4 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>UGX {totalAmount.toLocaleString()}</span>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none mt-4 font-bold"
                  isLoading={isLoading}
                >
                  <Save size={18} className="mr-2" />
                  Save Order
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-sm text-gray-500 font-body">
                  <Calculator size={18} className="text-brand-forest mt-0.5" />
                  <p>Invoices are automatically generated upon order submission.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
