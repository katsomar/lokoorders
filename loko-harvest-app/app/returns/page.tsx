"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Download, 
  Filter,
  Eye,
  Calendar,
  Wallet,
  ArrowRight,
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

interface ReturnVoucher {
  id: string;
  voucher_number: string;
  customer: string;
  delivery_id: string;
  order_id: string;
  return_date: string;
  product: string;
  quantity: number;
  unit_price: number;
  monetary_value: number;
  reason_code: "broken_cracked" | "rotten_spoiled" | "wrong_product" | "near_expiry" | "packaging_damage" | "other";
  return_type: "credit" | "physical_replacement";
  account_credit_posted: boolean;
  notes: string;
  created_by: string;
}

const mockReturnsInitial: ReturnVoucher[] = [
  {
    id: "1",
    voucher_number: "LHRV-2026-0001",
    customer: "Carrefour Oasis",
    delivery_id: "LHD-0039",
    order_id: "LHO-0039",
    return_date: "2026-05-15",
    product: "Grade A Eggs (Large)",
    quantity: 5,
    unit_price: 15000,
    monetary_value: 75000,
    reason_code: "broken_cracked",
    return_type: "credit",
    account_credit_posted: true,
    notes: "15 eggs were cracked upon delivery arrival.",
    created_by: "Sarah Namubiru"
  },
  {
    id: "2",
    voucher_number: "LHRV-2026-0002",
    customer: "Shoprite Lugogo",
    delivery_id: "LHD-0035",
    order_id: "LHO-0035",
    return_date: "2026-05-14",
    product: "Fresh Milk 1L",
    quantity: 20,
    unit_price: 3500,
    monetary_value: 70000,
    reason_code: "rotten_spoiled",
    return_type: "physical_replacement",
    account_credit_posted: false,
    notes: "Milk turned sour, batch code mismatch.",
    created_by: "John Okello"
  },
  {
    id: "3",
    voucher_number: "LHRV-2026-0003",
    customer: "Café Javas",
    delivery_id: "LHD-0031",
    order_id: "LHO-0031",
    return_date: "2026-05-12",
    product: "Organic Tomatoes (KG)",
    quantity: 12.5,
    unit_price: 6000,
    monetary_value: 75000,
    reason_code: "wrong_product",
    return_type: "credit",
    account_credit_posted: true,
    notes: "Delivered cherry tomatoes instead of regular slicing tomatoes.",
    created_by: "Musa Driver"
  },
  {
    id: "4",
    voucher_number: "LHRV-2026-0004",
    customer: "KFC Bukoto",
    delivery_id: "LHD-0028",
    order_id: "LHO-0028",
    return_date: "2026-05-10",
    product: "Fresh Chicken Capons",
    quantity: 30,
    unit_price: 14000,
    monetary_value: 420000,
    reason_code: "near_expiry",
    return_type: "credit",
    account_credit_posted: false,
    notes: "Under 2 days of shelf-life, refused by quality control.",
    created_by: "Sarah Namubiru"
  }
];

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

