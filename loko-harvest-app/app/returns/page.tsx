"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Eye, 
  TrendingDown, 
  RefreshCcw, 
  CheckCircle2, 
  X, 
  FileText, 
  AlertTriangle, 
  Coins 
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
import api from "@/lib/api";

interface ReturnVoucher {
  id: string;
  voucher_number: string;
  customer: string;
  customer_id: string;
  delivery_id: string;
  delivery_number: string;
  order_id: string;
  order_number: string;
  return_date: string;
  product: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  monetary_value: number;
  reason_code: "broken_cracked" | "rotten_spoiled" | "wrong_product" | "near_expiry" | "packaging_damage" | "other";
  return_type: "credit" | "physical_replacement";
  account_credit_posted: boolean;
  notes: string;
  created_by: string;
  batch_reference?: string | null;
  replacement_quantity: number;
  date_replaced?: string | null;
  acknowledged_by?: string;
  signature_path?: string | null;
  store_name?: string;
}

const reasonLabels: Record<string, string> = {
  broken_cracked: "Broken / Cracked",
  rotten_spoiled: "Rotten / Spoiled",
  wrong_product: "Wrong Product Delivered",
  near_expiry: "Near Expiry",
  packaging_damage: "Packaging Damage",
  other: "Other Reason"
};

