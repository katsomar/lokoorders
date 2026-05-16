"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  CreditCard, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const mockLedger = [
  { id: "1", date: "2026-05-16", type: "invoice", ref: "LHI-2026-0042", description: "Order LHO-0042", debit: 4250000, credit: 0, balance: 12500000 },
  { id: "2", date: "2026-05-15", type: "payment", ref: "LHP-2026-0515", description: "Payment via Bank Transfer", debit: 0, credit: 2000000, balance: 8250000 },
  { id: "3", date: "2026-05-14", type: "invoice", ref: "LHI-2026-0041", description: "Order LHO-0041", debit: 3500000, credit: 0, balance: 10250000 },
  { id: "4", date: "2026-05-12", type: "payment", ref: "LHP-2026-0512", description: "Payment via Cash", debit: 0, credit: 5000000, balance: 6750000 },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const customer = {
    id: "1",
    name: "Shoprite Lugogo",
    contact_person: "John Okello",
    phone: "0772 123 456",
    email: "accounts@shoprite.co.ug",
    address: "Lugogo Bypass, Kampala",
    zone: "Kampala Central",
    type: "supermarket",
    credit_terms: "14 Days",
    credit_limit: 15000000,
    current_balance: 12500000,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest font-heading">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="pending" className="bg-brand-sage/50 text-brand-forest">ID: CUST-001</Badge>
                <Badge variant="processing" className="bg-blue-50 text-blue-600 capitalize">{customer.type}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Printer size={18} />
              Statement
            </Button>
            <Button className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none">
              <Plus size={18} />
              Record Payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats */}
          <Card className="border-none shadow-sm bg-brand-forest text-white">
            <CardContent className="pt-6">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Current Balance</p>
              <h3 className="text-3xl font-bold font-heading mt-1">UGX {customer.current_balance.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Clock size={14} className="text-brand-yellow" />
                <span className="text-white/80">Next due in 4 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Credit Limit</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">UGX {customer.credit_limit.toLocaleString()}</h3>
              <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-amber h-full" 
                  style={{ width: `${(customer.current_balance / customer.credit_limit) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-right">83% utilized</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Credit Terms</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">{customer.credit_terms}</h3>
              <p className="text-xs text-brand-mid font-medium mt-4">Good Standing</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Sales (YTD)</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1">UGX 45.2M</h3>
              <p className="text-xs text-green-600 font-medium mt-4 flex items-center gap-1">
                <Plus size={10} /> 12% vs last year
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Account Ledger */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sage pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History size={20} className="text-brand-forest" />
                  Account Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLedger.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(tx.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-brand-forest">{tx.ref}</TableCell>
                        <TableCell className="text-xs">{tx.description}</TableCell>
                        <TableCell className="text-right text-xs font-medium text-red-600">
                          {tx.debit > 0 ? tx.debit.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-green-600">
                          {tx.credit > 0 ? tx.credit.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold">
                          {tx.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <button className="w-full py-4 text-sm font-semibold text-brand-forest hover:bg-brand-sage/20 transition-colors">
                  Load More Transactions
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-forest">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Primary Contact</p>
                    <p className="text-sm font-bold text-gray-900">{customer.contact_person}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-forest">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</p>
                    <p className="text-sm font-bold text-gray-900">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-forest">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Email Address</p>
                    <p className="text-sm font-bold text-gray-900">{customer.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-sage flex items-center justify-center text-brand-forest">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Delivery Zone</p>
                    <p className="text-sm font-bold text-brand-forest">{customer.zone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <CreditCard size={18} className="text-brand-mid" />
                Adjust Credit Limit
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <History size={18} className="text-brand-mid" />
                Change Credit Terms
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
