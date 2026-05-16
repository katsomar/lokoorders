"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  User, 
  CreditCard, 
  ChevronRight,
  Filter,
  MapPin
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

const mockCustomers = [
  { 
    id: "1", 
    name: "Shoprite Lugogo", 
    contact_person: "John Okello",
    phone: "0772 123 456",
    zone: "Kampala Central",
    type: "supermarket",
    balance: 12500000,
    credit_limit: 15000000,
  },
  { 
    id: "2", 
    name: "KFC Bukoto", 
    contact_person: "Sarah Jane",
    phone: "0701 987 654",
    zone: "Bukoto",
    type: "restaurant",
    balance: 8400000,
    credit_limit: 10000000,
  },
  { 
    id: "3", 
    name: "Café Javas", 
    contact_person: "Musa Teko",
    phone: "0755 444 333",
    zone: "Oasis Mall",
    type: "restaurant",
    balance: 6200000,
    credit_limit: 8000000,
  },
  { 
    id: "4", 
    name: "Carrefour Oasis", 
    contact_person: "Peter Pan",
    phone: "0788 111 222",
    zone: "Kampala Central",
    type: "supermarket",
    balance: 0,
    credit_limit: 20000000,
  },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Customer Management</h1>
            <p className="text-gray-500 font-body">Manage customer profiles, credit limits, and balances</p>
          </div>
          <Button className="gap-2">
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by name, contact or phone..." 
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
              Outstanding Balances
            </Button>
          </div>
        </div>

        {/* Customers Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Balance (UGX)</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link href={`/customers/${customer.id}`} className="font-semibold text-brand-forest hover:underline">
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-brand-mid" />
                    {customer.zone}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{customer.type}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-medium text-gray-900">{customer.contact_person}</p>
                    <p className="text-gray-500">{customer.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {customer.balance.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {customer.credit_limit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight size={18} />
                      </Button>
                    </Link>
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
