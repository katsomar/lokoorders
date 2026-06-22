"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  Search, 
  Plus, 
  Download, 
  Filter,
  Eye,
  Calendar,
  Wallet,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  User,
  CheckCircle2,
  FileText
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
import { format } from "date-fns";
import api from "@/lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(15);

  // Metrics
  const [metrics, setMetrics] = useState({
    total_mtd_collections: 0,
    top_method: "N/A",
    top_method_share: 0,
    total_outstanding: 0,
  });

  // Selected Payment details inspection
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/payments", {
        params: {
          search: debouncedSearch || undefined,
          payment_method: methodFilter || undefined,
          page: currentPage,
          per_page: perPage,
        }
      });
      const responseData = res.data.data;
      if (responseData) {
        setPayments(responseData.data || []);
        setCurrentPage(responseData.current_page || 1);
        setTotalPages(responseData.last_page || 1);
        setTotalItems(responseData.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/payments/metrics");
      if (res.data.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [debouncedSearch, methodFilter, currentPage]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash';
      case 'mobile_money': return 'Mobile Money';
      case 'cheque': return 'Cheque';
      case 'efris_credit': return 'EFRIS Credit';
      default: return method;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'bank_transfer': 
        return <Badge className="bg-blue-100 text-blue-700 border-none uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">Bank</Badge>;
      case 'cash': 
        return <Badge className="bg-green-100 text-green-700 border-none uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">Cash</Badge>;
      case 'mobile_money': 
        return <Badge className="bg-amber-100 text-amber-700 border-none uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">Mobile</Badge>;
      case 'cheque':
        return <Badge className="bg-purple-100 text-purple-700 border-none uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">Cheque</Badge>;
      default: 
        return <Badge className="bg-gray-100 text-gray-700 border-none uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">{method}</Badge>;
    }
  };

  const formatCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    return `UGX ${val.toLocaleString()}`;
  };

  const formatCompactCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    if (val >= 1_000_000) {
      return `UGX ${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `UGX ${(val / 1_000).toFixed(0)}K`;
    }
    return `UGX ${val.toLocaleString()}`;
  };

  const handleOpenDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setMethodFilter("");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading leading-none flex items-center gap-2">
              <CreditCard className="text-brand-forest" size={26} />
              Payments & Collections
            </h1>
            <p className="text-gray-500 font-body text-xs mt-1.5">Track incoming revenue and customer account credits</p>
          </div>
          <Link href="/payments/new">
            <Button className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5 flex items-center">
              <Plus size={16} />
              Record New Payment
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-brand-sage/40 shadow-sm bg-brand-forest text-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <p className="text-white/60 text-[10px] font-extrabold uppercase tracking-wider">Total Collected (MTD)</p>
              <h3 className="text-2xl font-black font-heading mt-1">{formatCompactCurrency(metrics.total_mtd_collections)}</h3>
              <p className="text-[10px] text-brand-yellow font-bold mt-2 flex items-center gap-1">
                Active billing cycle collections
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Top Payment Method</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1">{getMethodLabel(metrics.top_method)}</h3>
              <p className="text-[10px] text-gray-500 font-medium mt-2">
                {metrics.top_method_share}% of all collections
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Outstanding Receivables</p>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1">{formatCompactCurrency(metrics.total_outstanding)}</h3>
              <p className="text-[10px] text-red-500 font-bold mt-2">
                Pending customer account balances
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search by payment #, ref # or customer..." 
              className="pl-10 text-xs h-9.5 rounded-xl border-brand-sage/60 focus:ring-brand-forest focus:border-brand-forest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3.5 w-full lg:w-auto">
            <div className="w-48">
              <select
                className="flex h-9.5 w-full rounded-xl border border-brand-sage/60 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-forest"
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Payment Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            
            {(searchTerm || methodFilter) && (
              <Button 
                variant="ghost" 
                onClick={handleResetFilters}
                className="h-9.5 px-3 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl gap-1"
              >
                <RefreshCw size={12} />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Payments Table Card */}
        <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-gray-500 font-bold">
                <Loader2 className="animate-spin text-brand-forest" size={32} />
                Loading payments...
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="text-gray-400 mb-2" size={32} />
                <h3 className="text-xs font-bold text-gray-700">No payments found</h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm">No payment records match your filters or are available in the database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6">Payment #</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Customer</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Date</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Method</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Ref Reference</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Amount (UGX)</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Status</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                        <TableCell className="font-mono font-extrabold text-brand-forest text-xs pl-6 py-4">
                          {payment.payment_number}
                        </TableCell>
                        <TableCell className="font-bold text-gray-800 text-xs">
                          {payment.customer?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-medium">
                          {payment.payment_date ? format(new Date(payment.payment_date), "dd MMM yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          {getMethodBadge(payment.payment_method)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-500 font-mono">
                          {payment.reference_number || "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-black text-brand-forest text-xs font-heading">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 border-none text-[10px] font-extrabold py-0.5 px-2.5 rounded-lg">
                            COMPLETED
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-brand-sage/20 rounded-lg text-brand-forest transition-colors"
                            onClick={() => handleOpenDetails(payment)}
                          >
                            <Eye size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1">
            <span className="text-xs text-gray-500 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Total: <strong>{totalItems}</strong> payments)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT DETAILS INSPECTION DRAWER/MODAL OVERLAY */}
      {isDetailsOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-sage/40 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-brand-forest flex items-center gap-1.5">
                  <CreditCard size={18} />
                  Payment Details: {selectedPayment.payment_number}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Recorded and allocated in real time</p>
              </div>
              <button 
                onClick={() => { setIsDetailsOpen(false); setSelectedPayment(null); }}
                className="h-8 w-8 hover:bg-brand-sage/20 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Payment Info Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-sage/10 p-5 rounded-xl border border-brand-sage/20">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Customer</span>
                    <span className="text-xs font-extrabold text-gray-800">{selectedPayment.customer?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Payment Date</span>
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      {selectedPayment.payment_date ? format(new Date(selectedPayment.payment_date), "EEEE, dd MMMM yyyy") : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Payment Method</span>
                    <div className="mt-1">{getMethodBadge(selectedPayment.payment_method)}</div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Amount Paid</span>
                    <span className="text-lg font-black text-green-600 font-heading">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Reference Number</span>
                    <span className="text-xs font-bold text-gray-600 font-mono bg-white px-2 py-0.5 rounded border border-brand-sage/30 mt-0.5 inline-block">
                      {selectedPayment.reference_number || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Recorded By</span>
                    <span className="text-xs font-bold text-gray-600 flex items-center gap-1 mt-0.5">
                      <User size={12} className="text-gray-400" />
                      {selectedPayment.user?.name || "Administrator"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Notes */}
              {selectedPayment.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Notes / Description</span>
                  <p className="text-xs text-gray-600 italic mt-1 leading-relaxed">"{selectedPayment.notes}"</p>
                </div>
              )}

              {/* Allocations Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  Invoice Allocations
                </h4>
                <div className="border border-brand-sage/30 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-brand-sage/20">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold text-brand-forest">Invoice #</TableHead>
                        <TableHead className="text-[10px] font-bold text-brand-forest">Date</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-brand-forest">Invoice Total</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-brand-forest">Allocated Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!selectedPayment.allocations || selectedPayment.allocations.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-[11px] text-gray-500 italic">
                            Unallocated payment (credited to customer account balance)
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedPayment.allocations.map((alloc: any) => (
                          <TableRow key={alloc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            <TableCell className="font-mono text-xs font-extrabold text-brand-forest">
                              {alloc.invoice?.invoice_number || "N/A"}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 font-medium">
                              {alloc.invoice?.issue_date ? format(new Date(alloc.invoice.issue_date), "dd MMM yyyy") : "N/A"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-600">
                              {formatCurrency(alloc.invoice?.total_amount)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-black text-green-600 font-heading">
                              {formatCurrency(alloc.amount_allocated)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>

            <div className="bg-gray-50 border-t border-brand-sage/40 px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => { setIsDetailsOpen(false); setSelectedPayment(null); }}
                className="h-9 px-4 bg-brand-forest hover:bg-brand-forest/90 text-white font-bold border-none rounded-xl text-xs"
              >
                Close details
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
