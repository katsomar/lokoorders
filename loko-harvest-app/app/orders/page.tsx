"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  FileText, 
  Truck,
  ArrowRight,
  Download,
  Building2
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

const mockOrders = [
  { 
    id: "1", 
    order_number: "LHO-2026-0042", 
    customer: { name: "Shoprite Lugogo", logoColor: "bg-red-600 text-white", logoLetter: "S" }, 
    order_date: "2026-05-16", 
    required_delivery_date: "2026-05-18",
    urgency: "urgent",
    status: "pending",
    total_amount: 4250000
  },
  { 
    id: "2", 
    order_number: "LHO-2026-0041", 
    customer: { name: "KFC Bukoto", logoColor: "bg-red-800 text-white", logoLetter: "K" }, 
    order_date: "2026-05-15", 
    required_delivery_date: "2026-05-17",
    urgency: "normal",
    status: "processing",
    total_amount: 2100000
  },
  { 
    id: "3", 
    order_number: "LHO-2026-0040", 
    customer: { name: "Café Javas", logoColor: "bg-amber-800 text-white", logoLetter: "CJ" }, 
    order_date: "2026-05-15", 
    required_delivery_date: "2026-05-17",
    urgency: "critical",
    status: "ready_for_dispatch",
    total_amount: 8500000
  },
  { 
    id: "4", 
    order_number: "LHO-2026-0039", 
    customer: { name: "Carrefour Oasis", logoColor: "bg-blue-800 text-white", logoLetter: "C" }, 
    order_date: "2026-05-14", 
    required_delivery_date: "2026-05-16",
    urgency: "normal",
    status: "dispatched",
    total_amount: 5400000
  },
  { 
    id: "5", 
    order_number: "LHO-2026-0038", 
    customer: { name: "Quality Supermarket", logoColor: "bg-green-700 text-white", logoLetter: "Q" }, 
    order_date: "2026-05-14", 
    required_delivery_date: "2026-05-16",
    urgency: "normal",
    status: "delivered",
    total_amount: 3200000
  },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Critical</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Urgent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Processing</Badge>;
      case 'ready_for_dispatch':
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Ready</Badge>;
      case 'dispatched':
        return <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Dispatched</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 text-[10px] font-bold py-0.5 px-2 rounded-lg">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Standardized Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading">Order Pipeline & Fulfillment</h1>
            <p className="text-gray-500 font-body text-sm mt-0.5">Track, schedule, and dispatch bulk deliveries to client outlets</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs">
              <Plus size={15} />
              New Order
            </Button>
          </Link>
        </div>

        {/* Standardized Filters Panel */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage/40">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search by order # or customer..." 
              className="pl-10 h-10 text-xs rounded-xl border-brand-sage/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button variant="outline" className="gap-1.5 h-9.5 px-4 text-xs font-bold rounded-xl border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 w-full lg:w-auto">
              <Filter size={14} />
              Filter Pipeline
            </Button>
            <Button variant="outline" className="gap-1.5 h-9.5 px-4 text-xs font-bold rounded-xl border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 w-full lg:w-auto">
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Improved Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-sage/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/70 border-b border-brand-sage/30">
              <TableRow>
                <TableHead className="text-xs font-bold text-brand-forest pl-6">Order #</TableHead>
                <TableHead className="text-xs font-bold text-brand-forest">Customer Details</TableHead>
                <TableHead className="text-xs font-bold text-brand-forest">Order Date</TableHead>
                <TableHead className="text-xs font-bold text-brand-forest">Required Delivery</TableHead>
                <TableHead className="text-xs font-bold text-brand-forest">Urgency</TableHead>
                <TableHead className="text-xs font-bold text-brand-forest">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-brand-forest">Total Value</TableHead>
                <TableHead className="text-right text-xs font-bold text-brand-forest pr-6 w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 font-body text-xs">
                    No orders recorded in the system.
                  </TableCell>
                </TableRow>
              ) : (
                mockOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-brand-forest">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* Circular Corporate Logo Badge */}
                        <div className={`h-8 w-8 rounded-xl font-heading font-black text-xs flex items-center justify-center shadow-sm select-none shrink-0 ${order.customer.logoColor}`}>
                          {order.customer.logoLetter}
                        </div>
                        <span className="font-bold text-gray-800 text-xs">{order.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-medium">
                      {format(new Date(order.order_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 font-semibold">
                      {format(new Date(order.required_delivery_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(order.urgency)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-extrabold text-brand-forest font-heading">
                      UGX {order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-brand-sage/30 rounded-lg">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-brand-sage/30 rounded-lg">
                          <MoreVertical size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Standardized Pagination Bar */}
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Showing 1 to 5 of 42 orders</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-brand-sage" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-brand-sage">Next</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