const reasonColors: Record<string, string> = {
  broken_cracked: "bg-red-50 text-red-700 border-red-100",
  rotten_spoiled: "bg-amber-50 text-amber-700 border-amber-100",
  wrong_product: "bg-blue-50 text-blue-700 border-blue-100",
  near_expiry: "bg-purple-50 text-purple-700 border-purple-100",
  packaging_damage: "bg-orange-50 text-orange-700 border-orange-100",
  other: "bg-gray-50 text-gray-700 border-gray-100"
};

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<"vouchers" | "replacements">("vouchers");
  const [returns, setReturns] = useState<ReturnVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Replacements tab states
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [allocOrder, setAllocOrder] = useState("");
  const [allocProduct, setAllocProduct] = useState("");
  const [allocQty, setAllocQty] = useState("");
  const [allocStore, setAllocStore] = useState("");
  const [allocBatch, setAllocBatch] = useState("");
  const [allocOrderItems, setAllocOrderItems] = useState<any[]>([]);
  const [allocMetrics, setAllocMetrics] = useState({ total_count: 0, total_quantity: 0, total_value: 0 });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAllocationToReturn, setSelectedAllocationToReturn] = useState<any | null>(null);
  const [returnStore, setReturnStore] = useState("");
  const [returnBatch, setReturnBatch] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [returnStoreBatches, setReturnStoreBatches] = useState<string[]>([]);
  const [loadingReturnBatches, setLoadingReturnBatches] = useState(false);
  const [isCustomReturnBatch, setIsCustomReturnBatch] = useState(false);
  const [allocDriver, setAllocDriver] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [orderSearchText, setOrderSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredOrderOptions = orders
    .filter(o => o.status !== 'pending' && o.status !== 'cancelled')
    .filter(o => {
      if (!orderSearchText.trim()) return false;
      const q = orderSearchText.toLowerCase().replace(/[^a-z0-9]/g, "");
      const orderNumClean = o.order_number.toLowerCase().replace(/[^a-z0-9]/g, "");
      const numMatch = orderNumClean.includes(q);
      const custMatch = o.customer?.name.toLowerCase().includes(orderSearchText.toLowerCase()) || false;
      return numMatch || custMatch;
    });

  // Modals state
  const [selectedReturn, setSelectedReturn] = useState<ReturnVoucher | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSignatureUrl, setSelectedSignatureUrl] = useState<string | null>(null);

  const backendBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "");
  const getSignatureUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${backendBaseUrl}/storage/${path}`;
  };

  // Form dependencies state
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [formOrderProductOptions, setFormOrderProductOptions] = useState<any[]>([]);
  const [qtyError, setQtyError] = useState("");

  // Form fields state
  const [formCustomer, setFormCustomer] = useState("");
  const [formOrder, setFormOrder] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formType, setFormType] = useState<"credit" | "physical_replacement">("credit");
  const [formReason, setFormReason] = useState<ReturnVoucher["reason_code"]>("broken_cracked");
  const [formNotes, setFormNotes] = useState("");

  const mapVoucher = (apiVoucher: any): ReturnVoucher => ({
    id: apiVoucher.id,
    voucher_number: apiVoucher.voucher_number,
    customer: apiVoucher.customer?.name || "Unknown Customer",
    customer_id: apiVoucher.customer_id,
    delivery_id: apiVoucher.delivery?.id || apiVoucher.delivery_id,
    delivery_number: apiVoucher.order?.order_number ? `LHD-${apiVoucher.order.order_number.replace('LHO-', '')}` : "N/A",
    order_id: apiVoucher.order_id,
    order_number: apiVoucher.order?.order_number || "N/A",
    return_date: apiVoucher.return_date,
    product: apiVoucher.product?.name || "Unknown Product",
    product_id: apiVoucher.product_id,
    quantity: parseFloat(apiVoucher.quantity),
    unit_price: parseFloat(apiVoucher.unit_price),
    monetary_value: parseFloat(apiVoucher.monetary_value),
    reason_code: apiVoucher.reason_code,
    return_type: apiVoucher.return_type,
    account_credit_posted: !!apiVoucher.account_credit_posted,
    notes: apiVoucher.notes || "",
    created_by: apiVoucher.creator?.name || "System",
    batch_reference: apiVoucher.batch_reference || null,
    replacement_quantity: apiVoucher.replacement_quantity ? parseFloat(apiVoucher.replacement_quantity) : 0,
    date_replaced: apiVoucher.date_replaced || null,
    acknowledged_by: apiVoucher.acknowledged_by || "",
    signature_path: apiVoucher.signature_path || null,
    store_name: apiVoucher.order?.sales_store?.name || apiVoucher.order?.salesStore?.name || "N/A"
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/returns", {
        params: {
          search: searchTerm,
          reason_code: reasonFilter,
          return_type: typeFilter,
          per_page: 100
        }
      });
      if (res.data && res.data.success) {
        const mapped = (res.data.data.data || []).map(mapVoucher);
        setReturns(mapped);
      }
    } catch (err) {
      console.error("Error fetching return vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const custRes = await api.get("/customers", { params: { per_page: 200 } });
      if (custRes.data && custRes.data.success) {
        setCustomers(custRes.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching dependencies:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders", { params: { per_page: 200 } });
      setOrders(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const fetchSalesStores = async () => {
    try {
      const res = await api.get("/sales-stores");
      setSalesStores(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load sales stores:", err);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await api.get("/drivers");
      setDrivers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const res = await api.get("/replacement-allocations", { params: { per_page: 100 } });
      if (res.data?.success) {
        const payload = res.data.data;
        const list = payload?.data?.data || payload?.data || [];
        setAllocations(Array.isArray(list) ? list : []);
        setAllocMetrics(payload?.metrics || { total_count: 0, total_quantity: 0, total_value: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch allocations:", err);
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    const fetchAvailableBatches = async () => {
      setAllocBatch("");
      if (!allocStore || !allocProduct) {
        setAvailableBatches([]);
        return;
      }
      setLoadingBatches(true);
      try {
        const res = await api.get("/sales-stock", {
          params: { sales_store_id: allocStore }
        });
        const stocks = res.data?.data || [];
        const filtered = stocks.filter((s: any) => s.product_id === allocProduct && parseFloat(s.current_quantity) > 0);
        setAvailableBatches(filtered);
      } catch (err) {
        console.error("Failed to load available batches:", err);
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchAvailableBatches();
  }, [allocStore, allocProduct]);

  const handleAllocOrderChange = (orderId: string) => {
    setAllocOrder(orderId);
    setAllocProduct("");
    if (!orderId) {
      setAllocOrderItems([]);
      return;
    }
    const matched = orders.find(o => o.id === orderId);
    if (matched) {
      setAllocOrderItems(matched.items || []);
    }
  };

  const handleAssignReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocOrder || !allocProduct || !allocStore || !allocQty || !allocDriver) {
      alert("Please fill all required allocation fields.");
      return;
    }
    setIsSubmittingAllocation(true);
    try {
      const res = await api.post("/replacement-allocations", {
        order_id: allocOrder,
        product_id: allocProduct,
        sales_store_id: allocStore,
        batch_reference: allocBatch || null,
        allocated_quantity: parseFloat(allocQty),
        driver_id: allocDriver
      });
      if (res.data?.success) {
        alert("Replacement pre-allocated successfully!");
        setAllocQty("");
        setAllocBatch("");
        setAllocDriver("");
        fetchAllocations();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to allocate replacement. Check store stock levels.");
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  const handleReturnStoreChange = (storeId: string) => {
    setReturnStore(storeId);
    if (selectedAllocationToReturn) {
      if (storeId === selectedAllocationToReturn.sales_store_id) {
        setReturnBatch(selectedAllocationToReturn.batch_reference || "");
        setIsCustomReturnBatch(false);
      } else {
        setReturnBatch(selectedAllocationToReturn.batch_reference || "");
        setIsCustomReturnBatch(true);
      }
    }
  };

  useEffect(() => {
    const fetchReturnBatches = async () => {
      if (!returnStore || !selectedAllocationToReturn) {
        setReturnStoreBatches([]);
        return;
      }
      setLoadingReturnBatches(true);
      try {
        const res = await api.get("/sales-stock", {
          params: { sales_store_id: returnStore }
        });
        const stocks = res.data?.data || [];
        const filtered = stocks.filter((s: any) => s.product_id === selectedAllocationToReturn.product_id);
        const batchRefs = Array.from(new Set(filtered.map((s: any) => s.batch_reference).filter(Boolean))) as string[];
        
        const origBatch = selectedAllocationToReturn.batch_reference;
        if (origBatch && !batchRefs.includes(origBatch)) {
          batchRefs.push(origBatch);
        }
        
        setReturnStoreBatches(batchRefs);
      } catch (err) {
        console.error("Failed to load return batches:", err);
        setReturnStoreBatches([]);
      } finally {
        setLoadingReturnBatches(false);
      }
    };
    fetchReturnBatches();
  }, [returnStore, selectedAllocationToReturn]);

  const handleReturnAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocationToReturn || !returnStore || !returnQty) {
      alert("Please fill all required return fields.");
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const res = await api.post(`/replacement-allocations/${selectedAllocationToReturn.id}/return`, {
        sales_store_id: returnStore,
        batch_reference: returnBatch || null,
        quantity: parseFloat(returnQty)
      });
      if (res.data?.success) {
        alert("Leftover replacements returned to store successfully!");
        setShowReturnModal(false);
        setSelectedAllocationToReturn(null);
        setReturnQty("");
        setReturnBatch("");
        fetchAllocations();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to return replacements.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (activeTab === "vouchers") {
      fetchReturns();
    } else {
      fetchAllocations();
      fetchOrders();
      fetchSalesStores();
      fetchDrivers();
    }
  }, [activeTab, searchTerm, reasonFilter, typeFilter]);

  const handleCustomerChange = async (customerId: string) => {
    setFormCustomer(customerId);
    setFormOrder("");
    setFormProduct("");
    setFormOrderProductOptions([]);
    setSelectedOrderDetails(null);
    setQtyError("");
    setFormQty("");
    if (!customerId) {
      setCustomerOrders([]);
      return;
    }
    try {
      setLoadingOrders(true);
      const res = await api.get("/orders", {
        params: {
          customer_id: customerId,
          status: "delivered",
          per_page: 100
        }
      });
      if (res.data && res.data.success) {
        setCustomerOrders(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderChange = (orderId: string) => {
    setFormOrder(orderId);
    setFormProduct("");
    setQtyError("");
    setFormQty("");
    if (!orderId) {
      setSelectedOrderDetails(null);
      setFormOrderProductOptions([]);
      return;
    }
    const order = customerOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderDetails(order);
      const options = (order.items || []).map((item: any) => ({
        label: `${item.product?.name || "Product"} - UGX ${parseFloat(item.unit_price).toLocaleString()} (Ordered: ${parseFloat(item.quantity)})`,
        value: item.product_id,
        price: parseFloat(item.unit_price),
        maxQty: parseFloat(item.quantity)
      }));
      setFormOrderProductOptions(options);
    }
  };

  const handleProductChange = (productId: string) => {
    setFormProduct(productId);
    setFormQty("");
    setQtyError("");
  };

  const handleQtyChange = (val: string) => {
    setFormQty(val);
    if (!val) {
      setQtyError("");
      return;
    }
    const matchedOpt = formOrderProductOptions.find(o => o.value === formProduct);
    if (matchedOpt && parseFloat(val) > matchedOpt.maxQty) {
      setQtyError(`Returned quantity cannot exceed ordered quantity (${matchedOpt.maxQty})`);
    } else {
      setQtyError("");
    }
  };

  const handlePostLedger = async (id: string) => {
    try {
      const res = await api.post(`/returns/${id}/post-credit`);
      if (res.data && res.data.success) {
        fetchReturns();
        if (selectedReturn && selectedReturn.id === id) {
          setSelectedReturn(prev => prev ? { ...prev, account_credit_posted: true } : null);
        }
      }
    } catch (err: any) {
      console.error("Error posting return credit:", err);
      alert(err.response?.data?.message || "Failed to post return credit.");
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formProduct || !formQty || !formOrder || qtyError) return;

    const matchedDelivery = selectedOrderDetails?.deliveries?.[0];
    if (!matchedDelivery) {
      alert("Error: No delivery record found associated with this order.");
      return;
    }

    const matchedProductOption = formOrderProductOptions.find(p => p.value === formProduct);
    const unitPrice = matchedProductOption ? matchedProductOption.price : 0;

    try {
      const res = await api.post("/returns", {
        customer_id: formCustomer,
        product_id: formProduct,
        order_id: formOrder,
        delivery_id: matchedDelivery.id,
        quantity: parseFloat(formQty),
        unit_price: unitPrice,
        return_type: formType,
        reason_code: formReason,
        notes: formNotes,
        return_date: format(new Date(), "yyyy-MM-dd")
      });

      if (res.data && res.data.success) {
        setIsNewModalOpen(false);
        // Reset form
        setFormCustomer("");
        setFormOrder("");
        setFormProduct("");
        setFormQty("");
        setFormNotes("");
        setSelectedOrderDetails(null);
        setFormOrderProductOptions([]);
        fetchReturns();
      }
    } catch (err: any) {
      console.error("Error creating return voucher:", err);
      alert(err.response?.data?.message || "Failed to record return voucher.");
    }
  };

  // Calculate metrics
  const totalReturnVal = returns.reduce((acc, curr) => acc + curr.monetary_value, 0);
  const pendingCreditVal = returns
    .filter(r => !r.account_credit_posted && r.return_type === "credit")
    .reduce((acc, curr) => acc + curr.monetary_value, 0);
  const totalCount = returns.length;

  const matchedProductOption = formOrderProductOptions.find(p => p.value === formProduct);
  const unitPrice = matchedProductOption ? matchedProductOption.price : 0;
  const estimatedValue = (parseFloat(formQty) || 0) * unitPrice;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Returns & Replacements</h1>
            <p className="text-gray-500 font-body">Manage customer return vouchers, replacements and credit postings</p>
          </div>
          {activeTab === "vouchers" && (
            <Button 
              onClick={() => setIsNewModalOpen(true)}
              className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-bold shadow-md hover:scale-[1.02] transition-all duration-200"
            >
              <Plus size={18} />
              Record Return Voucher
            </Button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-250 gap-6">
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "vouchers"
                ? "border-brand-forest text-brand-forest"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Return Vouchers
          </button>
          <button
            onClick={() => setActiveTab("replacements")}
            className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "replacements"
                ? "border-brand-forest text-brand-forest"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Replacement Allocations
          </button>
        </div>

        {/* Metric Cards & Views */}
        {activeTab === "vouchers" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white overflow-hidden relative">
            <CardContent className="pt-6">
              <div className="absolute right-4 top-4 bg-white/10 p-2 rounded-lg text-white/80">
                <TrendingDown size={24} />
              </div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Total Return Value (MTD)</p>
              <h3 className="text-3xl font-bold font-heading mt-1">UGX {totalReturnVal.toLocaleString()}</h3>
              <p className="text-[10px] text-white/90 font-medium mt-2 flex items-center gap-1">
                From {totalCount} return vouchers recorded
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-brand-yellow">
            <CardContent className="pt-6">
              <div className="absolute right-4 top-4 bg-amber-50 p-2 rounded-lg text-brand-amber">
                <Coins size={24} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pending Accounts Credit</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">UGX {pendingCreditVal.toLocaleString()}</h3>
              <p className="text-[10px] text-brand-amber font-medium mt-2">
                Requires posting to customer ledgers
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-brand-mid">
            <CardContent className="pt-6">
              <div className="absolute right-4 top-4 bg-brand-sage/20 p-2 rounded-lg text-brand-forest">
                <RefreshCcw size={24} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Replacements</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">
                {returns.filter(r => r.return_type === "physical_replacement" && !r.account_credit_posted).length} Pending
              </h3>
              <p className="text-[10px] text-brand-mid font-medium mt-2">
                Requires warehouse dispatch reconciliation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by voucher #, customer or product..." 
              className="pl-10 h-11 border-gray-200 focus:border-brand-forest rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="w-[180px]">
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest"
              >
                <option value="">All Reason Codes</option>
                {Object.entries(reasonLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="w-[180px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest"
              >
                <option value="">All Types</option>
                <option value="credit">Credit Note</option>
                <option value="physical_replacement">Replacement</option>
              </select>
            </div>
            
            {(reasonFilter || typeFilter || searchTerm) && (
              <Button 
                variant="ghost" 
                className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                onClick={() => {
                  setSearchTerm("");
                  setReasonFilter("");
                  setTypeFilter("");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-sage overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-medium">
              Loading return vouchers...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/55">
                <TableRow>
                  <TableHead className="font-semibold text-brand-forest">Voucher & Batch #</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Customer & Store</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Date Returned</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Product Details</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Returned vs Replaced</TableHead>
                  <TableHead className="font-semibold text-brand-forest text-right">Value (UGX)</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Type / Date Replaced</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Reason</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Acknowledged By</TableHead>
                  <TableHead className="font-semibold text-brand-forest">Signature</TableHead>
                  <TableHead className="font-semibold text-brand-forest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                      No return vouchers found. Try adjusting your search filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/40 transition-colors">
                      <TableCell className="text-sm">
                        <div className="font-mono font-bold text-brand-forest">{item.voucher_number}</div>
                        {item.batch_reference && (
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            Batch: {item.batch_reference}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-semibold text-gray-900">{item.customer}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Store: <span className="font-semibold text-brand-forest">{item.store_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        <div className="font-medium text-gray-800">{format(new Date(item.return_date), "dd MMM yyyy")}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">By: {item.created_by}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium text-gray-800">{item.product}</span>
                        <span className="block text-xs text-gray-500">Unit Price: UGX {item.unit_price.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-bold text-gray-900">{item.quantity} Trays</div>
                        {item.return_type === "physical_replacement" ? (
                          <div className="mt-1 space-y-1">
                            <div className="text-[10px] font-semibold text-brand-mid">
                              Replaced: {item.replacement_quantity} / {item.quantity}
                            </div>
                            <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-forest h-full rounded-full"
                                style={{ width: `${Math.min(100, (item.replacement_quantity / item.quantity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 mt-0.5">N/A (Credit)</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 text-sm">
                        {item.monetary_value.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="mb-1 flex flex-wrap gap-1">
                          {item.return_type === "credit" ? (
                            <Badge variant="processing" className="text-[9px] bg-blue-50 text-blue-700 border-none">CREDIT NOTE</Badge>
                          ) : (
                            <Badge variant="ready" className="text-[9px] bg-indigo-50 text-indigo-700 border-none">REPLACEMENT</Badge>
                          )}
                          {item.account_credit_posted ? (
                            <Badge variant="delivered" className="text-[9px] bg-green-50 text-green-700 flex items-center gap-0.5 border-none">
                              <CheckCircle2 size={8} /> POSTED
                            </Badge>
                          ) : (
                            item.return_type === "credit" && (
                              <Badge variant="pending" className="text-[9px] bg-amber-50 text-amber-700 flex items-center gap-0.5 border-none">
                                <AlertTriangle size={8} /> PENDING
                              </Badge>
                            )
                          )}
                        </div>
                        {item.return_type === "physical_replacement" && (
                          <div className="text-[10px] text-gray-500">
                            Replaced: {item.date_replaced ? format(new Date(item.date_replaced), "dd MMM yyyy") : <span className="text-amber-600 font-bold">Pending</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${reasonColors[item.reason_code] || "bg-gray-50 text-gray-700"}`}>
                          {reasonLabels[item.reason_code] || item.reason_code}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-800">
                        {item.acknowledged_by || <span className="text-gray-400 font-medium">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {item.signature_path ? (
                          <div className="relative group flex items-center">
                            <img 
                              src={getSignatureUrl(item.signature_path) || ""} 
                              alt="Signature" 
                              className="h-8 w-16 object-contain bg-gray-50 border border-gray-200 rounded hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => setSelectedSignatureUrl(getSignatureUrl(item.signature_path))}
                              title="Click to view signature"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-brand-sage/30"
                            onClick={() => setSelectedReturn(item)}
                          >
                            <Eye size={16} className="text-brand-forest" />
                          </Button>
                          {!item.account_credit_posted && item.return_type === "credit" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-green-50 text-green-600 animate-pulse"
                              onClick={() => handlePostLedger(item.id)}
                              title="Post Credit to Customer Ledger"
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* View Details Drawer / Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="h-full w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in p-6 overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="text-brand-forest" size={24} />
                  <div>
                    <h3 className="font-heading font-bold text-xl text-brand-forest">Return Voucher</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-mono text-gray-500">{selectedReturn.voucher_number}</p>
                      {selectedReturn.batch_reference && (
                        <span className="text-[10px] bg-brand-yellow/10 text-brand-forest font-bold px-1.5 py-0.5 rounded border border-brand-yellow/20">
                          Batch: {selectedReturn.batch_reference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReturn(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Status bar */}
                <div className={`p-4 rounded-xl flex items-center justify-between border ${selectedReturn.account_credit_posted ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    {selectedReturn.account_credit_posted ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    Ledger Status: {selectedReturn.account_credit_posted ? "POSTED" : "PENDING CREDIT"}
                  </span>
                  {!selectedReturn.account_credit_posted && selectedReturn.return_type === "credit" && (
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs border-none"
                      onClick={() => handlePostLedger(selectedReturn.id)}
                    >
                      Post to Account
                    </Button>
                  )}
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Customer</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedReturn.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Origin Store</p>
                    <p className="font-bold text-brand-forest mt-0.5">{selectedReturn.store_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date Recorded</p>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {format(new Date(selectedReturn.return_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Recorded By</p>
                    <p className="font-medium text-gray-700 mt-0.5">{selectedReturn.created_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Delivery Ref</p>
                    <p className="font-mono text-xs text-brand-mid font-bold mt-0.5">{selectedReturn.delivery_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Order Ref</p>
                    <p className="font-mono text-xs text-brand-mid font-bold mt-0.5">{selectedReturn.order_number}</p>
                  </div>
                </div>

                {/* Product specifics */}
                <div className="border border-brand-sage rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Particulars</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-brand-forest">{selectedReturn.product}</p>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>Quantity returned: <span className="font-bold text-gray-700">{selectedReturn.quantity} Trays</span></p>
                        {selectedReturn.return_type === "physical_replacement" && (
                          <p>Replaced quantity: <span className="font-bold text-green-700">{selectedReturn.replacement_quantity} / {selectedReturn.quantity} Trays</span></p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Unit Price</p>
                      <p className="font-semibold text-gray-800 text-sm">UGX {selectedReturn.unit_price.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedReturn.return_type === "physical_replacement" && (
                    <div className="pt-2 border-t border-brand-sage/40">
                      <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                        <span>Replacement Progress</span>
                        <span>{Math.round((selectedReturn.replacement_quantity / selectedReturn.quantity) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-forest h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (selectedReturn.replacement_quantity / selectedReturn.quantity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="border-t border-brand-sage/60 pt-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Value Adjusted:</span>
                    <span className="text-lg font-extrabold text-rose-600">UGX {selectedReturn.monetary_value.toLocaleString()}</span>
                  </div>
                </div>

                {/* Reason & notes */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Reason for Return</p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${reasonColors[selectedReturn.reason_code] || "bg-gray-50 text-gray-700"}`}>
                      {reasonLabels[selectedReturn.reason_code] || selectedReturn.reason_code}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Return Resolution Type</p>
                    {selectedReturn.return_type === "credit" ? (
                      <Badge variant="processing" className="text-xs border-none bg-blue-50 text-blue-700">Credit Note (Balance Adjustment)</Badge>
                    ) : (
                      <Badge variant="ready" className="text-xs border-none bg-indigo-50 text-indigo-700">Physical Replacement (Goods Resent)</Badge>
                    )}
                  </div>

                  {selectedReturn.return_type === "physical_replacement" && (
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date Replaced</p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedReturn.date_replaced ? format(new Date(selectedReturn.date_replaced), "dd MMM yyyy") : <span className="text-amber-600 font-bold">Pending Replacement Delivery</span>}
                      </p>
                    </div>
                  )}

                  {selectedReturn.acknowledged_by && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Acknowledge / Signature Proof</p>
                        <p className="text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                          <span>Received By:</span>
                          <span className="text-brand-forest">{selectedReturn.acknowledged_by}</span>
                        </p>
                      </div>
                      {selectedReturn.signature_path && (
                        <div className="bg-white p-2 border border-gray-150 rounded-lg flex justify-center max-w-[200px] hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedSignatureUrl(getSignatureUrl(selectedReturn.signature_path))}>
                          <img 
                            src={getSignatureUrl(selectedReturn.signature_path) || ""} 
                            alt="Customer Acknowledgement Signature" 
                            className="h-16 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedReturn.notes && (
                    <div className="p-3 bg-rose-50/20 border border-rose-100 rounded-xl">
                      <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Adjustment Notes</p>
                      <p className="text-sm text-gray-700 mt-1 font-body leading-relaxed">{selectedReturn.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-150 pt-4 mt-6 text-center text-xs text-gray-400 font-body">
                Created by {selectedReturn.created_by}
              </div>

            </div>
          </div>
        )}

        {/* Record New Return Voucher Modal */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-brand-forest" size={24} />
                  <div>
                    <h3 className="font-heading font-bold text-xl text-brand-forest">Record Return Voucher</h3>
                    <p className="text-xs text-gray-500">Record returns for credit posting or physical replacement</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateVoucher} className="space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Customer"
                    options={customers.map(c => ({ label: c.name, value: c.id }))}
                    value={formCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                  />

                  <Select
                    label="Order Reference"
                    options={customerOrders.map(o => ({
                      label: `${o.order_number} (${format(new Date(o.order_date), "dd MMM yyyy")})`,
                      value: o.id
                    }))}
                    value={formOrder}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    disabled={!formCustomer || loadingOrders}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Delivery Reference"
                    placeholder="Auto-detected from order"
                    value={selectedOrderDetails?.deliveries?.[0] ? `LHD-${selectedOrderDetails.order_number.replace('LHO-', '')}` : ""}
                    disabled
                  />

                  <Select
                    label="Product returned"
                    options={formOrderProductOptions}
                    value={formProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                    disabled={!formOrder}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Input
                      label="Quantity returned"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formQty}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      disabled={!formProduct}
                      required
                    />
                    {qtyError && (
                      <p className="text-xs text-red-500 font-semibold">{qtyError}</p>
                    )}
                  </div>

                  <Select
                    label="Return Type"
                    options={[
                      { label: "Credit Note", value: "credit" },
                      { label: "Physical Replacement", value: "physical_replacement" }
                    ]}
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    required
                  />
                </div>

                <Select
                  label="Reason Code"
                  options={Object.entries(reasonLabels).map(([val, label]) => ({
                    label,
                    value: val
                  }))}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value as any)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 font-body">Adjustment Notes</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-0 font-body"
                    placeholder="Specify details about damage or reasons..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                {formProduct && formQty && !qtyError && (
                  <div className="p-4 bg-brand-sage/20 rounded-xl border border-brand-sage flex justify-between items-center text-sm">
                    <span className="font-semibold text-brand-forest">Estimated Value Adjusted:</span>
                    <span className="text-base font-extrabold text-rose-600 font-heading">
                      UGX {estimatedValue.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1 h-12"
                    onClick={() => setIsNewModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 bg-brand-forest hover:bg-brand-forest/90 font-bold"
                    disabled={!!qtyError || !formQty}
                  >
                    Record Return
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Allocations Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-gradient-to-br from-brand-forest to-emerald-800 text-white overflow-hidden relative">
                <CardContent className="pt-6">
                  <div className="absolute right-4 top-4 bg-white/10 p-2 rounded-lg text-white/80">
                    <TrendingDown size={24} />
                  </div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Total Allocations</p>
                  <h3 className="text-3xl font-bold font-heading mt-1">{allocMetrics.total_count}</h3>
                  <p className="text-[10px] text-white/90 font-medium mt-2">Active replacement logs</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-brand-yellow">
                <CardContent className="pt-6">
                  <div className="absolute right-4 top-4 bg-amber-50 p-2 rounded-lg text-brand-amber">
                    <RefreshCcw size={24} />
                  </div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Allocated Quantity</p>
                  <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">{allocMetrics.total_quantity} Trays</h3>
                  <p className="text-[10px] text-brand-amber font-medium mt-2">Currently checked out on trips</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white border-l-4 border-rose-600 overflow-hidden relative">
                <CardContent className="pt-6">
                  <div className="absolute right-4 top-4 bg-red-50 p-2 rounded-lg text-rose-600">
                    <Coins size={24} />
                  </div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Allocated Value</p>
                  <h3 className="text-2xl font-bold text-rose-600 font-heading mt-1">UGX {allocMetrics.total_value.toLocaleString()}</h3>
                  <p className="text-[10px] text-rose-600 font-medium mt-2">Estimated inventory monetary value</p>
                </CardContent>
              </Card>
            </div>

            {/* Allocate form and list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form card */}
              <div className="lg:col-span-1">
                <Card className="border border-brand-sage/40 shadow-sm rounded-xl bg-white sticky top-20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-150">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-forest">Assign Replacements</h4>
                    </div>
                    <form onSubmit={handleAssignReplacement} className="space-y-4 text-xs">
                       <div className="relative">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Search Order (Alphanumeric / Last 4 Digits) *</label>
                        <input
                          type="text"
                          placeholder="Type Order # (e.g. 0006, 2026-0006)..."
                          value={orderSearchText}
                          onChange={(e) => {
                            setOrderSearchText(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                        />
                        
                        {showSuggestions && orderSearchText.trim() !== "" && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-sage/35 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto text-xs divide-y divide-gray-100">
                            {filteredOrderOptions.length === 0 ? (
                              <div className="p-3 text-gray-400 text-center font-semibold">No orders matched</div>
                            ) : (
                              filteredOrderOptions.map(order => (
                                <button
                                  key={order.id}
                                  type="button"
                                  onClick={() => {
                                    handleAllocOrderChange(order.id);
                                    setOrderSearchText(order.order_number);
                                    setShowSuggestions(false);
                                  }}
                                  className="w-full text-left p-3 hover:bg-brand-forest/5 hover:text-brand-forest transition-colors font-bold flex justify-between items-center"
                                >
                                  <span>{order.order_number}</span>
                                  <span className="text-[10px] text-gray-400 font-normal">{order.customer?.name || "HQ"}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        
                        {allocOrder && (
                          <div className="mt-2 p-2 bg-brand-forest/5 rounded-lg border border-brand-forest/15 text-[10px] text-brand-forest font-semibold flex justify-between items-center">
                            <span>Selected: {orders.find(o => o.id === allocOrder)?.order_number} ({orders.find(o => o.id === allocOrder)?.customer?.name || "HQ"})</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                handleAllocOrderChange("");
                                setOrderSearchText("");
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              Clear Selection
                            </button>
                          </div>
                        )}
                      </div>

                      {allocOrder && allocOrderItems.length > 0 && (
                        <>
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Product *</label>
                            <select
                              required
                              value={allocProduct}
                              onChange={(e) => setAllocProduct(e.target.value)}
                              className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest"
                            >
                              <option value="">-- Choose Product --</option>
                              {allocOrderItems.map(item => (
                                <option key={item.product_id} value={item.product_id}>
                                  {item.product?.name || "Product"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Source Sales Store *</label>
                            <select
                              required
                              value={allocStore}
                              onChange={(e) => setAllocStore(e.target.value)}
                              className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest"
                            >
                              <option value="">-- Choose Store --</option>
                              {salesStores.map(store => (
                                <option key={store.id} value={store.id}>
                                  {store.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Select Driver *</label>
                            <select
                              required
                              value={allocDriver}
                              onChange={(e) => setAllocDriver(e.target.value)}
                              className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest"
                            >
                              <option value="">-- Choose Driver --</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.name || d.full_name} ({d.vehicle_registration !== 'N/A' ? d.vehicle_registration : 'No Vehicle'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Quantity (Trays) *</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={allocQty}
                                onChange={(e) => setAllocQty(e.target.value)}
                                className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Select Batch *</label>
                              <select
                                required
                                value={allocBatch}
                                onChange={(e) => setAllocBatch(e.target.value)}
                                className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest"
                                disabled={loadingBatches || !allocStore}
                              >
                                <option value="">{loadingBatches ? "Loading batches..." : "-- Select Batch --"}</option>
                                {availableBatches.map((b: any) => (
                                  <option key={b.batch_reference || 'unbatched'} value={b.batch_reference || ""}>
                                    {b.batch_reference || "Unbatched"} ({parseFloat(b.current_quantity)} available)
                                  </option>
                                ))}
                              </select>
                              {availableBatches.length === 0 && allocStore && allocProduct && !loadingBatches && (
                                <p className="text-[9px] text-red-500 font-bold mt-1">⚠️ No available stock in this sales store.</p>
                              )}
                            </div>
                          </div>

                          <Button
                            type="submit"
                            isLoading={isSubmittingAllocation}
                            className="w-full h-11 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-black tracking-widest text-xs uppercase rounded-lg border-none shadow-md mt-2 cursor-pointer"
                          >
                            Allocate replacements
                          </Button>
                        </>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Table card */}
              <div className="lg:col-span-2">
                <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                  <div className="p-5 border-b border-gray-150">
                    <h4 className="text-sm font-black uppercase tracking-wider text-brand-forest">Active Allocations Registry</h4>
                  </div>
                  <div className="overflow-x-auto">
                    {loadingAllocations ? (
                      <div className="py-20 text-center text-xs text-gray-400">Loading allocations...</div>
                    ) : allocations.length === 0 ? (
                      <div className="py-20 text-center text-xs text-gray-400">No allocations recorded.</div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-gray-50/55">
                          <TableRow>
                            <TableHead className="font-semibold text-brand-forest">Order #</TableHead>
                            <TableHead className="font-semibold text-brand-forest">Product Details</TableHead>
                            <TableHead className="font-semibold text-brand-forest">Allocated Store / Batch</TableHead>
                            <TableHead className="font-semibold text-brand-forest text-center">Allocated</TableHead>
                            <TableHead className="font-semibold text-brand-forest text-center">Delivered</TableHead>
                            <TableHead className="font-semibold text-brand-forest text-center">Returned</TableHead>
                            <TableHead className="font-semibold text-brand-forest text-center">Leftover</TableHead>
                            <TableHead className="font-semibold text-brand-forest">Status</TableHead>
                            <TableHead className="font-semibold text-brand-forest text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allocations.map(alloc => {
                            const leftover = alloc.allocated_quantity - alloc.delivered_quantity - alloc.returned_quantity;
                            return (
                              <TableRow key={alloc.id} className="hover:bg-gray-50/40 transition-colors">
                                <TableCell className="font-mono font-bold text-brand-forest text-xs">{alloc.order?.order_number || "N/A"}</TableCell>
                                <TableCell className="text-xs font-semibold text-gray-800">{alloc.product?.name}</TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  <div className="font-semibold">{alloc.sales_store?.name}</div>
                                  {alloc.batch_reference && <div className="text-[10px] font-mono">Batch: {alloc.batch_reference}</div>}
                                  {alloc.driver && (
                                    <div className="text-[10px] font-bold text-brand-mid mt-0.5">🚚 {alloc.driver.full_name || alloc.driver.name}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs">{alloc.allocated_quantity}</TableCell>
                                <TableCell className="text-center font-bold text-xs text-green-600">{alloc.delivered_quantity}</TableCell>
                                <TableCell className="text-center font-bold text-xs text-blue-600">{alloc.returned_quantity}</TableCell>
                                <TableCell className="text-center font-bold text-xs text-red-500">{leftover}</TableCell>
                                <TableCell>
                                  <Badge className={`text-[9px] font-black uppercase tracking-wider ${
                                    alloc.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                    alloc.status === 'returned' ? 'bg-blue-50 text-blue-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {alloc.status.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {leftover > 0 ? (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAllocationToReturn(alloc);
                                        setReturnStore(alloc.sales_store_id);
                                        setReturnQty(leftover.toString());
                                        setReturnBatch(alloc.batch_reference || "");
                                        setIsCustomReturnBatch(false);
                                        setShowReturnModal(true);
                                      }}
                                      className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold text-[10px] uppercase cursor-pointer h-8 border-none"
                                    >
                                      Return Leftover
                                    </Button>
                                  ) : "—"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* 🔄 RETURN LEFTOVER MODAL */}
        {showReturnModal && selectedAllocationToReturn && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white border border-brand-sage/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs text-gray-800">
              {/* Header */}
              <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center border-b border-brand-sage/30">
                <h3 className="font-heading font-black text-sm text-brand-yellow">Return Leftovers to Store</h3>
                <button 
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedAllocationToReturn(null);
                  }} 
                  className="text-white hover:text-red-300 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleReturnAllocationSubmit} className="p-5 space-y-4">
                <p className="text-gray-650 leading-normal font-medium">
                  Reconcile leftovers of <span className="font-bold text-brand-forest">{selectedAllocationToReturn.product?.name}</span> back to inventory.
                </p>

                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Target Sales Store *</label>
                  <select
                    required
                    value={returnStore}
                    onChange={(e) => handleReturnStoreChange(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="">-- Choose Store --</option>
                    {salesStores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Quantity to Return *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      max={selectedAllocationToReturn.allocated_quantity - selectedAllocationToReturn.delivered_quantity - selectedAllocationToReturn.returned_quantity}
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Batch Number *</label>
                    {isCustomReturnBatch ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Batch #102"
                          value={returnBatch}
                          onChange={(e) => setReturnBatch(e.target.value)}
                          className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                        />
                        {returnStore === selectedAllocationToReturn.sales_store_id && (
                          <button
                            type="button"
                            onClick={() => setIsCustomReturnBatch(false)}
                            className="text-[8px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5"
                          >
                            ← Choose existing batch
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <select
                          required
                          value={returnBatch}
                          onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              setIsCustomReturnBatch(true);
                              setReturnBatch("");
                            } else {
                              setReturnBatch(e.target.value);
                            }
                          }}
                          className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-forest"
                          disabled={loadingReturnBatches}
                        >
                          <option value="">{loadingReturnBatches ? "Loading..." : "-- Select Batch --"}</option>
                          {returnStoreBatches.map(batch => (
                            <option key={batch} value={batch}>
                              {batch} {batch === selectedAllocationToReturn.batch_reference ? " (Original)" : ""}
                            </option>
                          ))}
                          <option value="__custom__">➕ Enter Custom...</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomReturnBatch(true);
                            setReturnBatch("");
                          }}
                          className="text-[8px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5 text-left"
                        >
                          Or enter new batch reference →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/20">
                  <Button 
                    type="button" 
                    onClick={() => {
                      setShowReturnModal(false);
                      setSelectedAllocationToReturn(null);
                    }} 
                    className="bg-transparent hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl h-9 px-4 border border-brand-sage/60"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    isLoading={isSubmittingReturn}
                    className="bg-brand-yellow hover:bg-[#E08C00] text-brand-forest text-xs font-black rounded-xl h-9 px-4 cursor-pointer"
                  >
                    Confirm Return
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Signature Lightbox Modal */}
        {selectedSignatureUrl && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
            onClick={() => setSelectedSignatureUrl(null)}
          >
            <div className="bg-white p-6 rounded-2xl max-w-lg w-full flex flex-col items-center justify-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <button 
                className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                onClick={() => setSelectedSignatureUrl(null)}
              >
                <X size={18} />
              </button>
              <h3 className="text-sm font-bold text-gray-800 mb-4">Customer Signature Proof</h3>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl w-full flex justify-center">
                <img 
                  src={selectedSignatureUrl} 
                  alt="Customer Signature Proof" 
                  className="max-h-[50vh] max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
