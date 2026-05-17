"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  User, 
  CreditCard, 
  ChevronRight,
  ChevronDown,
  Filter,
  MapPin,
  Building2,
  FolderOpen,
  DollarSign
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

interface Branch {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  zone: string;
  type: string;
  balance: number;
  credit_limit: number;
}

interface Customer {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  zone: string;
  type: string;
  credit_limit: number;
  isParent: boolean;
  branches: Branch[];
  balance?: number; // for non-parents
}

const mockCustomers: Customer[] = [
  { 
    id: "parent-shoprite", 
    name: "Shoprite Supermarkets", 
    contact_person: "John Okello (HQ Sales Manager)",
    phone: "0772 123 456",
    zone: "Multiple Zones",
    type: "supermarket",
    credit_limit: 30000000,
    isParent: true,
    branches: [
      {
        id: "shoprite-lugogo",
        name: "Shoprite Lugogo Branch",
        contact_person: "John Okello",
        phone: "0772 123 456",
        zone: "Kampala Central",
        type: "supermarket",
        balance: 12500000,
        credit_limit: 15000000,
      },
      {
        id: "shoprite-acacia",
        name: "Shoprite Acacia Branch",
        contact_person: "Agnes Nabeta",
        phone: "0772 888 999",
        zone: "Kololo",
        type: "supermarket",
        balance: 3200000,
        credit_limit: 15000000,
      }
    ]
  },
  { 
    id: "parent-mega", 
    name: "Mega Standard Supermarkets", 
    contact_person: "Moses Mukasa (HQ Finance Director)",
    phone: "0702 444 555",
    zone: "Multiple Zones",
    type: "supermarket",
    credit_limit: 25000000,
    isParent: true,
    branches: [
      {
        id: "mega-downtown",
        name: "Mega Standard Downtown",
        contact_person: "Moses Mukasa",
        phone: "0702 444 555",
        zone: "Kampala Central",
        type: "supermarket",
        balance: 4500000,
        credit_limit: 10000000,
      },
      {
        id: "mega-nakasero",
        name: "Mega Standard Nakasero",
        contact_person: "Daniel Lwanga",
        phone: "0751 222 333",
        zone: "Nakasero",
        type: "supermarket",
        balance: 5000000,
        credit_limit: 10000000,
      },
      {
        id: "mega-entebbe",
        name: "Mega Standard Entebbe",
        contact_person: "Sarah Namubiru",
        phone: "0709 111 222",
        zone: "Entebbe",
        type: "supermarket",
        balance: 3000000,
        credit_limit: 5000000,
      }
    ]
  },
  { 
    id: "cust-kfc", 
    name: "KFC Bukoto", 
    contact_person: "Sarah Jane",
    phone: "0701 987 654",
    zone: "Bukoto",
    type: "restaurant",
    balance: 8400000,
    credit_limit: 10000000,
    isParent: false,
    branches: []
  },
  { 
    id: "cust-cj", 
    name: "Café Javas Oasis Mall", 
    contact_person: "Musa Teko",
    phone: "0755 444 333",
    zone: "Oasis Mall",
    type: "restaurant",
    balance: 6200000,
    credit_limit: 8000000,
    isParent: false,
    branches: []
  },
  { 
    id: "cust-carrefour", 
    name: "Carrefour Oasis Mall", 
    contact_person: "Peter Pan",
    phone: "0788 111 222",
    zone: "Kampala Central",
    type: "supermarket",
    balance: 0,
    credit_limit: 20000000,
    isParent: false,
    branches: []
  },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedParents, setExpandedParents] = useState<string[]>(["parent-mega", "parent-shoprite"]); // keep open by default for demo
  const [filterType, setFilterType] = useState<string>("all");

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId) 
        : [...prev, parentId]
    );
  };

  const getConsolidatedBalance = (cust: Customer) => {
    if (cust.isParent) {
      return cust.branches.reduce((acc, br) => acc + br.balance, 0);
    }
    return cust.balance || 0;
  };

  // Filter logic
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.branches.some(br => 
        br.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        br.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (filterType === "all") return matchesSearch;
    if (filterType === "outstanding") return matchesSearch && getConsolidatedBalance(customer) > 0;
    if (filterType === "parents") return matchesSearch && customer.isParent;
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Customer Directory & Branches</h1>
            <p className="text-gray-500 font-body">Manage unified corporate customer structures, branches, balances and credit limits</p>
          </div>
          <Button className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs">
            <Plus size={15} />
            Add HQ / Customer
          </Button>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by HQ name, branch or phone..." 
              className="pl-10 border-brand-sage/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
            <Button 
              variant={filterType === "all" ? "primary" : "outline"} 
              onClick={() => setFilterType("all")}
              className="text-xs h-9"
            >
              All Customer Accounts
            </Button>
            <Button 
              variant={filterType === "outstanding" ? "primary" : "outline"} 
              onClick={() => setFilterType("outstanding")}
              className="text-xs h-9 gap-1.5"
            >
              <DollarSign size={14} />
              Outstanding Balances
            </Button>
            <Button 
              variant={filterType === "parents" ? "primary" : "outline"} 
              onClick={() => setFilterType("parents")}
              className="text-xs h-9 gap-1.5"
            >
              <Building2 size={14} />
              HQ Corporations
            </Button>
          </div>
        </div>
        {/* Customers Cards Group */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body">
            No customers found matching the search criteria.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedParents.includes(customer.id);
              const consolidatedBalance = getConsolidatedBalance(customer);
              const hasBranches = customer.isParent && customer.branches.length > 0;
              
              return (
                <div 
                  key={customer.id} 
                  className="bg-white rounded-2xl shadow-sm border border-brand-sage/40 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* HQ/Parent Corporate Profile Header Block */}
                  <div className="bg-gray-50/50 px-6 py-4.5 border-b border-brand-sage/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left Column: Name & Account Level */}
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-brand-forest/10 rounded-xl mt-0.5 text-brand-forest">
                        {customer.isParent ? <Building2 size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link 
                            href={`/customers/${customer.id}`} 
                            className="font-black text-brand-forest text-base hover:underline font-heading"
                          >
                            {customer.name}
                          </Link>
                          {customer.isParent ? (
                            <Badge className="bg-brand-forest text-white border-none text-[9px] py-0.5 px-2 font-extrabold uppercase tracking-wider rounded-lg">
                              Corporate HQ ({customer.branches.length} Branches)
                            </Badge>
                          ) : (
                            <Badge className="bg-brand-sage/30 text-brand-forest border-none text-[9px] py-0.5 px-2 font-extrabold uppercase tracking-wider rounded-lg">
                              Standalone
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-brand-mid" />
                            {customer.zone}
                          </span>
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <span>Contact: <strong className="text-gray-700">{customer.contact_person}</strong> ({customer.phone})</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Financial summary and details link */}
                    <div className="flex flex-wrap items-center gap-6 ml-auto lg:ml-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-gray-150/70 pt-3.5 lg:pt-0 mt-2 lg:mt-0">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Consolidated Balance</p>
                        <p className={`text-base font-black font-heading mt-0.5 ${consolidatedBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          UGX {consolidatedBalance.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">HQ Credit Limit</p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                          UGX {customer.credit_limit.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/customers/${customer.id}`}>
                          <Button 
                            variant="outline" 
                            className="h-8.5 px-3.5 text-xs font-extrabold gap-1 rounded-xl"
                          >
                            View Account
                            <ChevronRight size={14} />
                          </Button>
                        </Link>

                        {hasBranches && (
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => toggleParent(customer.id)}
                            className="h-8.5 w-8.5 rounded-xl text-brand-forest hover:bg-brand-sage/40 transition-all duration-200"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Nested Branches Section */}
                  {hasBranches && isExpanded && (
                    <div className="bg-gray-50/20 p-0 border-t border-brand-sage/20">
                      <div className="px-6 py-2.5 bg-brand-sage/5 border-b border-brand-sage/20 text-[10px] font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-xs">↳</span> Associated Branch Locations
                      </div>
                      <Table>
                        <TableHeader className="bg-white/50 border-b border-brand-sage/20">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-brand-forest font-extrabold pl-8 text-[11px]">Branch Location Name</TableHead>
                            <TableHead className="text-brand-forest font-extrabold text-[11px]">Delivery Zone</TableHead>
                            <TableHead className="text-brand-forest font-extrabold text-[11px]">Contact Person</TableHead>
                            <TableHead className="text-right text-brand-forest font-extrabold text-[11px]">Outstanding Balance</TableHead>
                            <TableHead className="text-right text-brand-forest font-extrabold text-[11px]">Credit Limit</TableHead>
                            <TableHead className="text-right text-brand-forest font-extrabold w-[60px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.branches.map((branch) => (
                            <TableRow 
                              key={branch.id} 
                              className="bg-white hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <TableCell className="pl-8 font-semibold">
                                <div className="flex items-center gap-2">
                                  <span className="text-brand-mid font-bold text-xs">↳</span>
                                  <Link 
                                    href={`/customers/${branch.id}?parent=${customer.id}`} 
                                    className="font-bold text-gray-700 hover:underline hover:text-brand-forest transition-colors text-xs"
                                  >
                                    {branch.name}
                                  </Link>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                  <MapPin size={10} className="text-brand-mid" />
                                  {branch.zone}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-[11px]">
                                  <p className="font-semibold text-gray-600">{branch.contact_person}</p>
                                  <p className="text-gray-400 font-medium">{branch.phone}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-extrabold text-xs ${branch.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  UGX {branch.balance.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-gray-400 font-bold text-[11px]">
                                UGX {branch.credit_limit.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/customers/${branch.id}?parent=${customer.id}`}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-brand-sage/30 rounded-lg">
                                    <ChevronRight size={14} />
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
