"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Printer, 
  Download, 
  Mail, 
  FileText,
  Building,
  User,
  Calendar
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const invoice = {
    id: "1",
    invoice_number: "LHI-2026-0042",
    order_number: "LHO-0042",
    date: "2026-05-16",
    due_date: "2026-05-30",
    status: "unpaid",
    customer: {
      name: "Shoprite Lugogo",
      address: "Lugogo Bypass, Kampala",
      phone: "0772 123 456",
      email: "accounts@shoprite.co.ug"
    },
    items: [
      { name: "White Eggs (Trays)", quantity: 150, price: 12000, total: 1800000 },
      { name: "Brown Eggs (Trays)", quantity: 100, price: 13500, total: 1350000 },
      { name: "Dressed Chicken (Unit)", quantity: 44, price: 25000, total: 1100000 },
    ],
    total_amount: 4250000
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest font-heading">Invoice Detail</h1>
              <p className="text-gray-500 font-body">{invoice.invoice_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Printer size={18} />
              Print
            </Button>
            <Button className="gap-2">
              <Download size={18} />
              Download PDF
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Invoice Header Branding */}
            <div className="bg-brand-forest p-8 text-white flex justify-between items-start">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-heading">LOKO HARVEST LTD</h2>
                <p className="text-sm text-white/70">Quality Poultry Products</p>
                <p className="text-xs text-white/60">Plot 12, Farm Road, Kampala, Uganda</p>
                <p className="text-xs text-white/60">+256 700 000 000 | billing@lokoharvest.com</p>
              </div>
              <div className="text-right space-y-2">
                <Badge variant={invoice.status as any} className="bg-white/10 text-white border-white/20 px-4 py-1 text-sm uppercase">
                  {invoice.status}
                </Badge>
                <h3 className="text-4xl font-bold font-heading pt-4">INVOICE</h3>
                <p className="text-white/60 text-sm">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-brand-sage">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-forest uppercase tracking-widest flex items-center gap-2">
                   <Building size={14} /> Bill To
                </h4>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-gray-900">{invoice.customer.name}</p>
                  <p className="text-sm text-gray-600">{invoice.customer.address}</p>
                  <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
                  <p className="text-sm text-gray-600">{invoice.customer.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Issue Date</p>
                  <p className="font-semibold text-gray-900">{invoice.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Due Date</p>
                  <p className="font-semibold text-red-600">{invoice.due_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Order Ref</p>
                  <p className="font-semibold text-brand-forest">{invoice.order_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Payment Terms</p>
                  <p className="font-semibold text-gray-900">Net 14</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-0">
               <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="pl-8">Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right pr-8">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8 font-medium text-gray-900">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 font-bold">{item.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
               </Table>
            </div>

            {/* Totals */}
            <div className="p-8 flex justify-end bg-gray-50/50">
               <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{invoice.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT (0%)</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-sage pt-3">
                    <span className="text-lg font-bold text-brand-forest">Total Amount</span>
                    <span className="text-lg font-bold text-brand-forest">UGX {invoice.total_amount.toLocaleString()}</span>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-brand-sage bg-white">
               <p className="text-xs text-gray-400 italic">Please make all payments via Bank Transfer or Mobile Money using the Invoice Number as reference. Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
