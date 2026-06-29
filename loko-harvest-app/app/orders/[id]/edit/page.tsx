"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Warehouse,
  Loader2
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
import api from "@/lib/api";

let globalCustomers: any[] = [];

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer HQ is required"),
  sales_store_id: z.string().min(1, "Sales store is required"),
  branch_id: z.string().optional(),
  order_date: z.string(),
  required_delivery_date: z.string(),
  urgency: z.enum(["normal", "urgent", "critical"]),
  fiscal_document_number: z.string().optional(),
  order_notes: z.string().optional(),
  admin_override_reason: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    batch_reference: z.string().optional(),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
  })).min(1, "At least one item is required"),
}).superRefine((data, ctx) => {
  const hasBranches = globalCustomers.some(c => c.parent_id === data.customer_id);
  if (hasBranches && !data.branch_id) {
    ctx.addIssue({
      path: ["branch_id"],
      code: z.ZodIssueCode.custom,
      message: "Please select a specific delivery branch location",
    });
  }
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [salesStock, setSalesStock] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split("T")[0],
      required_delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      urgency: "normal",
      fiscal_document_number: "",
      items: [{ product_id: "", batch_reference: "", quantity: 1, unit_price: 0 }],
      admin_override_reason: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const selectedCustomerId = watch("customer_id");
  const watchSalesStoreId = watch("sales_store_id");
  const adminOverrideValue = watch("admin_override_reason");

  // Sync dbCustomers with globalCustomers for access inside the static zod schema
  useEffect(() => {
    globalCustomers = dbCustomers;
  }, [dbCustomers]);

  // Load baseline resources & existing order details
  useEffect(() => {
    const initPage = async () => {
      setIsPageLoading(true);
      try {
        const [storesRes, customersRes, productsRes, orderRes] = await Promise.all([
          api.get('/sales-stores'),
          api.get('/customers', { params: { per_page: 1000 } }),
          api.get('/products'),
          api.get(`/orders/${orderId}`)
        ]);
        
        const stores = storesRes.data.data || [];
        setSalesStores(stores);
        
        const customers = customersRes.data.data.data || customersRes.data.data || [];
        setDbCustomers(customers);
        
        setProductsList(productsRes.data.data || []);

        const orderData = orderRes.data.data;
        if (orderData) {
          if (orderData.status === "dispatched" || orderData.status === "delivered") {
            alert("Cannot edit an order that has already been dispatched or delivered.");
            router.push("/orders");
            return;
          }

          setOrderNumber(orderData.order_number);

          // Populate the form values
          reset({
            customer_id: orderData.customer?.parent_id || orderData.customer_id,
            branch_id: orderData.customer?.parent_id ? orderData.customer_id : "",
            sales_store_id: orderData.sales_store_id,
            order_date: orderData.order_date,
            required_delivery_date: orderData.required_delivery_date,
            urgency: orderData.urgency,
            fiscal_document_number: orderData.fiscal_document_number || "",
            order_notes: orderData.order_notes || "",
            admin_override_reason: orderData.admin_override_reason || "",
            items: orderData.items.map((item: any) => ({
              product_id: item.product_id,
              batch_reference: item.batch_reference || "",
              quantity: parseFloat(item.quantity) || 0,
              unit_price: parseFloat(item.unit_price) || 0
            }))
          });
        }
      } catch (err) {
        console.error("Failed to load page or order data", err);
        alert("Failed to load order data.");
        router.push("/orders");
      } finally {
        setIsPageLoading(false);
      }
    };
    if (orderId) {
      initPage();
    }
  }, [orderId, setValue, reset, router]);

  // Load sales stock when sales store changes
  useEffect(() => {
    if (!watchSalesStoreId) {
      setSalesStock([]);
      return;
    }
    const loadStock = async () => {
      try {
        const res = await api.get('/sales-stock', {
          params: { sales_store_id: watchSalesStoreId }
        });
        setSalesStock(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch sales stock", err);
      }
    };
    loadStock();
  }, [watchSalesStoreId]);

  // Group DB customers into HQ / Branches dynamically
  const parsedCustomers = React.useMemo(() => {
    const parents = dbCustomers.filter(c => !c.parent_id);

    const list: any[] = [];
    parents.forEach(p => {
      const branches = dbCustomers
        .filter(c => c.parent_id === p.id)
        .map(c => ({ label: c.name, value: c.id }));

      if (branches.length > 0) {
        const label = p.name.toLowerCase().includes("(hq)") ? p.name : `${p.name} (HQ)`;
        list.push({
          label: label,
          value: p.id,
          hasBranches: true,
          branches: branches
        });
      } else {
        list.push({
          label: p.name,
          value: p.id,
          hasBranches: false,
          branches: []
        });
      }
    });

    list.sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [dbCustomers]);

  const selectedCustomerObj = parsedCustomers.find(c => c.value === selectedCustomerId);
  const showBranchSelector = selectedCustomerObj?.hasBranches || false;
  const branchOptions = selectedCustomerObj?.branches || [];

  const getAvailableStock = (productId: string) => {
    return salesStock
      .filter(s => s.product_id === productId)
      .reduce((sum, s) => sum + (parseFloat(s.current_quantity) || 0), 0);
  };

  const getBatchStock = (productId: string, batchRef: string | undefined | null) => {
    if (!productId) return 0;
    if (!batchRef) {
      return getAvailableStock(productId);
    }
    const item = salesStock.find(s => s.product_id === productId && s.batch_reference === batchRef);
    return item ? parseFloat(item.current_quantity) : 0;
  };

  const getProductBatches = (productId: string) => {
    if (!productId) return [];
    return salesStock.filter(s => s.product_id === productId && (parseFloat(s.current_quantity) || 0) > 0);
  };

  const getProductOptions = (selectedProdId?: string) => {
    return productsList
      .map(p => {
        const avail = getAvailableStock(p.id);
        return {
          label: `${p.name} (${avail} available)`,
          value: p.id,
          avail: avail
        };
      })
      .filter(p => p.avail >= 1 || p.value === selectedProdId);
  };

  const totalAmount = (watchedItems || []).reduce((acc, item) => acc + ((item?.quantity || 0) * (item?.unit_price || 0)), 0);

  // Check if any quantity exceeds stock levels
  const isAnyItemExceeding = React.useMemo(() => {
    return (watchedItems || []).some((item) => {
      if (!item?.product_id) return false;
      const avail = getBatchStock(item.product_id, item.batch_reference);
      return (item.quantity || 0) > avail;
    });
  }, [watchedItems, salesStock]);

  const onSubmit = async (data: OrderFormValues) => {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const prod = productsList.find(p => p.id === item.product_id);
      if (prod) {
        const supportsBatch = prod.category === 'eggs' || (prod.category === 'poultry' && prod.code !== 'POU-LVE');
        if (supportsBatch && !item.batch_reference) {
          alert(`Please select a batch reference for ${prod.name} (Row ${i + 1})`);
          return;
        }
      }
    }

    if (isAnyItemExceeding && !data.admin_override_reason) {
      alert("Order quantity exceeds available store stock. An Admin Override Reason is required.");
      return;
    }

    setIsLoading(true);
    try {
      const finalCustomerId = selectedCustomerObj?.hasBranches ? data.branch_id : data.customer_id;

      await api.put(`/orders/${orderId}`, {
        customer_id: finalCustomerId,
        sales_store_id: data.sales_store_id,
        order_date: data.order_date,
        required_delivery_date: data.required_delivery_date,
        urgency: data.urgency,
        fiscal_document_number: data.fiscal_document_number || null,
        order_notes: data.order_notes || null,
        admin_override_reason: data.admin_override_reason || null,
        items: data.items.map(item => ({
          product_id: item.product_id,
          batch_reference: item.batch_reference || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      alert("Order updated successfully!");
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order. Please check stock balances.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productsList.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unit_price`, parseFloat(product.sales_unit_price || product.default_unit_price) || 0);
    }
  };

  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Loading order for editing...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="text-brand-forest hover:bg-brand-sage/25 h-10 w-10 rounded-full"
            type="button"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Edit Order {orderNumber}</h1>
            <p className="text-gray-500 font-body text-sm mt-0.5">Modify intake order details, delivery routing, and products list</p>
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
                    options={parsedCustomers.map(c => ({ label: c.label, value: c.value }))}
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
                    label="Fulfillment Sales Store"
                    options={salesStores.map(s => ({ label: `${s.name} (${s.code})`, value: s.id }))}
                    {...register("sales_store_id")}
                    error={errors.sales_store_id?.message}
                    required
                  />

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Input
                    label="Fiscal Document Number (FDN)"
                    placeholder="e.g. FDN-9821"
                    {...register("fiscal_document_number")}
                    error={errors.fiscal_document_number?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Order Delivery Notes"
                    placeholder="Optional gate instructions or contact numbers..."
                    {...register("order_notes")}
                  />
                </div>
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

                {isAnyItemExceeding && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <Input
                      label="Admin Override Reason"
                      placeholder="Explain override reason..."
                      className="bg-white/5 border-white/25 text-white placeholder:text-white/40 focus-visible:ring-brand-yellow"
                      {...register("admin_override_reason")}
                      error={errors.admin_override_reason?.message}
                      required
                    />
                    <p className="text-[10px] text-brand-yellow font-bold flex items-center gap-1">
                      <AlertCircle size={12} />
                      Exceeds available stock. Reason is required.
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none mt-6 font-bold h-11 text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  isLoading={isLoading}
                  disabled={isAnyItemExceeding && !adminOverrideValue}
                >
                  <Save size={16} />
                  Record & Commit Order Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-brand-sage/40 shadow-sm rounded-xl bg-white">
              <CardContent className="pt-6 p-5">
                <div className="flex items-start gap-2.5 text-xs text-gray-500 font-body leading-normal">
                  <Calculator size={16} className="text-brand-forest mt-0.5 flex-shrink-0" />
                  <p>Saving these updates recalculates stock and ledger allocations for active orders. Pending orders will only deduct stock and post to the ledger once processed.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="lg:col-span-3 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-forest">Ordered Farm Items</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ product_id: "", batch_reference: "", quantity: 1, unit_price: 0 })}
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
                    <TableHead className="w-[30%] text-brand-forest font-bold text-xs">Product Select</TableHead>
                    <TableHead className="w-[25%] text-brand-forest font-bold text-xs">Batch Reference</TableHead>
                    <TableHead className="text-brand-forest font-bold text-xs">Quantity</TableHead>
                    <TableHead className="text-brand-forest font-bold text-xs">Unit Price (UGX)</TableHead>
                    <TableHead className="text-brand-forest font-bold text-xs">Total Dues</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fields || []).map((field, index) => {
                    const selectedProdId = watchedItems?.[index]?.product_id;
                    const selectedBatchRef = watchedItems?.[index]?.batch_reference;
                    const avail = selectedProdId ? getBatchStock(selectedProdId, selectedBatchRef) : 0;
                    const quantityValue = watchedItems?.[index]?.quantity || 0;
                    const isExceeding = quantityValue > avail;
                    const errorsItemsAtIndex = errors.items?.[index];

                    return (
                      <TableRow key={field.id} className="hover:bg-brand-sage/5">
                        <TableCell>
                          <Select
                            options={getProductOptions(selectedProdId)}
                            {...register(`items.${index}.product_id` as const)}
                            onChange={(e) => {
                              register(`items.${index}.product_id`).onChange(e);
                              handleProductChange(index, e.target.value);
                              setValue(`items.${index}.batch_reference`, "");
                            }}
                            error={errors.items?.[index]?.product_id?.message}
                          />
                        </TableCell>
                        <TableCell>
                          {selectedProdId ? (
                            (() => {
                              const prod = productsList.find(p => p.id === selectedProdId);
                              const supportsBatch = prod && (prod.category === 'eggs' || (prod.category === 'poultry' && prod.code !== 'POU-LVE'));
                              if (supportsBatch) {
                                const batches = getProductBatches(selectedProdId);
                                return (
                                  <div className="space-y-1">
                                    <select
                                      className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-transparent bg-white text-xs"
                                      {...register(`items.${index}.batch_reference` as const)}
                                    >
                                      <option value="">-- Select Batch --</option>
                                      {batches.map((b: any) => (
                                        <option key={b.id} value={b.batch_reference}>
                                          {b.batch_reference || 'Unbatched'} ({(parseFloat(b.current_quantity) || 0).toLocaleString()} avail)
                                        </option>
                                      ))}
                                    </select>
                                    {errorsItemsAtIndex && 'batch_reference' in errorsItemsAtIndex && (
                                      <p className="text-[10px] text-red-500">Batch selection required</p>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <span className="text-xs text-gray-400 font-medium italic">
                                    FIFO / Not Tracked
                                  </span>
                                );
                              }
                            })()
                          ) : (
                            <span className="text-xs text-gray-300 italic">Select product first</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                              error={errors.items?.[index]?.quantity?.message}
                            />
                            {selectedProdId && (
                              <div className={`text-[10px] font-bold ${isExceeding ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                {isExceeding 
                                  ? `Exceeds stock! (${avail} avail)` 
                                  : `${avail} available${selectedBatchRef ? ' in batch' : ''}`
                                }
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                            error={errors.items?.[index]?.unit_price?.message}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-brand-forest text-xs whitespace-nowrap pt-4">
                          UGX {((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.unit_price || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 mt-1"
                            disabled={fields.length === 1}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        </form>
      </div>
    </DashboardLayout>
  );
}