const productsList = [
  { label: "Grade A Eggs (Large) - UGX 15,000", value: "Grade A Eggs (Large)", price: 15000 },
  { label: "Fresh Milk 1L - UGX 3,500", value: "Fresh Milk 1L", price: 3500 },
  { label: "Organic Tomatoes (KG) - UGX 6,000", value: "Organic Tomatoes (KG)", price: 6000 },
  { label: "Fresh Chicken Capons - UGX 14,000", value: "Fresh Chicken Capons", price: 14000 },
  { label: "Sweet Potatoes (Bag) - UGX 80,000", value: "Sweet Potatoes (Bag)", price: 80000 },
];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnVoucher[]>(mockReturnsInitial);
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modals state
  const [selectedReturn, setSelectedReturn] = useState<ReturnVoucher | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formType, setFormType] = useState<"credit" | "physical_replacement">("credit");
  const [formReason, setFormReason] = useState<ReturnVoucher["reason_code"]>("broken_cracked");
  const [formNotes, setFormNotes] = useState("");
  const [formDelivery, setFormDelivery] = useState("");
  const [formOrder, setFormOrder] = useState("");

  // Calculate metrics
  const totalReturnVal = returns.reduce((acc, curr) => acc + curr.monetary_value, 0);
  const pendingCreditVal = returns
    .filter(r => !r.account_credit_posted && r.return_type === "credit")
    .reduce((acc, curr) => acc + curr.monetary_value, 0);
  const totalCount = returns.length;

  const handlePostLedger = (id: string) => {
    setReturns(prev =>
      prev.map(r => r.id === id ? { ...r, account_credit_posted: true } : r)
    );
    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn(prev => prev ? { ...prev, account_credit_posted: true } : null);
    }
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formProduct || !formQty) return;

    const matchedProduct = productsList.find(p => p.value === formProduct);
    const price = matchedProduct ? matchedProduct.price : 5000;
    const qtyNum = parseFloat(formQty);
    const monetaryVal = qtyNum * price;

    const newVoucher: ReturnVoucher = {
      id: String(returns.length + 1),
      voucher_number: `LHRV-2026-000${returns.length + 1}`,
      customer: formCustomer,
      delivery_id: formDelivery || `LHD-00${Math.floor(Math.random() * 50) + 10}`,
      order_id: formOrder || `LHO-00${Math.floor(Math.random() * 50) + 10}`,
      return_date: new Date().toISOString().split("T")[0],
      product: formProduct,
      quantity: qtyNum,
      unit_price: price,
      monetary_value: monetaryVal,
      reason_code: formReason,
      return_type: formType,
      account_credit_posted: false,
      notes: formNotes,
      created_by: "Administrator"
    };

    setReturns(prev => [newVoucher, ...prev]);
    setIsNewModalOpen(false);

    // Reset form
    setFormCustomer("");
    setFormProduct("");
    setFormQty("");
    setFormNotes("");
    setFormDelivery("");
    setFormOrder("");
    setFormType("credit");
    setFormReason("broken_cracked");
  };

  const filteredReturns = returns.filter(item => {
    const matchesSearch = 
      item.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReason = reasonFilter ? item.reason_code === reasonFilter : true;
    const matchesType = typeFilter ? item.return_type === typeFilter : true;

    return matchesSearch && matchesReason && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Returns & Replacements</h1>
            <p className="text-gray-500 font-body">Manage customer return vouchers, replacements and credit postings</p>
          </div>
          <Button 
            onClick={() => setIsNewModalOpen(true)}
            className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-bold shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <Plus size={18} />
            Record Return Voucher
          </Button>
        </div>

        {/* Metric Cards */}
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
          <Table>
            <TableHeader className="bg-gray-50/55">
              <TableRow>
                <TableHead className="font-semibold text-brand-forest">Voucher #</TableHead>
                <TableHead className="font-semibold text-brand-forest">Customer</TableHead>
                <TableHead className="font-semibold text-brand-forest">Date</TableHead>
                <TableHead className="font-semibold text-brand-forest">Product Details</TableHead>
                <TableHead className="font-semibold text-brand-forest">Reason</TableHead>
                <TableHead className="font-semibold text-brand-forest text-right">Value (UGX)</TableHead>
                <TableHead className="font-semibold text-brand-forest">Type</TableHead>
                <TableHead className="font-semibold text-brand-forest">Ledger Post</TableHead>
                <TableHead className="font-semibold text-brand-forest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    No return vouchers found. Try adjusting your search filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <TableCell className="font-mono font-bold text-brand-forest text-sm">
                      {item.voucher_number}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 text-sm">
                      {item.customer}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {format(new Date(item.return_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium text-gray-800">{item.product}</span>
                      <span className="block text-xs text-gray-500">Qty: {item.quantity} × UGX {item.unit_price.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${reasonColors[item.reason_code] || "bg-gray-50 text-gray-700"}`}>
                        {reasonLabels[item.reason_code] || item.reason_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600 text-sm">
                      {item.monetary_value.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {item.return_type === "credit" ? (
                        <Badge variant="processing" className="text-[10px] bg-blue-50 text-blue-700">CREDIT NOTE</Badge>
                      ) : (
                        <Badge variant="ready" className="text-[10px] bg-indigo-50 text-indigo-700">REPLACEMENT</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.account_credit_posted ? (
                        <Badge variant="delivered" className="text-[10px] bg-green-50 text-green-700 flex items-center gap-1 w-max">
                          <CheckCircle2 size={10} /> POSTED
                        </Badge>
                      ) : (
                        <Badge variant="pending" className="text-[10px] bg-amber-50 text-amber-700 flex items-center gap-1 w-max">
                          <AlertTriangle size={10} /> PENDING
                        </Badge>
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
                            className="h-8 w-8 hover:bg-green-50 text-green-600"
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
                    <p className="text-xs font-mono text-gray-500">{selectedReturn.voucher_number}</p>
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
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date Recorded</p>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {format(new Date(selectedReturn.return_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Delivery Ref</p>
                    <p className="font-mono text-xs text-brand-mid font-bold mt-0.5">{selectedReturn.delivery_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Order Ref</p>
                    <p className="font-mono text-xs text-brand-mid font-bold mt-0.5">{selectedReturn.order_id}</p>
                  </div>
                </div>

                {/* Product specifics */}
                <div className="border border-brand-sage rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Particulars</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-brand-forest">{selectedReturn.product}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Quantity returned: <span className="font-bold text-gray-700">{selectedReturn.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Unit Price</p>
                      <p className="font-semibold text-gray-800 text-sm">UGX {selectedReturn.unit_price.toLocaleString()}</p>
                    </div>
                  </div>
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
                      <Badge variant="processing" className="text-xs">Credit Note (Balance Adjustment)</Badge>
                    ) : (
                      <Badge variant="ready" className="text-xs">Physical Replacement (Goods Resent)</Badge>
                    )}
                  </div>

                  {selectedReturn.notes && (
                    <div className="p-3 bg-rose-50/20 border border-rose-100 rounded-xl">
                      <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Adjustment Notes</p>
                      <p className="text-sm text-gray-700 mt-1 font-body leading-relaxed">{selectedReturn.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-150 pt-4 mt-6 text-center text-xs text-gray-400">
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
                    options={[
                      { label: "Shoprite Lugogo", value: "Shoprite Lugogo" },
                      { label: "KFC Bukoto", value: "KFC Bukoto" },
                      { label: "Café Javas", value: "Café Javas" },
                      { label: "Carrefour Oasis", value: "Carrefour Oasis" }
                    ]}
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    required
                  />

                  <Select
                    label="Product returned"
                    options={productsList}
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Delivery Reference"
                    placeholder="e.g. LHD-0042"
                    value={formDelivery}
                    onChange={(e) => setFormDelivery(e.target.value)}
                  />

                  <Input
                    label="Order Reference"
                    placeholder="e.g. LHO-0042"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Quantity returned"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    required
                  />

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
                  options={[
                    { label: "Broken / Cracked", value: "broken_cracked" },
                    { label: "Rotten / Spoiled", value: "rotten_spoiled" },
                    { label: "Wrong Product Delivered", value: "wrong_product" },
                    { label: "Near Expiry Date", value: "near_expiry" },
                    { label: "Packaging Damage", value: "packaging_damage" },
                    { label: "Other", value: "other" }
                  ]}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value as any)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 font-body">Adjustment Notes</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-0"
                    placeholder="Specify details about damage or reasons..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                {formProduct && formQty && (
                  <div className="p-4 bg-brand-sage/20 rounded-xl border border-brand-sage flex justify-between items-center text-sm">
                    <span className="font-semibold text-brand-forest">Estimated Value Adjusted:</span>
                    <span className="text-base font-extrabold text-rose-600">
                      UGX {((parseFloat(formQty) || 0) * (productsList.find(p => p.value === formProduct)?.price || 0)).toLocaleString()}
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
                  >
                    Record Return
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
