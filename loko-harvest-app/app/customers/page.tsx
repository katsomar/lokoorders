"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 flex items-center justify-center border border-brand-sage rounded-xl animate-pulse text-xs text-gray-400">Loading Map Component...</div>
});
import { 
  Plus, 
  Search, 
  User, 
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  DollarSign,
  X,
  Mail,
  Phone,
  Loader2,
  Edit,
  Trash2
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
import api from "@/lib/api";
import { UITooltip, InfoTooltip } from "@/components/ui/tooltip";


interface Branch {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  zone: string;
  type: string;
  balance: number;
  credit_limit: number;
  total_invoiced: number;
  total_paid: number;
  parent_id?: string;
  latitude: number | null;
  longitude: number | null;
  classification?: "independent" | "file_opener" | "branch";
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
  balance?: number; // for standalone
  total_invoiced?: number; // for standalone
  total_paid?: number; // for standalone
  parent_id?: string;
  logoColor?: string;
  logoLetter?: string;
  logo_url?: string | null;
  latitude: number | null;
  longitude: number | null;
  classification?: "independent" | "file_opener" | "branch";
}

export default function CustomersPage() {
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  // Add Customer modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newLatitude, setNewLatitude] = useState<number | null>(null);
  const [newLongitude, setNewLongitude] = useState<number | null>(null);
  const [newParentId, setNewParentId] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newType, setNewType] = useState("supermarket");
  const [newCreditLimit, setNewCreditLimit] = useState("10000000");
  const [newCreditTerms, setNewCreditTerms] = useState("7_days");
  const [newClassification, setNewClassification] = useState<"independent" | "file_opener" | "branch">("independent");

  // Edit Customer Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editParentId, setEditParentId] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editType, setEditType] = useState("supermarket");
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editCreditTerms, setEditCreditTerms] = useState("7_days");
  const [editClassification, setEditClassification] = useState<"independent" | "file_opener" | "branch">("independent");

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const [custRes, zonesRes] = await Promise.all([
        api.get("/customers", { params: { per_page: 100 } }),
        api.get("/delivery-zones")
      ]);
      setDbCustomers(custRes.data.data?.data || custRes.data.data || []);
      const zonesData = zonesRes.data.data || [];
      setZones(zonesData);
      if (zonesData.length > 0) {
        setNewArea(zonesData[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch customer directory details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Parse flat DB list to Parent-Child structure
  const customers = React.useMemo(() => {
    // Build a branches map for dynamically registered parent-child records
    const dbBranchesMap: Record<string, any[]> = {};
    dbCustomers.forEach(c => {
      if (c.parent_id) {
        if (!dbBranchesMap[c.parent_id]) {
          dbBranchesMap[c.parent_id] = [];
        }
        dbBranchesMap[c.parent_id].push(c);
      }
    });

    const list: Customer[] = [];

    const formatBranch = (c: any): Branch => ({
      id: c.id,
      name: c.name,
      contact_person: c.contact_person || "N/A",
      phone: c.phone_primary || "N/A",
      zone: c.zone?.name || "Kampala",
      type: c.customer_type || "supermarket",
      balance: parseFloat(c.account?.current_balance || 0),
      credit_limit: parseFloat(c.credit_limit || 0),
      total_invoiced: parseFloat(c.account?.total_invoiced || 0),
      total_paid: parseFloat(c.account?.total_paid || 0),
      parent_id: c.parent_id || undefined,
      latitude: c.latitude ? parseFloat(c.latitude) : null,
      longitude: c.longitude ? parseFloat(c.longitude) : null,
      classification: c.classification,
    });

    dbCustomers.forEach(c => {
      // Skip if they are registered as a branch under a dynamic parent
      if (c.parent_id) return;

      let color = "bg-brand-forest text-brand-yellow";
      let letter = c.name.charAt(0).toUpperCase();

      if (c.name.toLowerCase().includes("shoprite")) {
        color = "bg-red-600 text-white";
        letter = "S";
      } else if (c.name.toLowerCase().includes("mega")) {
        color = "bg-brand-forest text-brand-yellow border border-brand-yellow/30";
        letter = "M";
      } else if (c.name.toLowerCase().includes("kfc")) {
        color = "bg-red-800 text-white";
        letter = "K";
      } else if (c.name.toLowerCase().includes("javas") || c.name.toLowerCase().includes("cafe javas")) {
        color = "bg-amber-800 text-white";
        letter = "CJ";
      } else if (c.name.toLowerCase().includes("carrefour")) {
        color = "bg-blue-800 text-white";
        letter = "C";
      }

      const associatedBranches = dbBranchesMap[c.id] || [];

      if (associatedBranches.length > 0) {
        // Dynamic parent HQ
        const branches = associatedBranches.map(formatBranch);
        list.push({
          id: c.id,
          name: c.name,
          contact_person: c.contact_person || "N/A",
          phone: c.phone_primary || "N/A",
          zone: c.zone?.name || "Kampala",
          type: c.customer_type || "supermarket",
          credit_limit: parseFloat(c.credit_limit || 0) + branches.reduce((acc, br) => acc + br.credit_limit, 0),
          isParent: true,
          logoColor: color,
          logoLetter: letter,
          logo_url: c.logo_url,
          branches: branches,
          total_invoiced: parseFloat(c.account?.total_invoiced || 0) + branches.reduce((acc, br) => acc + br.total_invoiced, 0),
          total_paid: parseFloat(c.account?.total_paid || 0) + branches.reduce((acc, br) => acc + br.total_paid, 0),
          balance: parseFloat(c.account?.current_balance || 0) + branches.reduce((acc, br) => acc + br.balance, 0),
          latitude: c.latitude ? parseFloat(c.latitude) : null,
          longitude: c.longitude ? parseFloat(c.longitude) : null,
          classification: c.classification || "file_opener",
        });
      } else {
        // Standalone
        list.push({
          id: c.id,
          name: c.name,
          contact_person: c.contact_person || "N/A",
          phone: c.phone_primary || "N/A",
          zone: c.zone?.name || "Kampala",
          type: c.customer_type || "supermarket",
          credit_limit: parseFloat(c.credit_limit || 0),
          isParent: false,
          logoColor: color,
          logoLetter: letter,
          logo_url: c.logo_url,
          branches: [],
          balance: parseFloat(c.account?.current_balance || 0),
          total_invoiced: parseFloat(c.account?.total_invoiced || 0),
          total_paid: parseFloat(c.account?.total_paid || 0),
          latitude: c.latitude ? parseFloat(c.latitude) : null,
          longitude: c.longitude ? parseFloat(c.longitude) : null,
          classification: c.classification || "independent",
        });
      }
    });

    return list;
  }, [dbCustomers]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCustomerName.trim();
    const contact = newContactPerson.trim();
    const phone = newPhone.trim();
    const address = newAddress.trim();

    if (name.length < 3 || name.length > 100) {
      alert("Customer name must be between 3 and 100 characters.");
      return;
    }
    if (contact.length < 2 || contact.length > 100) {
      alert("Contact person must be between 2 and 100 characters.");
      return;
    }
    if (!/^[0-9+\-\s()]{9,20}$/.test(phone)) {
      alert("Primary phone number must contain 9 to 20 digits, spaces, or valid symbols (+, -, ()).");
      return;
    }
    if (address.length < 3 || address.length > 255) {
      alert("Delivery address must be between 3 and 255 characters.");
      return;
    }
    if (!newArea) {
      alert("Please select or enter a delivery zone.");
      return;
    }
    if (newClassification === "branch" && !newParentId) {
      alert("Please select a parent Corporate HQ customer for this branch location.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/customers", {
        name,
        classification: newClassification,
        parent_id: newClassification === "branch" ? (newParentId || null) : null,
        contact_person: contact,
        phone_primary: phone,
        email: newEmail.trim() || null,
        address,
        delivery_zone: newArea,
        customer_type: newType,
        credit_terms: newCreditTerms,
        credit_limit: parseFloat(newCreditLimit) || 0,
        date_registered: new Date().toISOString().split('T')[0],
        latitude: newClassification === "file_opener" ? null : newLatitude,
        longitude: newClassification === "file_opener" ? null : newLongitude,
      });

      alert("Customer registered successfully!");
      
      // Reset Form
      setNewCustomerName("");
      setNewParentId("");
      setNewContactPerson("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setNewLatitude(null);
      setNewLongitude(null);
      setNewType("supermarket");
      setNewCreditLimit("10000000");
      setNewCreditTerms("7_days");
      setNewClassification("independent");
      setNewArea("");
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to register customer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (cust: any) => {
    setEditingCustomer(cust);
    
    // Find matching item in dbCustomers for edit fields
    const dbItem = dbCustomers.find(c => c.id === cust.id);
    if (dbItem) {
      setEditCustomerName(dbItem.name || "");
      setEditParentId(dbItem.parent_id || "");
      setEditContactPerson(dbItem.contact_person || "");
      setEditPhone(dbItem.phone_primary || "");
      setEditEmail(dbItem.email || "");
      setEditAddress(dbItem.address || "");
      setEditArea(dbItem.zone?.name || "");
      setEditType(dbItem.customer_type || "supermarket");
      setEditCreditLimit(dbItem.credit_limit ? dbItem.credit_limit.toString() : "0");
      setEditCreditTerms(dbItem.credit_terms || "7_days");
      setEditLatitude(dbItem.latitude ? parseFloat(dbItem.latitude) : null);
      setEditLongitude(dbItem.longitude ? parseFloat(dbItem.longitude) : null);
      setEditClassification(dbItem.classification || (dbItem.parent_id ? "branch" : (cust.isParent ? "file_opener" : "independent")));
      setShowEditModal(true);
    }
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const name = editCustomerName.trim();
    const contact = editContactPerson.trim();
    const phone = editPhone.trim();
    const address = editAddress.trim();

    if (name.length < 3 || name.length > 100) {
      alert("Customer name must be between 3 and 100 characters.");
      return;
    }
    if (contact.length < 2 || contact.length > 100) {
      alert("Contact person must be between 2 and 100 characters.");
      return;
    }
    if (!/^[0-9+\-\s()]{9,20}$/.test(phone)) {
      alert("Primary phone number must contain 9 to 20 valid characters.");
      return;
    }
    if (address.length < 3 || address.length > 255) {
      alert("Delivery address must be between 3 and 255 characters.");
      return;
    }
    if (!editArea) {
      alert("Please select or enter a delivery zone.");
      return;
    }
    if (editClassification === "branch" && !editParentId) {
      alert("Please select a parent Corporate HQ customer for this branch location.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/customers/${editingCustomer.id}`, {
        name,
        classification: editClassification,
        parent_id: editClassification === "branch" ? (editParentId || null) : null,
        contact_person: contact,
        phone_primary: phone,
        email: editEmail.trim() || null,
        address,
        delivery_zone: editArea,
        customer_type: editType,
        credit_terms: editCreditTerms,
        credit_limit: parseFloat(editCreditLimit) || 0,
        latitude: editClassification === "file_opener" ? null : editLatitude,
        longitude: editClassification === "file_opener" ? null : editLongitude,
      });

      alert("Customer profile updated successfully!");
      setShowEditModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update customer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (cust: any) => {
    if (!confirm(`Are you sure you want to delete ${cust.name}? All branch relationships and account settings will be updated.`)) return;

    try {
      await api.delete(`/customers/${cust.id}`);
      alert("Customer profile deleted successfully!");
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete customer. Verify they have no active order history.");
    }
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

  const getConsolidatedInvoiced = (cust: Customer) => {
    if (cust.isParent) {
      return cust.branches.reduce((acc, br) => acc + br.total_invoiced, 0);
    }
    return cust.total_invoiced || 0;
  };

  const getConsolidatedPaid = (cust: Customer) => {
    if (cust.isParent) {
      return cust.branches.reduce((acc, br) => acc + br.total_paid, 0);
    }
    return cust.total_paid || 0;
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

  // Dynamic financial overview calculations
  const totalUnpaid = customers.reduce((acc, c) => acc + getConsolidatedBalance(c), 0);
  const totalInvoiced = customers.reduce((acc, c) => acc + getConsolidatedInvoiced(c), 0);
  const totalPaid = customers.reduce((acc, c) => acc + getConsolidatedPaid(c), 0);
  const paymentPercentage = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-brand-forest font-heading">Customer Directory & Branches</h1>
              <InfoTooltip title="Customer Directory & Hierarchy" text="Unified customer registry supporting Corporate HQ parent accounts with nested branch delivery locations and credit limits." side="right" />
            </div>
            <p className="text-gray-500 font-body text-xs mt-0.5">
              Manage unified corporate customer structures, branches, balances and credit limits • {isLoading ? "—" : `${dbCustomers.length} Active Accounts`}
            </p>
          </div>
          <UITooltip content="Register a standalone store, file-opener HQ corporation, or branch outlet" side="bottom">
            <Button 
              onClick={() => setShowAddModal(true)}
              className="gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-4 rounded-xl text-xs cursor-pointer"
            >
              <Plus size={15} />
              Register Customer / Branch
            </Button>
          </UITooltip>
        </div>


        {/* Dynamic Financial Overview Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Collection percentage collection progress */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-sage flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
            <div className="relative h-20 w-20 flex-shrink-0">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-gray-100"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-brand-mid transition-all duration-500 ease-in-out"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={201}
                  strokeDashoffset={201 - (paymentPercentage / 100) * 201}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-brand-forest font-heading">
                  {isLoading ? "—" : `${paymentPercentage}%`}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payment Performance</h3>
              <p className="text-base font-black text-brand-forest font-heading mt-0.5">
                {isLoading ? "Loading..." : `${paymentPercentage}% Cleared`}
              </p>
              <p className="text-[10px] text-gray-500 font-semibold leading-tight">
                {isLoading ? "—" : `UGX ${totalPaid.toLocaleString()} / UGX ${totalInvoiced.toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Card 2: Total Demanded */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-sage flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="h-12 w-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Demanded</h3>
              <p className="text-lg font-black text-blue-600 font-heading">
                {isLoading ? "UGX —" : `UGX ${totalInvoiced.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1 text-[9px] text-blue-500 font-bold uppercase">
                <span>⚡ Total Invoiced Amount</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Collected / Paid */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-sage flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="h-12 w-12 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Collected</h3>
              <p className="text-lg font-black text-green-600 font-heading">
                {isLoading ? "UGX —" : `UGX ${totalPaid.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase">
                <span>✓ Successfully Received</span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Receivables / Outstanding */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-sage flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="h-12 w-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Receivables</h3>
              <p className="text-lg font-black text-red-600 font-heading">
                {isLoading ? "UGX —" : `UGX ${totalUnpaid.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase">
                <span>⚠️ Outstanding Balance</span>
              </div>
            </div>
          </div>

        </div>

        {/* Filters Panel */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by name, contact or phone..." 
              className="pl-10 border-brand-sage/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
            <Button 
              variant={filterType === "all" ? "primary" : "outline"} 
              onClick={() => setFilterType("all")}
              className="text-xs h-9 cursor-pointer"
            >
              All Customer Accounts
            </Button>
            <Button 
              variant={filterType === "outstanding" ? "primary" : "outline"} 
              onClick={() => setFilterType("outstanding")}
              className="text-xs h-9 gap-1.5 cursor-pointer"
            >
              <DollarSign size={14} />
              Outstanding Balances
            </Button>
            <Button 
              variant={filterType === "parents" ? "primary" : "outline"} 
              onClick={() => setFilterType("parents")}
              className="text-xs h-9 gap-1.5 cursor-pointer"
            >
              <Building2 size={14} />
              HQ Corporations
            </Button>
          </div>
        </div>

        {/* Customers Cards Group */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-bold gap-2">
            <Loader2 className="animate-spin text-brand-forest" size={32} />
            Loading customer profiles...
          </div>
        ) : filteredCustomers.length === 0 ? (
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
                      {customer.logo_url ? (
                        <img 
                          src={customer.logo_url} 
                          alt={customer.name} 
                          className="h-11 w-11 rounded-xl object-cover shadow-sm select-none shrink-0 border border-brand-sage/40 bg-white"
                        />
                      ) : (
                        <div className={`h-11 w-11 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${customer.logoColor || "bg-brand-forest text-brand-yellow"}`}>
                          {customer.logoLetter || customer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
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
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <span className="flex items-center gap-1">
                            {customer.latitude && customer.longitude ? (
                              <span className="text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Map Pin Active
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                No Map Pin
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Financial summary and details link */}
                    <div className="flex flex-wrap items-center gap-6 ml-auto lg:ml-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-gray-150/70 pt-3.5 lg:pt-0 mt-2 lg:mt-0">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {customer.isParent ? "HQ Consolidated Balance" : "Outstanding Balance"}
                        </p>
                        <p className={`text-base font-black font-heading mt-0.5 ${consolidatedBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          UGX {consolidatedBalance.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {customer.isParent ? "Group Credit Limit" : "Approved Credit Limit"}
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                          UGX {customer.credit_limit.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/customers/${customer.id}`}>
                          <Button 
                            variant="outline" 
                            className="h-8.5 px-3.5 text-xs font-extrabold gap-1 rounded-xl cursor-pointer"
                          >
                            {customer.isParent ? "View HQ Ledger" : "View Ledger"}
                            <ChevronRight size={14} />
                          </Button>
                        </Link>

                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEditClick(customer)}
                          className="h-8.5 w-8.5 rounded-xl cursor-pointer text-gray-500 hover:text-brand-forest hover:bg-brand-sage/20 border-brand-sage/40"
                          title="Edit Customer"
                        >
                          <Edit size={14} />
                        </Button>

                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteClick(customer)}
                          className="h-8.5 w-8.5 rounded-xl cursor-pointer text-gray-500 hover:text-red-600 hover:bg-red-50 border-brand-sage/40"
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </Button>

                        {hasBranches && (
                          <Button
                            variant="secondary"
                            onClick={() => toggleParent(customer.id)}
                            className="h-8.5 px-3.5 text-xs font-extrabold gap-1 rounded-xl cursor-pointer text-brand-forest hover:bg-brand-sage/40"
                          >
                            {isExpanded ? "Hide Branches" : "Show Branches"}
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Nested Branches Section */}
                  {hasBranches && isExpanded && (
                    <div className="bg-gray-50/20 p-0 border-t border-brand-sage/20 animate-in slide-in-from-top duration-250">
                      <div className="px-6 py-2.5 bg-brand-sage/5 border-b border-brand-sage/20 text-[10px] font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-xs">↳</span> Associated Branch Locations
                      </div>
                      <Table>
                        <TableHeader className="bg-white/50 border-b border-brand-sage/20">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-brand-forest font-extrabold pl-8 text-[11px]">Branch Location Name</TableHead>
                            <TableHead className="text-brand-forest font-extrabold text-[11px]">Delivery Zone</TableHead>
                            <TableHead className="text-brand-forest font-extrabold text-[11px]">Map Pin</TableHead>
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
                                    href={`/customers/${branch.id}`} 
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
                                {branch.latitude && branch.longitude ? (
                                  <span className="text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 rounded text-[10px] font-extrabold inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded text-[10px] font-extrabold inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Missing
                                  </span>
                                )}
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
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditClick(branch)}
                                    className="h-7 w-7 text-gray-500 hover:bg-brand-sage/30 rounded-lg cursor-pointer"
                                    title="Edit Branch"
                                  >
                                    <Edit size={12} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteClick(branch)}
                                    className="h-7 w-7 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer"
                                    title="Delete Branch"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                  <Link href={`/customers/${branch.id}`}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-brand-sage/30 rounded-lg cursor-pointer">
                                      <ChevronRight size={14} />
                                    </Button>
                                  </Link>
                                </div>
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
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Register New Customer Profile</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Setup standalone clients or corporate branch offices</p>
                </div>
                <Button 
                  onClick={() => setShowAddModal(false)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer animate-none"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-5">
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Company / Customer Name *</label>
                    <Input 
                      placeholder="e.g. Shoprite Acacia Branch" 
                      required 
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="h-9.5 text-xs rounded-xl border-brand-sage/50 placeholder:text-gray-300 font-bold text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Customer Relationship Classification *</label>
                    <select 
                      value={newClassification}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setNewClassification(val);
                        if (val !== "branch") {
                          setNewParentId("");
                        }
                      }}
                      className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    >
                      <option value="independent">Independent / Stand-alone</option>
                      <option value="file_opener">Corporate HQ / File Opener</option>
                      <option value="branch">Branch Location</option>
                    </select>
                  </div>

                  {newClassification === "branch" && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Belongs to Parent Corporate HQ *</label>
                      <select 
                        required={newClassification === "branch"}
                        value={newParentId}
                        onChange={(e) => setNewParentId(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="">(Select Parent Corporate HQ)</option>
                        {dbCustomers.filter(c => c.classification === 'file_opener' || (!c.parent_id && c.classification !== 'branch')).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Client Type</label>
                      <select 
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="supermarket">Supermarket</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="institution">Institution / Hotel</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="individual">Individual client</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Area *</label>
                      <Input 
                        placeholder="e.g. Kololo" 
                        required 
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50 placeholder:text-gray-300 font-bold text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Account Manager / Contact Person *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <Input 
                        placeholder="e.g. Sarah Jane" 
                        required
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
                          placeholder="billing@company.com" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Contact Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. 0772000000" 
                          required
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Billing Address *</label>
                    <Input 
                      placeholder="e.g. Plot 4, Acacia Avenue, Kampala" 
                      required
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                    />
                  </div>

                  {newClassification !== "file_opener" && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Map Location Coordinate Pin *</label>
                      <MapPicker 
                        lat={newLatitude}
                        lng={newLongitude}
                        onChange={(lat, lng) => {
                          setNewLatitude(lat);
                          setNewLongitude(lng);
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Credit Terms</label>
                      <select 
                        value={newCreditTerms}
                        onChange={(e) => setNewCreditTerms(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="cash">Immediate Cash / Cash On Delivery</option>
                        <option value="7_days">7 Days Net Terms</option>
                        <option value="14_days">14 Days Net Terms</option>
                        <option value="30_days">30 Days Net Terms</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Approved Credit Limit (UGX) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          type="number"
                          placeholder="e.g. 10000000" 
                          required
                          value={newCreditLimit}
                          onChange={(e) => setNewCreditLimit(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50 font-mono text-brand-forest font-bold"
                        />
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
                    className="h-9.5 px-4.5 rounded-xl text-xs font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 cursor-pointer"
                  >
                    Cancel Setup
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-9.5 px-5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs cursor-pointer flex items-center gap-1"
                  >
                    {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                    Confirm & Register
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* EDIT CUSTOMER MODAL OVERLAY */}
        {showEditModal && editingCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Edit Customer Profile</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Modify standalone customer or branch details</p>
                </div>
                <Button 
                  onClick={() => { setShowEditModal(false); setEditingCustomer(null); }} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer animate-none"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditCustomerSubmit} className="p-6 space-y-5">
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Company / Customer Name *</label>
                    <Input 
                      placeholder="e.g. Shoprite Acacia Branch" 
                      required 
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="h-9.5 text-xs rounded-xl border-brand-sage/50 placeholder:text-gray-300 font-bold text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Customer Relationship Classification *</label>
                    <select 
                      value={editClassification}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setEditClassification(val);
                        if (val !== "branch") {
                          setEditParentId("");
                        }
                      }}
                      className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    >
                      <option value="independent">Independent / Stand-alone</option>
                      <option value="file_opener">Corporate HQ / File Opener</option>
                      <option value="branch">Branch Location</option>
                    </select>
                  </div>

                  {editClassification === "branch" && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Belongs to Parent Corporate HQ *</label>
                      <select 
                        required={editClassification === "branch"}
                        value={editParentId}
                        onChange={(e) => setEditParentId(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="">(Select Parent Corporate HQ)</option>
                        {dbCustomers.filter(c => (c.classification === 'file_opener' || (!c.parent_id && c.classification !== 'branch')) && c.id !== editingCustomer.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Client Type</label>
                      <select 
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="supermarket">Supermarket</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="institution">Institution / Hotel</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="individual">Individual client</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Area *</label>
                      <Input 
                        placeholder="e.g. Kololo" 
                        required 
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50 placeholder:text-gray-300 font-bold text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Account Manager / Contact Person *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <Input 
                        placeholder="e.g. Sarah Jane" 
                        required
                        value={editContactPerson}
                        onChange={(e) => setEditContactPerson(e.target.value)}
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
                          placeholder="billing@company.com" 
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Contact Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. 0772000000" 
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Billing Address *</label>
                    <Input 
                      placeholder="e.g. Plot 4, Acacia Avenue, Kampala" 
                      required
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                    />
                  </div>

                  {editClassification !== "file_opener" && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Map Location Coordinate Pin *</label>
                      <MapPicker 
                        lat={editLatitude}
                        lng={editLongitude}
                        onChange={(lat, lng) => {
                          setEditLatitude(lat);
                          setEditLongitude(lng);
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Credit Terms</label>
                      <select 
                        value={editCreditTerms}
                        onChange={(e) => setEditCreditTerms(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="cash">Immediate Cash / Cash On Delivery</option>
                        <option value="7_days">7 Days Net Terms</option>
                        <option value="14_days">14 Days Net Terms</option>
                        <option value="30_days">30 Days Net Terms</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Approved Credit Limit (UGX) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          type="number"
                          placeholder="e.g. 10000000" 
                          required
                          value={editCreditLimit}
                          onChange={(e) => setEditCreditLimit(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50 font-mono text-brand-forest font-bold"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer / Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-150/70">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setShowEditModal(false); setEditingCustomer(null); }}
                    className="h-9.5 px-4.5 rounded-xl text-xs font-bold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 cursor-pointer"
                  >
                    Cancel Edit
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-9.5 px-5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs cursor-pointer flex items-center gap-1"
                  >
                    {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                    Save Changes
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
