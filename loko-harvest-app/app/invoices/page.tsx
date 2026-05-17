"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const mockInvoices = [
  { id: "1", invoice_number: "LHI-2026-0042", customer: "Shoprite Lugogo", date: "2026-05-16", due_date: "2026-05-30", amount: 4250000, status: "unpaid" },
  { id: "2", invoice_number: "LHI-2026-0041", customer: "KFC Bukoto", date: "2026-05-15", due_date: "2026-05-29", amount: 3500000, status: "paid" },
  { id: "3", invoice_number: "LHI-2026-0040", customer: "Café Javas", date: "2026-05-14", due_date: "2026-05-28", amount: 2100000, status: "partially_paid" },
  { id: "4", invoice_number: "LHI-2026-0039", customer: "Carrefour Oasis", date: "2026-05-12", due_date: "2026-05-26", amount: 5800000, status: "overdue" },
];

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={14} className="text-green-600" />;
      case 'unpaid': return <Clock size={14} className="text-gray-400" />;
      case 'partially_paid': return <Clock size={14} className="text-amber-500" />;
      case 'overdue': return <AlertTriangle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Invoices</h1>
            <p className="text-gray-500 font-body">Manage billing and customer accounts receivable</p>
          </div>
          <Button className="gap-2" variant="outline">
            <Download size={18} />
            Export Aging Report
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by invoice # or customer..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Filter
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount (UGX)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono font-bold text-brand-forest">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell className="font-medium text-gray-900">{invoice.customer}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(invoice.date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(invoice.due_date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {invoice.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <Badge variant={invoice.status as any}>
                      {invoice.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye size={18} className="text-brand-forest" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download size={18} className="text-gray-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
