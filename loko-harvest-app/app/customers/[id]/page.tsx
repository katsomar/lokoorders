"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Printer,
  Building2,
  ListFilter,
  DollarSign,
  Briefcase,
  FileText
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Mock customer directory including parents and standalone accounts
const allCustomers = [
  {
    id: "parent-shoprite",
    name: "Shoprite Supermarkets (HQ)",
    contact_person: "John Okello (HQ Sales Manager)",
    phone: "0772 123 456",
    email: "corporate@shoprite.co.ug",
    address: "Plot 3-5, Lugogo Bypass, Kampala",
    zone: "Multiple Zones",
    type: "supermarket",
    credit_terms: "14 Days",
    credit_limit: 30000000,
    isParent: true,
    branches: [
      { id: "shoprite-lugogo", name: "Shoprite Lugogo Branch", balance: 12500000, zone: "Kampala Central", contact: "John Okello", credit_limit: 15000000 },
      { id: "shoprite-acacia", name: "Shoprite Acacia Branch", balance: 3200000, zone: "Kololo", contact: "Agnes Nabeta", credit_limit: 15000000 }
    ],
    ledger: [
      { id: "1", date: "2026-05-16", branchId: "shoprite-lugogo", branchName: "Lugogo", type: "invoice", ref: "LHI-2026-0042", description: "Order delivery for Lugogo", debit: 4250000, credit: 0, balance: 15700000, efrisNumber: "EFRIS-UG-59283", paymentMethod: "-", deliveredBy: "Kato S. (Driver)", receivedBy: "-", proofDoc: "/proof_inv_59283.jpg" },
      { id: "2", date: "2026-05-15", branchId: "shoprite-lugogo", branchName: "Lugogo", type: "payment", ref: "LHP-2026-0515", description: "Consolidated payment via Bank Transfer", debit: 0, credit: 2000000, balance: 11450000, efrisNumber: "-", paymentMethod: "Bank Transfer", deliveredBy: "-", receivedBy: "John Okello (Sales Manager)", proofDoc: "/proof_rcpt_1029.jpg" },
      { id: "3", date: "2026-05-14", branchId: "shoprite-acacia", branchName: "Acacia", type: "invoice", ref: "LHI-2026-0041", description: "Order delivery for Acacia", debit: 3200000, credit: 0, balance: 13450000, efrisNumber: "EFRIS-UG-59114", paymentMethod: "-", deliveredBy: "Odoch F. (Logistics)", receivedBy: "-", proofDoc: "/proof_inv_59114.jpg" },
      { id: "4", date: "2026-05-12", branchId: "shoprite-lugogo", branchName: "Lugogo", type: "invoice", ref: "LHI-2026-0035", description: "Opening invoice setup", debit: 10250000, credit: 0, balance: 10250000, efrisNumber: "EFRIS-UG-58091", paymentMethod: "-", deliveredBy: "Ssempijja D. (HQ Staff)", receivedBy: "-", proofDoc: "/proof_inv_58091.jpg" },
    ]
  },
  {
    id: "parent-mega",
    name: "Mega Standard Supermarkets (HQ)",
    contact_person: "Moses Mukasa (HQ Finance Director)",
    phone: "0702 444 555",
    email: "finance@megastandard.co.ug",
    address: "Chase Complex, Kampala Rd, Kampala",
    zone: "Multiple Zones",
    type: "supermarket",
    credit_terms: "30 Days",
    credit_limit: 25000000,
    isParent: true,
    branches: [
      { id: "mega-downtown", name: "Mega Standard Downtown", balance: 4500000, zone: "Kampala Central", contact: "Moses Mukasa", credit_limit: 10000000 },
      { id: "mega-nakasero", name: "Mega Standard Nakasero", balance: 5000000, zone: "Nakasero", contact: "Daniel Lwanga", credit_limit: 10000000 },
      { id: "mega-entebbe", name: "Mega Standard Entebbe", balance: 3000000, zone: "Entebbe", contact: "Sarah Namubiru", credit_limit: 5000000 }
    ],
    ledger: [
      { id: "1", date: "2026-05-15", branchId: "mega-nakasero", branchName: "Nakasero", type: "invoice", ref: "LHI-2026-0045", description: "Deliveries for Nakasero Branch", debit: 5000000, credit: 0, balance: 12500000, efrisNumber: "EFRIS-UG-60312", paymentMethod: "-", deliveredBy: "Kato S. (Driver)", receivedBy: "-", proofDoc: "/proof_inv_60312.jpg" },
      { id: "2", date: "2026-05-13", branchId: "mega-downtown", branchName: "Downtown", type: "invoice", ref: "LHI-2026-0038", description: "Deliveries for Downtown Branch", debit: 4500000, credit: 0, balance: 7500000, efrisNumber: "EFRIS-UG-60199", paymentMethod: "-", deliveredBy: "Odoch F. (Logistics)", receivedBy: "-", proofDoc: "/proof_inv_60199.jpg" },
      { id: "3", date: "2026-05-12", branchId: "mega-entebbe", branchName: "Entebbe", type: "invoice", ref: "LHI-2026-0032", description: "Deliveries for Entebbe Branch", debit: 3000000, credit: 0, balance: 3000000, efrisNumber: "EFRIS-UG-59002", paymentMethod: "-", deliveredBy: "Ssempijja D. (HQ Staff)", receivedBy: "-", proofDoc: "/proof_inv_59002.jpg" }
    ]
  },
  {
    id: "cust-kfc",
    name: "KFC Bukoto",
    contact_person: "Sarah Jane (Store Manager)",
    phone: "0701 987 654",
    email: "bukoto@kfc-uganda.co.ug",
    address: "Bukoto Street, Kampala",
    zone: "Bukoto",
    type: "restaurant",
    credit_terms: "7 Days",
    credit_limit: 10000000,
    isParent: false,
    branches: [],
    ledger: [
      { id: "1", date: "2026-05-16", type: "invoice", ref: "LHI-2026-0043", description: "Dressed Chicken Order Delivery", debit: 5400000, credit: 0, balance: 8400000, efrisNumber: "EFRIS-UG-59299", paymentMethod: "-", deliveredBy: "Odoch F. (Logistics)", receivedBy: "-", proofDoc: "/proof_inv_59299.jpg" },
      { id: "2", date: "2026-05-14", type: "invoice", ref: "LHI-2026-0039", description: "Dressed Chicken Order Delivery", debit: 3000000, credit: 0, balance: 3000000, efrisNumber: "EFRIS-UG-58312", paymentMethod: "-", deliveredBy: "Kato S. (Driver)", receivedBy: "-", proofDoc: "/proof_inv_58312.jpg" }
    ]
  },
  {
    id: "cust-cj",
    name: "Café Javas Oasis Mall",
    contact_person: "Musa Teko",
    phone: "0755 444 333",
    email: "oasis@javas.co.ug",
    address: "Oasis Mall, Kampala Rd, Kampala",
    zone: "Oasis Mall",
    type: "restaurant",
    credit_terms: "7 Days",
    credit_limit: 8000000,
    isParent: false,
    branches: [],
    ledger: [
      { id: "1", date: "2026-05-15", type: "invoice", ref: "LHI-2026-0040", description: "Fresh Brown Egg Delivery", debit: 3200000, credit: 0, balance: 6200000, efrisNumber: "EFRIS-UG-59021", paymentMethod: "-", deliveredBy: "Odoch F. (Logistics)", receivedBy: "-", proofDoc: "/proof_inv_59021.jpg" },
      { id: "2", date: "2026-05-12", type: "invoice", ref: "LHI-2026-0031", description: "Fresh Brown Egg Delivery", debit: 3000000, credit: 0, balance: 3000000, efrisNumber: "EFRIS-UG-58004", paymentMethod: "-", deliveredBy: "Kato S. (Driver)", receivedBy: "-", proofDoc: "/proof_inv_58004.jpg" }
    ]
  },
  {
    id: "cust-carrefour",
    name: "Carrefour Oasis Mall",
    contact_person: "Peter Pan",
    phone: "0788 111 222",
    email: "oasis@carrefour.co.ug",
    address: "Oasis Mall Ground Floor, Kampala",
    zone: "Kampala Central",
    type: "supermarket",
    credit_terms: "14 Days",
    credit_limit: 20000000,
    isParent: false,
    branches: [],
    ledger: []
  }
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parent");

  const [activeTab, setActiveTab] = useState<"ledger" | "branches">("ledger");
  const [ledgerFilter, setLedgerFilter] = useState<string>("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBranch, setPaymentBranch] = useState("all");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProofTx, setSelectedProofTx] = useState<any | null>(null);

  // Find customer by ID. If it's a branch, we construct its branch record.
  const customerId = params.id as string;
  let customer: any = allCustomers.find(c => c.id === customerId);
  let parentCustomer: any = null;

  if (parentIdParam) {
    parentCustomer = allCustomers.find(c => c.id === parentIdParam);
    if (parentCustomer) {
      const branchInfo = parentCustomer.branches.find((b: any) => b.id === customerId);
      if (branchInfo) {
        customer = {
          id: branchInfo.id,
          name: branchInfo.name,
          contact_person: branchInfo.contact,
          phone: parentCustomer.phone,
          email: parentCustomer.email,
          address: `Delivery point at ${branchInfo.zone}`,
          zone: branchInfo.zone,
          type: parentCustomer.type,
          credit_terms: parentCustomer.credit_terms,
          credit_limit: branchInfo.credit_limit,
          current_balance: branchInfo.balance,
          isParent: false,
          isBranch: true,
          parentId: parentCustomer.id,
          parentName: parentCustomer.name,
          ledger: parentCustomer.ledger.filter((l: any) => l.branchId === branchInfo.id)
        };
      }
    }
  }

  // Fallback default customer structure
  if (!customer) {
    customer = allCustomers[0];
  }

  // Compute roll-up balance for parent accounts
  const consolidatedBalance = customer.isParent 
    ? customer.branches.reduce((acc: number, br: any) => acc + br.balance, 0)
    : customer.current_balance || 0;

  // Filtered ledger transactions
  const getFilteredLedger = () => {
    const rawLedger = customer.ledger || [];
    if (ledgerFilter === "all") return rawLedger;
    return rawLedger.filter((tx: any) => tx.branchId === ledgerFilter);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // Add transaction locally
      const debitVal = 0;
      const creditVal = parseFloat(paymentAmount) || 0;
      
      const newTx = {
        id: Math.random().toString(),
        date: new Date().toISOString().split("T")[0],
        branchId: paymentBranch === "all" ? undefined : paymentBranch,
        branchName: paymentBranch === "all" ? "HQ Consolidated" : customer.branches.find((b: any) => b.id === paymentBranch)?.name?.replace("Branch", "").trim(),
        type: "payment",
        ref: `LHP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        description: `Payment recorded via portal: ${paymentNotes || "No notes"}`,
        debit: debitVal,
        credit: creditVal,
        balance: consolidatedBalance - creditVal
      };

      if (customer.ledger) {
        customer.ledger.unshift(newTx);
      }
      
      // Update local balances
      if (customer.isParent && paymentBranch !== "all") {
        const targetBranch = customer.branches.find((b: any) => b.id === paymentBranch);
        if (targetBranch) {
          targetBranch.balance = Math.max(0, targetBranch.balance - creditVal);
        }
      } else if (!customer.isParent) {
        customer.current_balance = Math.max(0, customer.current_balance - creditVal);
      }

      setIsSubmitting(false);
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNotes("");
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        
        {/* Top Breadcrumb & Action bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/customers")}
              className="text-brand-forest hover:bg-brand-sage/25 h-10 w-10 rounded-full"
            >
              <ChevronLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest font-heading">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {customer.isParent ? (
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[10px]">
                    <Building2 size={10} className="mr-1" /> HQ Corporate Account
                  </Badge>
                ) : customer.isBranch ? (
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-brand-sage text-brand-forest border-none font-semibold text-[10px]">
                      Branch Location
                    </Badge>
                    <span className="text-gray-500 text-xs font-semibold">
                      of <Link href={`/customers/${customer.parentId}`} className="underline hover:text-brand-forest text-brand-forest font-bold">{customer.parentName}</Link>
                    </span>
                  </div>
                ) : (
                  <Badge className="bg-brand-sage text-brand-forest border-none font-medium text-[10px]">
                    Standalone Client
                  </Badge>
                )}
                <Badge className="bg-brand-sage text-brand-forest border-none text-[10px] font-bold capitalize">{customer.type}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" className="gap-1.5 border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-4 rounded-xl text-xs shadow-sm">
              <Printer size={15} />
              Print Ledger Statement
            </Button>
            <Button 
              onClick={() => setShowPaymentModal(true)}
              className="gap-1.5 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-extrabold shadow-sm h-9.5 px-4 rounded-xl text-xs"
            >
              <Plus size={15} />
              Record Payment Receipt
            </Button>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Outstanding Balance card */}
          <Card className="border-none shadow-xl bg-brand-forest text-white">
            <CardContent className="pt-6">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                {customer.isParent ? "Consolidated Balance" : "Outstanding Balance"}
              </p>
              <h3 className="text-3xl font-black font-heading mt-1.5">
                UGX {consolidatedBalance.toLocaleString()}
              </h3>
              
              <div className="mt-4 flex items-center gap-2 text-xs">
                <Clock size={14} className="text-brand-yellow animate-pulse" />
                <span className="text-white/80 font-medium">
                  {customer.isParent 
                    ? `Consolidated from ${customer.branches.length} active branches` 
                    : "Payment due within normal credit cycle"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Credit Limit */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                {customer.isParent ? "Group Credit Limit" : "Branch Credit Limit"}
              </p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">
                UGX {(customer.credit_limit || 0).toLocaleString()}
              </h3>
              
              <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    (customer.credit_limit || 0) > 0 && (consolidatedBalance / customer.credit_limit) > 0.8 ? "bg-red-500" : "bg-brand-forest"
                  }`} 
                  style={{ width: `${customer.credit_limit && customer.credit_limit > 0 ? Math.min(100, (consolidatedBalance / customer.credit_limit) * 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-bold text-right">
                {customer.credit_limit && customer.credit_limit > 0 ? Math.round((consolidatedBalance / customer.credit_limit) * 100) : 0}% credit utilization
              </p>
            </CardContent>
          </Card>

          {/* Credit terms */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Credit Terms</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">{customer.credit_terms}</h3>
              <p className="text-xs text-brand-forest font-bold mt-5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Account in Good Standing
              </p>
            </CardContent>
          </Card>

          {/* Total Branches / Standalone details */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                {customer.isParent ? "Active Branches" : "Account Level"}
              </p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">
                {customer.isParent ? `${customer.branches.length} Branches` : "Standalone Point"}
              </h3>
              <p className="text-xs text-gray-400 mt-5 font-semibold">
                {customer.isParent ? "Click 'Branches' tab to view breakdown" : "Accumulates personal outstanding dues"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Toggle (Only for Parent Accounts) */}
        {customer.isParent && (
          <div className="flex gap-2 border-b border-brand-sage/40 pb-px">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
                activeTab === "ledger" 
                  ? "border-brand-forest text-brand-forest" 
                  : "border-transparent text-gray-500 hover:text-brand-forest"
              }`}
            >
              Consolidated Account Ledger
            </button>
            <button
              onClick={() => setActiveTab("branches")}
              className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
                activeTab === "branches" 
                  ? "border-brand-forest text-brand-forest" 
                  : "border-transparent text-gray-500 hover:text-brand-forest"
              }`}
            >
              Branch Breakdown ({customer.branches.length})
            </button>
          </div>
        )}

        {/* Content Section based on selected tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* LEDGER TAB */}
            {activeTab === "ledger" && (
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-brand-sage pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4">
                  <div>
                    <CardTitle className="text-base font-bold text-brand-forest font-heading flex items-center gap-2">
                      <History size={18} className="text-brand-forest" />
                      {customer.isParent ? "Consolidated Corporate Ledger" : "Account Transaction Ledger"}
                    </CardTitle>
                    <CardDescription className="text-xs">Audit ledger of in-store delivery debits and receipt credits</CardDescription>
                  </div>
                  
                  {/* Branch filter for parents */}
                  {customer.isParent && (
                    <div className="flex items-center gap-2">
                      <ListFilter size={14} className="text-gray-400" />
                      <select 
                        value={ledgerFilter} 
                        onChange={(e) => setLedgerFilter(e.target.value)}
                        className="text-xs font-bold text-brand-forest border border-brand-sage/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="all">All Branches Ledger</option>
                        {customer.branches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                        <TableRow>
                          <TableHead className="text-xs font-bold text-brand-forest pl-6">Date</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Ref / EFRIS #</TableHead>
                          {customer.isParent && <TableHead className="text-xs font-bold text-brand-forest">Branch</TableHead>}
                          <TableHead className="text-xs font-bold text-brand-forest">Description</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Payment Method</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Delivered / Handled By</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Charge / Invoice (Unpaid)</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Amount Paid</TableHead>
                          <TableHead className="text-center text-xs font-bold text-brand-forest">Proof</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Outstanding Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredLedger().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={customer.isParent ? 10 : 9} className="text-center py-8 text-gray-500 font-body text-xs">
                              No ledger transactions recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredLedger().map((tx: any) => (
                            <TableRow key={tx.id} className="hover:bg-brand-sage/5 transition-colors">
                              <TableCell className="text-xs pl-6 whitespace-nowrap">{format(new Date(tx.date), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-xs">
                                <div className="font-mono font-bold text-brand-forest">{tx.ref}</div>
                                {tx.efrisNumber && tx.efrisNumber !== "-" && (
                                  <div className="text-[10px] text-gray-400 font-semibold">{tx.efrisNumber}</div>
                                )}
                              </TableCell>
                              {customer.isParent && (
                                <TableCell>
                                  <Badge className="bg-brand-sage/30 text-brand-forest text-[9px] border-none font-bold">
                                    {tx.branchName || "HQ Consolidated"}
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell className="text-xs text-gray-600 font-medium whitespace-nowrap">{tx.description}</TableCell>
                              <TableCell className="text-xs">
                                {tx.type === "invoice" ? (
                                  tx.efrisNumber && tx.efrisNumber !== "-" ? (
                                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-extrabold rounded-lg py-0.5 px-2">
                                      EFRIS Invoice
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-lg py-0.5 px-2">
                                      Farm Invoice
                                    </Badge>
                                  )
                                ) : tx.paymentMethod && tx.paymentMethod !== "-" ? (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold rounded-lg py-0.5 px-2">
                                    {tx.paymentMethod}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 font-medium">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                {tx.deliveredBy && tx.deliveredBy !== "-" ? (
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dispatched By</span>
                                    <span>{tx.deliveredBy}</span>
                                  </div>
                                ) : tx.receivedBy && tx.receivedBy !== "-" ? (
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Received By</span>
                                    <span>{tx.receivedBy}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-red-600">
                                {tx.debit > 0 ? `UGX ${tx.debit.toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-green-600">
                                {tx.credit > 0 ? `UGX ${tx.credit.toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                {tx.proofDoc ? (
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setSelectedProofTx(tx)}
                                    className="h-7 px-2.5 bg-brand-sage/30 hover:bg-brand-sage/50 text-brand-forest font-extrabold text-[10px] gap-1 rounded-lg border-none"
                                  >
                                    <FileText size={12} />
                                    View Proof
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 font-medium">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs font-extrabold pr-6 text-brand-forest font-heading">
                                UGX {tx.balance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BRANCHES TAB (Only parents) */}
            {customer.isParent && activeTab === "branches" && (
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-brand-sage px-6 py-4">
                  <CardTitle className="text-base font-bold text-brand-forest font-heading flex items-center gap-2">
                    <Building2 size={18} className="text-brand-forest" />
                    Corporate Branch Allocation Dues
                  </CardTitle>
                  <CardDescription className="text-xs">Outstanding ledger balances breakdown by individual delivery point</CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-brand-forest pl-6">Branch Name</TableHead>
                        <TableHead className="text-xs font-bold text-brand-forest">Delivery Zone</TableHead>
                        <TableHead className="text-xs font-bold text-brand-forest">Branch Contact</TableHead>
                        <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Outstanding Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.branches.map((branch: any) => (
                        <TableRow key={branch.id} className="hover:bg-brand-sage/5 transition-colors">
                          <TableCell className="pl-6 font-bold text-brand-forest">
                            <Link href={`/customers/${branch.id}?parent=${customer.id}`} className="hover:underline">
                              {branch.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-semibold uppercase">{branch.zone}</TableCell>
                          <TableCell className="text-xs font-medium text-gray-700">{branch.contact}</TableCell>
                          <TableCell className="text-right pr-6">
                            <span className={`font-extrabold text-xs ${branch.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              UGX {branch.balance.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Contact info sidebar */}
          <div className="space-y-6">
            
            {/* HQ Contact Info */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  {customer.isBranch ? "Branch Head Office Contact" : "HQ Corporate Office Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Account Manager</p>
                    <p className="text-xs font-bold text-gray-800">{customer.contact_person}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Contact Phone</p>
                    <p className="text-xs font-bold text-gray-800">{customer.phone}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Financial Email</p>
                    <p className="text-xs font-bold text-gray-800">{customer.email}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Billing/Intake HQ Address</p>
                    <p className="text-xs font-bold text-brand-forest">{customer.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick configuration settings */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-brand-sage text-brand-forest font-semibold hover:bg-brand-sage/10 text-xs rounded-xl">
                <CreditCard size={16} className="text-brand-mid" />
                Adjust General Credit Limits
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-brand-sage text-brand-forest font-semibold hover:bg-brand-sage/10 text-xs rounded-xl">
                <History size={16} className="text-brand-mid" />
                Alter Corporate Credit Terms
              </Button>
            </div>

          </div>

        </div>

      </div>

      {/* RECORD PAYMENT MODAL (WITH BRANCH ROUTING SUPPORT) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Record Payment Receipt</h3>
                <p className="text-[10px] text-white/70">Register incoming customer funds to credit outstanding accounts</p>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              
              {/* Payment Amount */}
              <Input
                label="Received Payment Amount (UGX)"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter exact receipt value"
                required
              />

              {/* Branch Selector (Only if Parent corporate) */}
              {customer.isParent ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-forest block mb-1">
                    Apply Credit to Branch Account
                  </label>
                  <select 
                    value={paymentBranch}
                    onChange={(e) => setPaymentBranch(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                  >
                    <option value="all">Consolidated Payment (Apply to Parent Account)</option>
                    {customer.branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} (Outstanding: UGX {b.balance.toLocaleString()})</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-gray-400 font-medium mt-1">
                    Selecting a branch directly decreases that specific branch's balance on seed statement ledgering.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-500 leading-normal">
                  Posting directly to outstanding branch statement: <span className="font-bold text-brand-forest">{customer.name}</span>
                </div>
              )}

              {/* Notes */}
              <Input
                label="Payment Description / Receipt Reference"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="E.g. Bank Transfer Ref: #TXN-90234"
              />

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6"
                  isLoading={isSubmitting}
                >
                  Post Payment Credit
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VERIFY PROOF DOCUMENT MODAL */}
      {selectedProofTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center justify-between border-b border-brand-sage/20">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-brand-yellow" />
                <div>
                  <h3 className="font-heading font-bold text-base">Digital Document Verification</h3>
                  <p className="text-[10px] text-white/70">Secure, read-only system audit proof ledger verification</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProofTx(null)}
                className="text-white/60 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 h-6 px-2 rounded-lg transition-colors border-none"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Paper Receipt Mockup Graphic */}
              <div className="bg-amber-50/15 border-2 border-dashed border-gray-300 rounded-2xl p-5 font-mono text-xs text-gray-800 space-y-4 max-w-sm mx-auto shadow-inner relative overflow-hidden">
                {/* Receipt Header */}
                <div className="text-center border-b border-dashed border-gray-300 pb-3">
                  <p className="font-extrabold uppercase text-[12px] tracking-wider text-brand-forest">LOKO HARVEST FARM LTD</p>
                  <p className="text-[9px] text-gray-400">P.O. Box 7244, Mukono, Uganda</p>
                  <p className="text-[9px] text-gray-400">Tel: +256 700 100 200</p>
                  <div className={`mt-2 text-[9px] font-extrabold py-0.5 px-2 rounded uppercase inline-block ${
                    selectedProofTx.type === "invoice" 
                      ? (selectedProofTx.efrisNumber && selectedProofTx.efrisNumber !== "-" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {selectedProofTx.type === "invoice" 
                      ? (selectedProofTx.efrisNumber && selectedProofTx.efrisNumber !== "-" ? "EFRIS Fiscal Invoice" : "Farm Standard Invoice")
                      : "Payment Receipt Voucher"
                    }
                  </div>
                </div>

                {/* Receipt Metadata */}
                <div className="space-y-1.5 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">DATE:</span>
                    <span className="font-bold">{format(new Date(selectedProofTx.date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">REF NO:</span>
                    <span className="font-bold">{selectedProofTx.ref}</span>
                  </div>
                  {selectedProofTx.efrisNumber && selectedProofTx.efrisNumber !== "-" && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">EFRIS NO:</span>
                      <span className="font-bold text-red-600">{selectedProofTx.efrisNumber}</span>
                    </div>
                  )}
                  {selectedProofTx.paymentMethod && selectedProofTx.paymentMethod !== "-" && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">METHOD:</span>
                      <span className="font-bold">{selectedProofTx.paymentMethod}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">CUSTOMER:</span>
                    <span className="font-bold">{customer.name}</span>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="border-t border-b border-dashed border-gray-300 py-3 text-[10px]">
                  <div className="flex justify-between font-bold text-gray-500 uppercase text-[8px] mb-1">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between text-gray-700 font-semibold mb-2">
                    <span>{selectedProofTx.description}</span>
                    <span>
                      UGX {(selectedProofTx.debit > 0 ? selectedProofTx.debit : selectedProofTx.credit).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-brand-forest border-t border-dashed border-gray-200 pt-1.5 text-xs">
                    <span>TOTAL VALUE</span>
                    <span>UGX {(selectedProofTx.debit > 0 ? selectedProofTx.debit : selectedProofTx.credit).toLocaleString()}</span>
                  </div>
                </div>

                {/* Handled By */}
                <div className="text-[9px] text-gray-500 space-y-1">
                  {selectedProofTx.deliveredBy && selectedProofTx.deliveredBy !== "-" && (
                    <div>
                      <span className="text-gray-400">DISPATCHED BY:</span> <strong className="text-gray-700">{selectedProofTx.deliveredBy}</strong>
                    </div>
                  )}
                  {selectedProofTx.receivedBy && selectedProofTx.receivedBy !== "-" && (
                    <div>
                      <span className="text-gray-400">COLLECTED BY:</span> <strong className="text-gray-700">{selectedProofTx.receivedBy}</strong>
                    </div>
                  )}
                </div>

                {/* Footer barcode mockup */}
                <div className="text-center pt-2 border-t border-dashed border-gray-200">
                  <div className="inline-block bg-gray-900 text-white font-mono tracking-widest text-[8px] py-1.5 px-3 rounded uppercase font-bold">
                    ||||| | |||| ||| || ||| | {selectedProofTx.ref}
                  </div>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-semibold text-center w-full">Thank you for doing business with Loko Harvest!</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5">
                <Button 
                  onClick={() => setSelectedProofTx(null)}
                  className="bg-brand-forest text-white hover:bg-brand-forest/90 font-bold border-none text-xs rounded-xl h-10 px-6 w-full"
                >
                  Verify & Close Audit
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
