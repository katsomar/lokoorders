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
  ArrowRight
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
    customer: { name: "Shoprite Lugogo" }, 
    order_date: "2026-05-16", 
    required_delivery_date: "2026-05-18",
    urgency: "urgent",
    status: "pending",
    total_amount: 4250000
  },
  { 
    id: "2", 
    order_number: "LHO-2026-0041", 
    customer: { name: "KFC Bukoto" }, 
    order_date: "2026-05-15", 
    required_delivery_date: "2026-05-17",
    urgency: "normal",
    status: "processing",
    total_amount: 2100000
  },
  { 
    id: "3", 
    order_number: "LHO-2026-0040", 
    customer: { name: "Café Javas" }, 
    order_date: "2026-05-15", 
    required_delivery_date: "2026-05-17",
    urgency: "critical",
    status: "ready_for_dispatch",
    total_amount: 8500000
  },
  { 
    id: "4", 
    order_number: "LHO-2026-0039", 
    customer: { name: "Carrefour Oasis" }, 
    order_date: "2026-05-14", 
    required_delivery_date: "2026-05-16",
    urgency: "normal",
    status: "dispatched",
    total_amount: 5400000
  },
  { 
    id: "5", 
    order_number: "LHO-2026-0038", 
    customer: { name: "Quality Supermarket" }, 
    order_date: "2026-05-14", 
    required_delivery_date: "2026-05-16",
    urgency: "normal",
    status: "delivered",
    total_amount: 3200000
  },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Order Management</h1>
            <p className="text-gray-500 font-body">Manage customer orders and fulfillment pipeline</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus size={18} />
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by order # or customer..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button variant="outline" className="gap-2 w-full lg:w-auto">
              <Filter size={18} />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 w-full lg:w-auto">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Required By</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-semibold text-brand-forest">
                  {order.order_number}
                </TableCell>
                <TableCell>{order.customer.name}</TableCell>
                <TableCell>{format(new Date(order.order_date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(order.required_delivery_date), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={order.urgency as any}>
                    {order.urgency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={order.status as any}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  UGX {order.total_amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500 font-body">Showing 1 to 5 of 42 orders</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
