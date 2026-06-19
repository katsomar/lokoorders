"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Printer, 
  Download, 
  Building,
  Loader2,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import api from "@/lib/api";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        if (res.data.data) {
          setInvoice(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Loading invoice details...
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-red-500 font-bold">
          <AlertCircle size={36} />
          Invoice not found.
          <Button onClick={() => router.push("/invoices")} variant="outline" className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case 'paid': return 'bg-green-600/20 text-green-300 border-green-500/40';
      case 'unpaid': return 'bg-gray-600/20 text-gray-300 border-gray-500/40';
      case 'partially_paid': return 'bg-amber-600/20 text-amber-300 border-amber-500/40';
      case 'overdue': return 'bg-red-600/20 text-red-300 border-red-500/40';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-brand-sage/20">
              <ChevronLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest font-heading">Invoice Detail</h1>
              <p className="text-gray-500 font-body">{invoice.invoice_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()}>
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden bg-white rounded-2xl">
          <CardContent className="p-0">
            {/* Invoice Header Branding */}
            <div className="bg-brand-forest p-8 text-white flex justify-between items-start">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-heading tracking-tight">LOKO HARVEST LTD</h2>
                <p className="text-sm text-white/70">Quality Farm & Supermarket Logistics</p>
                <p className="text-xs text-white/60">Plot 12, Farm Road, Kampala, Uganda</p>
                <p className="text-xs text-white/60">+256 700 000 000 | billing@lokoharvest.com</p>
              </div>
              <div className="text-right space-y-2">
                <Badge variant="outline" className={`px-4 py-1 text-sm uppercase border font-extrabold rounded-lg ${getStatusBadgeClass(invoice.status)}`}>
                  {invoice.status ? invoice.status.replace('_', ' ') : 'N/A'}
                </Badge>
                <h3 className="text-4xl font-bold font-heading pt-4 tracking-tight">INVOICE</h3>
                <p className="text-white/60 text-sm">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-brand-sage/30">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-forest uppercase tracking-widest flex items-center gap-2">
                  <Building size={14} /> Bill To
                </h4>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-gray-900 leading-tight">{invoice.customer?.name || "N/A"}</p>
                  <p className="text-sm text-gray-600">{invoice.customer?.address || "N/A"}</p>
                  <p className="text-sm text-gray-600">{invoice.customer?.phone_primary || invoice.customer?.phone_secondary || "No phone contact"}</p>
                  <p className="text-sm text-gray-600">{invoice.customer?.email || "No email contact"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issue Date</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {invoice.issue_date ? format(new Date(invoice.issue_date), "dd MMM yyyy") : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</p>
                  <p className="font-semibold text-red-600 text-sm">
                    {invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Ref</p>
                  <p className="font-semibold text-brand-forest text-sm">{invoice.order?.order_number || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Terms</p>
                  <p className="font-semibold text-gray-900 text-sm uppercase">
                    {invoice.customer?.credit_terms ? invoice.customer.credit_terms.replace('_', ' ') : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-0">
               <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/20">
                    <TableRow>
                      <TableHead className="pl-8 text-xs font-bold text-brand-forest">Description / Product</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest">Qty</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Unit Price (UGX)</TableHead>
                      <TableHead className="text-right pr-8 text-xs font-bold text-brand-forest">Total (UGX)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.order?.items || []).map((item: any, idx: number) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unit_price) || 0;
                      const lineTotal = parseFloat(item.line_total) || (qty * price);
                      return (
                        <TableRow key={idx} className="border-b border-gray-150 last:border-b-0 hover:bg-brand-sage/5">
                          <TableCell className="pl-8 font-medium text-gray-900 text-xs py-4">
                            {item.product?.name || "N/A"}
                            {item.batch_reference && (
                              <span className="ml-2 bg-brand-sage/10 text-brand-forest border border-brand-sage/30 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold">
                                {item.batch_reference}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-gray-700">
                            {qty.toLocaleString()} {item.product?.unit_of_measure || "units"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-500 font-medium">
                            {price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-8 font-bold text-brand-forest text-xs">
                            {lineTotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
               </Table>
            </div>

            {/* Totals */}
            <div className="p-8 flex justify-end bg-gray-50/50">
               <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{parseFloat(invoice.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">VAT (0%)</span>
                    <span className="text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-sage/30 pt-3">
                    <span className="text-base font-bold text-brand-forest uppercase tracking-wide">Total Amount</span>
                    <span className="text-lg font-black text-brand-forest font-heading">
                      UGX {parseFloat(invoice.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-brand-sage bg-white rounded-b-2xl">
               <p className="text-xs text-gray-400 italic">Please make all payments via Bank Transfer or Mobile Money using the Invoice Number as reference. Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
