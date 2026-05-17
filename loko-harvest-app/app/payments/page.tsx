"use client";

import React, { useState } from "react";
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
  ArrowRight
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

const mockPayments = [
  { id: "1", payment_number: "LHP-2026-0516", customer: "Shoprite Lugogo", date: "2026-05-16", method: "bank_transfer", amount: 2000000, status: "completed" },
  { id: "2", payment_number: "LHP-2026-0515", customer: "KFC Bukoto", date: "2026-05-15", method: "cash", amount: 1500000, status: "completed" },
  { id: "3", payment_number: "LHP-2026-0514", customer: "Café Javas", date: "2026-05-14", method: "mobile_money", amount: 800000, status: "completed" },
  { id: "4", payment_number: "LHP-2026-0512", customer: "Carrefour Oasis", date: "2026-05-12", method: "bank_transfer", amount: 3500000, status: "completed" },
];

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px]">Bank</Badge>;
      case 'cash': return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 uppercase text-[10px]">Cash</Badge>;
      case 'mobile_money': return <Badge variant="outline" className="bg-brand-yellow/10 text-brand-amber border-brand-yellow/20 uppercase text-[10px]">Mobile</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px]">{method}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Payments & Collections</h1>
            <p className="text-gray-500 font-body">Track incoming revenue and customer account credits</p>
          </div>
          <Link href="/payments/new">
            <Button className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-bold">
              <Plus size={18} />
              Record New Payment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-brand-forest text-white">
            <CardContent className="pt-6">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Total Collected (MTD)</p>
              <h3 className="text-3xl font-bold font-heading mt-1">UGX 12.8M</h3>
              <p className="text-[10px] text-brand-yellow font-medium mt-2 flex items-center gap-1">
                <ArrowRight size={10} className="rotate-[-45deg]" /> 8% vs last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Top Method</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">Bank Transfer</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-2">64% of total collections</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pending Deposits</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">UGX 1.2M</h3>
              <p className="text-[10px] text-brand-amber font-medium mt-2 flex items-center gap-1">
                Requires reconciliation
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by payment # or customer..." 
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
            <Button variant="outline" className="gap-2">
              <Download size={18} />
              Statement
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount (UGX)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono font-bold text-brand-forest">
                  {payment.payment_number}
                </TableCell>
                <TableCell className="font-medium text-gray-900">{payment.customer}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(payment.date), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  {getMethodBadge(payment.method)}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="ready" className="bg-green-50 text-green-600">COMPLETED</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye size={18} className="text-brand-forest" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
