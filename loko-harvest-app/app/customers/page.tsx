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
          <Button className="gap-2 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-bold border-none shadow-md">
            <Plus size={18} />
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

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-sage/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/70 border-b border-brand-sage/40">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-brand-forest font-bold">HQ Customer / Branch Name</TableHead>
                <TableHead className="text-brand-forest font-bold">Delivery Zone</TableHead>
                <TableHead className="text-brand-forest font-bold">Account Level</TableHead>
                <TableHead className="text-brand-forest font-bold">Contact Person</TableHead>
                <TableHead className="text-right text-brand-forest font-bold">Outstanding Balance</TableHead>
                <TableHead className="text-right text-brand-forest font-bold">Credit Limit</TableHead>
                <TableHead className="text-right text-brand-forest font-bold w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 font-body">
                    No customers found matching the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const isExpanded = expandedParents.includes(customer.id);
                  const consolidatedBalance = getConsolidatedBalance(customer);
                  
                  return (
                    <React.Fragment key={customer.id}>
                      
                      {/* Parent Corporate Row */}
                      <TableRow className={`hover:bg-brand-sage/10 transition-colors ${customer.isParent ? 'font-semibold bg-gray-50/50' : ''}`}>
                        <TableCell className="p-0 text-center">
                          {customer.isParent && (
                            <button 
                              onClick={() => toggleParent(customer.id)}
                              className="p-2 text-brand-forest hover:bg-brand-sage/30 rounded-lg transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {customer.isParent ? (
                              <Building2 size={16} className="text-brand-forest" />
                            ) : (
                              <User size={16} className="text-brand-mid" />
                            )}
                            <Link 
                              href={`/customers/${customer.id}`} 
                              className="font-bold text-brand-forest hover:underline hover:text-[#12421D] transition-colors"
                            >
                              {customer.name}
                            </Link>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                            <MapPin size={12} className="text-brand-mid" />
                            {customer.zone}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {customer.isParent ? (
                            <Badge className="bg-brand-forest text-white border-none text-[10px]">
                              Corporate HQ ({customer.branches.length} Branches)
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-none text-[10px]">
                              Standalone
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-bold text-gray-800">{customer.contact_person}</p>
                            <p className="text-gray-400 font-medium">{customer.phone}</p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <span className={`font-black ${consolidatedBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            UGX {consolidatedBalance.toLocaleString()}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-right text-gray-500 font-bold text-xs">
                          UGX {customer.credit_limit.toLocaleString()}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-forest hover:bg-brand-sage/20">
                              <ChevronRight size={18} />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>

                      {customer.isParent && isExpanded && customer.branches.map((branch) => (
                        <TableRow 
                          key={branch.id} 
                          className="bg-brand-sage/5 hover:bg-brand-sage/10 transition-colors border-l-4 border-brand-mid"
                        >
                          <TableCell />
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300 font-bold">↳</span>
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
                            <Badge className="bg-brand-sage/30 text-brand-forest border-none text-[9px] font-bold">
                              Branch Location
                            </Badge>
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
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-brand-sage/30">
                                <ChevronRight size={14} />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}

                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </DashboardLayout>
  );
}
