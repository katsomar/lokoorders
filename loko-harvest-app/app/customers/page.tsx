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
  DollarSign,
  Upload,
  X,
  Mail,
  Phone
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
  logoColor?: string;
  logoLetter?: string;
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
    logoColor: "bg-red-600 text-white",
    logoLetter: "S",
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
    logoColor: "bg-brand-forest text-brand-yellow border border-brand-yellow/30",
    logoLetter: "M",
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
    logoColor: "bg-red-800 text-white",
    logoLetter: "K",
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
    logoColor: "bg-amber-800 text-white",
    logoLetter: "CJ",
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
    logoColor: "bg-blue-800 text-white",
    logoLetter: "C",
    branches: []
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedParents, setExpandedParents] = useState<string[]>(["parent-mega", "parent-shoprite"]); // keep open by default for demo
  const [filterType, setFilterType] = useState<string>("all");

  // Add Customer modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newZone, setNewZone] = useState("Kampala Central");
  const [newType, setNewType] = useState("supermarket");
  const [newCreditLimit, setNewCreditLimit] = useState("10000000");
  const [newCreditTerms, setNewCreditTerms] = useState("15 Days");
  const [newInitialBalance, setNewInitialBalance] = useState("0");
  const [newIsParent, setNewIsParent] = useState(false);

  // Logo customization states
  const [logoOption, setLogoOption] = useState<"text" | "upload">("text");
  const [logoText, setLogoText] = useState("");
  const [logoBgColor, setLogoBgColor] = useState("bg-brand-forest text-brand-yellow border border-brand-yellow/30");
  const [uploadedLogoLetter, setUploadedLogoLetter] = useState("");
  const [uploadedLogoColor, setUploadedLogoColor] = useState("");

  const [modalUploading, setModalUploading] = useState(false);
  const [modalUploadProgress, setModalUploadProgress] = useState(0);

  const handleModalSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setModalUploading(true);
    setModalUploadProgress(0);
    const interval = setInterval(() => {
      setModalUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setModalUploading(false);
          const firstLetter = newCustomerName ? newCustomerName.charAt(0).toUpperCase() : "C";
          setUploadedLogoLetter(firstLetter);
          setUploadedLogoColor("bg-[#1E293B] text-white border-2 border-brand-sage/50 shadow-md");
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;

    let finalLogoColor = "bg-brand-forest text-brand-yellow";
    let finalLogoLetter = "C";

    if (logoOption === "text") {
      finalLogoColor = logoBgColor;
      finalLogoLetter = logoText.toUpperCase() || newCustomerName.charAt(0).toUpperCase();
    } else {
      finalLogoColor = uploadedLogoColor || "bg-[#1E293B] text-white border-2 border-brand-sage/50 shadow-md";
      finalLogoLetter = uploadedLogoLetter || newCustomerName.charAt(0).toUpperCase();
    }

    const newCustomerObj: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerName,
      contact_person: newContactPerson || "N/A",
      phone: newPhone || "N/A",
      zone: newZone,
      type: newType,
      credit_limit: parseFloat(newCreditLimit) || 0,
      isParent: newIsParent,
      branches: [],
      balance: parseFloat(newInitialBalance) || 0,
      logoColor: finalLogoColor,
      logoLetter: finalLogoLetter
    };

    setCustomers(prev => [newCustomerObj, ...prev]);

    // Reset Form
    setNewCustomerName("");
    setNewContactPerson("");
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
    setNewZone("Kampala Central");
    setNewType("supermarket");
    setNewCreditLimit("10000000");
    setNewCreditTerms("15 Days");
    setNewInitialBalance("0");
    setNewIsParent(false);
    setLogoOption("text");
    setLogoText("");
    setUploadedLogoLetter("");
    setUploadedLogoColor("");

    setShowAddModal(false);
  };

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
  const filteredCustomers = customers.filter(customer => {
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
          <Button 
            onClick={() => setShowAddModal(true)}
            className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs"
          >
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
                      <div className={`h-11 w-11 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${customer.logoColor || "bg-brand-forest text-brand-yellow"}`}>
                        {customer.logoLetter || customer.name.charAt(0).toUpperCase()}
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

        {/* ADD HQ / CUSTOMER MODAL OVERLAY */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Register New Customer Profile</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Setup standalone clients or corporate consolidated headquarters</p>
                </div>
                <Button 
                  onClick={() => setShowAddModal(false)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* LEFT COLUMN: PRIMARY DETAILS */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Company / Customer Name *</label>
                      <Input 
                        placeholder="e.g. Shoprite Kampala" 
                        required 
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50 placeholder:text-gray-300 font-bold text-gray-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Account Level</label>
                        <select 
                          value={newIsParent ? "hq" : "standalone"}
                          onChange={(e) => setNewIsParent(e.target.value === "hq")}
                          className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                        >
                          <option value="standalone">Standalone client</option>
                          <option value="hq">Corporate HQ Parent</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Client Type</label>
                        <select 
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                        >
                          <option value="supermarket">Supermarket</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="hotel">Hotel/Hospitality</option>
                          <option value="retail">Retail Shop</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Account Manager / Contact Person</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <Input 
                          placeholder="e.g. Sarah Jane" 
                          value={newContactPerson}
                          onChange={(e) => setNewContactPerson(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Financial Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                          <Input 
                            type="email"
                            placeholder="billing@company.co.ug" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Contact Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                          <Input 
                            placeholder="e.g. 0700 123 456" 
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Fulfillment Delivery Zone</label>
                      <select 
                        value={newZone}
                        onChange={(e) => setNewZone(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="Kampala Central">Kampala Central</option>
                        <option value="Kololo">Kololo / Acacia</option>
                        <option value="Nakasero">Nakasero Hill</option>
                        <option value="Bukoto">Bukoto / Kamwokya</option>
                        <option value="Oasis Mall">Oasis Mall Zone</option>
                        <option value="Entebbe">Entebbe Route</option>
                        <option value="Mukono">Mukono Highway</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Billing Address</label>
                      <Input 
                        placeholder="e.g. Plot 4, Acacia Avenue, Kampala" 
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: BRANDING & FINANCIAL DETAILS */}
                  <div className="space-y-4 border-l border-brand-sage/20 pl-0 md:pl-5">
                    
                    {/* CUSTOM BRANDING LOGO ZONE */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-brand-sage/30">
                      <label className="text-[10px] text-brand-forest font-black uppercase tracking-wider block mb-2">Corporate Brand Identity Logo</label>
                      
                      {/* Logo Type Selector Tabs */}
                      <div className="flex bg-gray-150 p-1 rounded-lg text-[10px] font-extrabold uppercase mb-3">
                        <button 
                          type="button"
                          onClick={() => setLogoOption("text")}
                          className={`flex-1 py-1 rounded-md transition-all ${logoOption === "text" ? "bg-white text-brand-forest shadow-sm" : "text-gray-400"}`}
                        >
                          📝 Designed Text Logo
                        </button>
                        <button 
                          type="button"
                          onClick={() => setLogoOption("upload")}
                          className={`flex-1 py-1 rounded-md transition-all ${logoOption === "upload" ? "bg-white text-brand-forest shadow-sm" : "text-gray-400"}`}
                        >
                          📤 Upload Logo File
                        </button>
                      </div>

                      {/* Display Preview + Inputs Side-by-Side */}
                      <div className="flex gap-4 items-center">
                        {/* Live Designed Logo Preview */}
                        <div className="flex flex-col items-center gap-1">
                          <div className={`h-16 w-16 rounded-2xl font-heading font-black text-sm flex items-center justify-center shadow-md select-none border border-black/10 shrink-0 transition-all ${
                            logoOption === "text" 
                              ? logoBgColor 
                              : (uploadedLogoColor || "bg-[#1E293B] text-white border-2 border-brand-sage/50 shadow-md")
                          }`}>
                            {logoOption === "text" 
                              ? (logoText.toUpperCase() || (newCustomerName ? newCustomerName.charAt(0).toUpperCase() : "C"))
                              : (uploadedLogoLetter || (newCustomerName ? newCustomerName.charAt(0).toUpperCase() : "C"))
                            }
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Logo Preview</span>
                        </div>

                        {/* Configuration inputs */}
                        <div className="flex-1 space-y-2.5">
                          {logoOption === "text" ? (
                            <>
                              <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Logo Abbreviation (Max 3 Chars)</label>
                                <Input 
                                  maxLength={3}
                                  placeholder={newCustomerName ? newCustomerName.slice(0, 2).toUpperCase() : "C"} 
                                  value={logoText}
                                  onChange={(e) => setLogoText(e.target.value)}
                                  className="h-8 text-xs rounded-lg border-brand-sage/40 font-extrabold text-brand-forest uppercase tracking-wider"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Select Designed Theme Color</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { class: "bg-red-600 text-white", label: "Red" },
                                    { class: "bg-red-800 text-white", label: "Maroon" },
                                    { class: "bg-brand-forest text-brand-yellow border border-brand-yellow/30", label: "Forest" },
                                    { class: "bg-blue-600 text-white", label: "Blue" },
                                    { class: "bg-amber-600 text-white", label: "Gold" },
                                    { class: "bg-[#1E293B] text-white", label: "Slate" },
                                  ].map((theme) => (
                                    <button
                                      key={theme.label}
                                      type="button"
                                      onClick={() => setLogoBgColor(theme.class)}
                                      className={`h-4.5 w-4.5 rounded-full border border-black/10 transition-transform ${theme.class} ${logoBgColor === theme.class ? "scale-125 ring-2 ring-brand-forest/60" : "hover:scale-110"}`}
                                      title={theme.label}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Select Corporate Logo File</label>
                              
                              {modalUploading ? (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-brand-forest uppercase">
                                    <span>Uploading File...</span>
                                    <span>{modalUploadProgress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                    <div className="bg-brand-yellow h-full transition-all duration-200" style={{ width: `${modalUploadProgress}%` }} />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <label htmlFor="modal-logo-input" className="cursor-pointer h-8 px-3 bg-white hover:bg-brand-sage/20 text-brand-forest font-extrabold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors border border-brand-sage/50 shadow-sm">
                                    <Upload size={12} />
                                    Browse Corporate File
                                  </label>
                                  <input 
                                    type="file" 
                                    id="modal-logo-input" 
                                    accept="image/*" 
                                    onChange={handleModalSimulatedUpload}
                                    className="hidden" 
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FINANCIAL AUDIT INFO */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Credit Terms</label>
                        <select 
                          value={newCreditTerms}
                          onChange={(e) => setNewCreditTerms(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                        >
                          <option value="7 Days">7 Days Net Terms</option>
                          <option value="15 Days">15 Days Net Terms</option>
                          <option value="30 Days">30 Days Net Terms</option>
                          <option value="Cash Only">Immediate Cash / Cash On Delivery</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Approved Corporate Credit Limit (UGX)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                          <Input 
                            type="number"
                            placeholder="e.g. 10,000,000" 
                            value={newCreditLimit}
                            onChange={(e) => setNewCreditLimit(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50 font-mono text-brand-forest font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Opening Outstanding Balance (UGX)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                          <Input 
                            type="number"
                            placeholder="e.g. 0 (Set opening unpaid balance)" 
                            value={newInitialBalance}
                            onChange={(e) => setNewInitialBalance(e.target.value)}
                            className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50 font-mono text-red-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-150/70">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddModal(false)}
                    className="h-9.5 px-4.5 rounded-xl text-xs font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10"
                  >
                    Cancel Setup
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-9.5 px-5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs"
                  >
                    Confirm & Register Customer
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
