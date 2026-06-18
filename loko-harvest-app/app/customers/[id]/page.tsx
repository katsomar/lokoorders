"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  CreditCard, 
  History, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Printer, 
  Building2, 
  DollarSign, 
  FileText,
  Loader2
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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import api from "@/lib/api";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLedgerLoading, setIsLedgerLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ledger" | "branches" | "consumption">("ledger");
  const [ledgerFilter, setLedgerFilter] = useState<string>("all");
  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [isConsumptionLoading, setIsConsumptionLoading] = useState(false);
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBranch, setPaymentBranch] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedProofTx, setSelectedProofTx] = useState<any | null>(null);

  // Logo uploading cosmetics simulation
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [customerLogo, setCustomerLogo] = useState<{ color: string; letter: string } | null>(null);

  const handleSimulateLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setLogoUploading(true);
    setLogoProgress(0);
    
    const interval = setInterval(() => {
      setLogoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLogoUploading(false);
          const firstLetter = customer ? customer.name.charAt(0).toUpperCase() : "C";
          setCustomerLogo({
            color: "bg-brand-forest text-brand-yellow border border-brand-yellow/30 shadow-md",
            letter: firstLetter
          });
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const loadCustomerDetails = async () => {
    setIsLoading(true);
    setIsLedgerLoading(true);
    setConsumptionData(null);
    try {
      const customerId = params.id as string;
      
      // Fetch all customer profiles to check parent-child structure
      const resCustomers = await api.get("/customers", { params: { per_page: 100 } });
      const allDb = resCustomers.data.data?.data || resCustomers.data.data || [];

      if (customerId === "parent-shoprite" || customerId === "parent-mega") {
        // HQ corporate grouping retrieval
        const filterName = customerId === "parent-shoprite" ? "shoprite" : "mega";
        const branchesDb = allDb.filter((c: any) => !c.parent_id && c.name.toLowerCase().includes(filterName));
        
        const branchItems = branchesDb.map((c: any) => ({
          id: c.id,
          name: c.name,
          contact: c.contact_person || "N/A",
          phone: c.phone_primary || "N/A",
          zone: c.zone?.name || "Kampala",
          credit_limit: parseFloat(c.credit_limit || 0),
          balance: parseFloat(c.account?.current_balance || 0),
          credit_terms: c.credit_terms === "cash" ? "Cash Only" : c.credit_terms.replace("_", " "),
          email: c.email || "N/A",
          address: c.address || "N/A",
          type: c.customer_type || "supermarket",
        }));

        const parentObj = {
          id: customerId,
          name: customerId === "parent-shoprite" ? "Shoprite Supermarkets" : "Mega Standard Supermarkets",
          contact_person: customerId === "parent-shoprite" ? "John Okello (HQ Sales Manager)" : "Moses Mukasa (HQ Finance Director)",
          phone: customerId === "parent-shoprite" ? "0772 123 456" : "0702 444 555",
          email: customerId === "parent-shoprite" ? "corporate@shoprite.co.ug" : "finance@megastandard.co.ug",
          address: customerId === "parent-shoprite" ? "Plot 3-5, Lugogo Bypass, Kampala" : "Chase Complex, Kampala Rd, Kampala",
          zone: "Multiple Zones",
          type: "supermarket",
          credit_terms: customerId === "parent-shoprite" ? "30 Days" : "14 Days",
          credit_limit: branchesDb.reduce((acc: number, b: any) => acc + parseFloat(b.credit_limit || 0), 0),
          isParent: true,
          isBranch: false,
          branches: branchItems
        };

        setCustomer(parentObj);

        // Fetch consolidated ledger from all branches
        const ledgersPromise = branchesDb.map((b: any) => 
          api.get(`/accounts/${b.id}/ledger`, { params: { per_page: 50 } })
            .then(res => ({
              branchId: b.id,
              branchName: b.name.replace("Shoprite ", "").replace("Mega Standard ", "").replace(" Branch", ""),
              data: res.data.data?.data || []
            }))
            .catch(() => ({ branchId: b.id, branchName: b.name, data: [] }))
        );

        const branchesLedgers = await Promise.all(ledgersPromise);
        let consolidatedLedger: any[] = [];
        
        branchesLedgers.forEach(bl => {
          bl.data.forEach((tx: any) => {
            const items = tx.invoice?.order?.items || [];
            const mappedItems = items.map((item: any) => ({
              productName: item.product?.name || "Product",
              quantity: item.quantity,
              unit: item.product?.unit_of_measure || "units",
              unitPrice: parseFloat(item.unit_price || 0)
            }));

            consolidatedLedger.push({
              id: tx.id,
              date: tx.transaction_date,
              branchId: bl.branchId,
              branchName: bl.branchName,
              type: tx.type === "invoice_raised" ? "invoice" : "payment",
              ref: tx.reference_number,
              description: tx.description,
              debit: parseFloat(tx.debit_amount || 0),
              credit: parseFloat(tx.credit_amount || 0),
              balance: parseFloat(tx.running_balance || 0),
              efrisNumber: tx.type === "invoice_raised" ? tx.reference_number : "-",
              paymentMethod: tx.type === "payment_received" ? "Direct Credit" : "-",
              deliveredBy: "-",
              receivedBy: tx.user?.name || "System",
              proofDoc: tx.type === "invoice_raised" ? "/proof_inv.jpg" : "/proof_rcpt.jpg",
              items: mappedItems
            });
          });
        });

        consolidatedLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLedger(consolidatedLedger);

      } else {
        const dbCustomer = allDb.find((c: any) => c.id === customerId);
        if (!dbCustomer) {
          throw new Error("Customer profile not found");
        }

        const branchesDb = allDb.filter((c: any) => c.parent_id === customerId);

        if (branchesDb.length > 0) {
          // It is a dynamic corporate parent HQ!
          const branchItems = branchesDb.map((c: any) => ({
            id: c.id,
            name: c.name,
            contact: c.contact_person || "N/A",
            phone: c.phone_primary || "N/A",
            zone: c.zone?.name || "Kampala",
            credit_limit: parseFloat(c.credit_limit || 0),
            balance: parseFloat(c.account?.current_balance || 0),
            credit_terms: c.credit_terms === "cash" ? "Cash Only" : c.credit_terms.replace("_", " "),
            email: c.email || "N/A",
            address: c.address || "N/A",
            type: c.customer_type || "supermarket",
          }));

          const parentObj = {
            id: dbCustomer.id,
            name: dbCustomer.name,
            contact_person: dbCustomer.contact_person || "N/A",
            phone: dbCustomer.phone_primary || "N/A",
            email: dbCustomer.email || "N/A",
            address: dbCustomer.address || "N/A",
            zone: dbCustomer.zone?.name || "Kampala",
            type: dbCustomer.customer_type || "supermarket",
            credit_terms: dbCustomer.credit_terms === "cash" ? "Cash Only" : dbCustomer.credit_terms.replace("_", " "),
            credit_limit: parseFloat(dbCustomer.credit_limit || 0) + branchesDb.reduce((acc: number, b: any) => acc + parseFloat(b.credit_limit || 0), 0),
            current_balance: parseFloat(dbCustomer.account?.current_balance || 0) + branchesDb.reduce((acc: number, b: any) => acc + parseFloat(b.account?.current_balance || 0), 0),
            isParent: true,
            isBranch: false,
            branches: branchItems
          };

          setCustomer(parentObj);

          // Fetch consolidated ledger from all branches + parent
          const ledgersPromise = [dbCustomer, ...branchesDb].map((b: any) => 
            api.get(`/accounts/${b.id}/ledger`, { params: { per_page: 50 } })
              .then(res => ({
                branchId: b.id,
                branchName: b.name.replace("Shoprite ", "").replace("Mega Standard ", "").replace(" Branch", ""),
                data: res.data.data?.data || []
              }))
              .catch(() => ({ branchId: b.id, branchName: b.name, data: [] }))
          );

          const branchesLedgers = await Promise.all(ledgersPromise);
          let consolidatedLedger: any[] = [];
          
          branchesLedgers.forEach(bl => {
            bl.data.forEach((tx: any) => {
              const items = tx.invoice?.order?.items || [];
              const mappedItems = items.map((item: any) => ({
                productName: item.product?.name || "Product",
                quantity: item.quantity,
                unit: item.product?.unit_of_measure || "units",
                unitPrice: parseFloat(item.unit_price || 0)
              }));

              consolidatedLedger.push({
                id: tx.id,
                date: tx.transaction_date,
                branchId: bl.branchId,
                branchName: bl.branchName,
                type: tx.type === "invoice_raised" ? "invoice" : "payment",
                ref: tx.reference_number,
                description: tx.description,
                debit: parseFloat(tx.debit_amount || 0),
                credit: parseFloat(tx.credit_amount || 0),
                balance: parseFloat(tx.running_balance || 0),
                efrisNumber: tx.type === "invoice_raised" ? tx.reference_number : "-",
                paymentMethod: tx.type === "payment_received" ? "Direct Credit" : "-",
                deliveredBy: "-",
                receivedBy: tx.user?.name || "System",
                proofDoc: tx.type === "invoice_raised" ? "/proof_inv.jpg" : "/proof_rcpt.jpg",
                items: mappedItems
              });
            });
          });

          consolidatedLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setLedger(consolidatedLedger);

        } else {
          // Standalone customer or individual branch
          const c = dbCustomer;
          const ledgerRes = await api.get(`/accounts/${customerId}/ledger`, { params: { per_page: 50 } });
          const txs = ledgerRes.data.data?.data || [];
          
          const mappedTxs = txs.map((tx: any) => {
            const items = tx.invoice?.order?.items || [];
            const mappedItems = items.map((item: any) => ({
              productName: item.product?.name || "Product",
              quantity: item.quantity,
              unit: item.product?.unit_of_measure || "units",
              unitPrice: parseFloat(item.unit_price || 0)
            }));

            return {
              id: tx.id,
              date: tx.transaction_date,
              type: tx.type === "invoice_raised" ? "invoice" : "payment",
              ref: tx.reference_number,
              description: tx.description,
              debit: parseFloat(tx.debit_amount || 0),
              credit: parseFloat(tx.credit_amount || 0),
              balance: parseFloat(tx.running_balance || 0),
              efrisNumber: tx.type === "invoice_raised" ? tx.reference_number : "-",
              paymentMethod: tx.type === "payment_received" ? "Direct Credit" : "-",
              deliveredBy: "-",
              receivedBy: tx.user?.name || "System",
              proofDoc: tx.type === "invoice_raised" ? "/proof_inv.jpg" : "/proof_rcpt.jpg",
              items: mappedItems
            };
          });

          setLedger(mappedTxs);

          const detailObj = {
            id: c.id,
            name: c.name,
            contact_person: c.contact_person || "N/A",
            phone: c.phone_primary || "N/A",
            email: c.email || "N/A",
            address: c.address || "N/A",
            zone: c.zone?.name || "Kampala",
            type: c.customer_type || "supermarket",
            credit_terms: c.credit_terms === "cash" ? "Cash Only" : c.credit_terms.replace("_", " "),
            credit_limit: parseFloat(c.credit_limit || 0),
            current_balance: parseFloat(c.account?.current_balance || 0),
            isParent: false,
            isBranch: c.parent_id ? true : false,
            branches: []
          };

          setCustomer(detailObj);
        }
      }
    } catch (err) {
      console.error("Failed to load customer profile details:", err);
    } finally {
      setIsLoading(false);
      setIsLedgerLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDetails();
  }, [params.id]);

  const loadConsumptionAnalysis = async () => {
    setIsConsumptionLoading(true);
    try {
      const customerId = params.id as string;
      const res = await api.get(`/customers/${customerId}/consumption-analysis`);
      setConsumptionData(res.data.data);
    } catch (err) {
      console.error("Failed to load customer consumption analysis:", err);
    } finally {
      setIsConsumptionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "consumption" && customer && !consumptionData) {
      loadConsumptionAnalysis();
    }
  }, [activeTab, customer]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;

    setIsSubmitting(true);
    try {
      const finalCustomerId = customer.isParent 
        ? (paymentBranch === "all" ? customer.branches[0]?.id : paymentBranch) 
        : customer.id;

      await api.post("/payments", {
        customer_id: finalCustomerId,
        payment_date: new Date().toISOString().split('T')[0],
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod, // cash, bank_transfer, mobile_money, cheque
        reference_number: referenceNumber || null,
        notes: paymentNotes || null,
        auto_allocate: true
      });

      alert("Payment receipt recorded successfully!");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNotes("");
      setReferenceNumber("");
      
      // Reload details
      loadCustomerDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to record payment credit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConsolidatedBalance = () => {
    if (!customer) return 0;
    if (customer.isParent) {
      return customer.branches.reduce((acc: number, br: any) => acc + br.balance, 0);
    }
    return customer.current_balance || 0;
  };

  const getFilteredLedger = () => {
    if (ledgerFilter === "all") return ledger;
    return ledger.filter((tx: any) => tx.branchId === ledgerFilter);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 text-gray-400 text-xs font-bold gap-2">
          <Loader2 className="animate-spin text-brand-forest" size={32} />
          Loading account profile details...
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body max-w-lg mx-auto mt-20">
          Customer profile not found.
          <div className="mt-4">
            <Button onClick={() => router.push("/customers")}>Back to Directory</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeBranch = customer && customer.isParent
    ? customer.branches.find((b: any) => b.id === activeTab)
    : null;

  const currentDues = activeBranch ? activeBranch.balance : getConsolidatedBalance();
  const currentLimit = activeBranch ? activeBranch.credit_limit : (customer ? customer.credit_limit : 0);
  const currentTerms = activeBranch ? activeBranch.credit_terms : (customer ? customer.credit_terms : "");

  const displayLedger = activeBranch
    ? ledger.filter((tx: any) => tx.branchId === activeBranch.id)
    : getFilteredLedger();

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
              className="text-brand-forest hover:bg-brand-sage/25 h-10 w-10 rounded-full cursor-pointer"
            >
              <ChevronLeft size={24} />
            </Button>
            
            {/* Circular Corporate Logo Badge */}
            <div className={`h-12 w-12 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${
              customerLogo 
                ? customerLogo.color 
                : customer.id === "parent-shoprite" ? "bg-red-600 text-white" :
                  customer.id === "parent-mega" ? "bg-brand-forest text-brand-yellow border border-brand-yellow/30" :
                  customer.name.toLowerCase().includes("kfc") ? "bg-red-800 text-white" :
                  customer.name.toLowerCase().includes("javas") ? "bg-amber-800 text-white" :
                  customer.name.toLowerCase().includes("carrefour") ? "bg-blue-800 text-white" :
                  "bg-brand-forest text-brand-yellow"
            }`}>
              {customerLogo 
                ? customerLogo.letter 
                : customer.id === "parent-shoprite" ? "S" :
                  customer.id === "parent-mega" ? "M" :
                  customer.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-black text-brand-forest font-heading leading-none">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {customer.isParent ? (
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[10px]">
                    <Building2 size={10} className="mr-1" /> HQ Corporate Account
                  </Badge>
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
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="gap-1.5 border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-4 rounded-xl text-xs shadow-sm cursor-pointer"
            >
              <Printer size={15} />
              Print Ledger Statement
            </Button>
            <Button 
              onClick={() => setShowPaymentModal(true)}
              className="gap-1.5 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-extrabold shadow-sm h-9.5 px-4 rounded-xl text-xs cursor-pointer"
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
                {activeBranch 
                  ? "Branch Dues" 
                  : (customer.isParent ? "Consolidated HQ Balance" : "Outstanding Balance")}
              </p>
              <h3 className="text-3xl font-black font-heading mt-1.5">
                UGX {currentDues.toLocaleString()}
              </h3>
              
              <div className="mt-4 flex items-center gap-2 text-xs">
                <Clock size={14} className="text-brand-yellow animate-pulse" />
                <span className="text-white/80 font-medium">
                  {activeBranch 
                    ? "Branch location outstanding dues" 
                    : (customer.isParent 
                      ? `Consolidated from ${customer.branches.length} active branches` 
                      : "Payment due within normal credit cycle")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Credit Limit */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                {activeBranch 
                  ? "Branch Credit Limit" 
                  : (customer.isParent ? "HQ Credit Limit" : "Approved Credit Limit")}
              </p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">
                UGX {currentLimit.toLocaleString()}
              </h3>
              
              <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    currentLimit > 0 && (currentDues / currentLimit) > 0.8 ? "bg-red-500" : "bg-brand-forest"
                  }`} 
                  style={{ width: `${currentLimit > 0 ? Math.min(100, (currentDues / currentLimit) * 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-bold text-right">
                {currentLimit > 0 ? Math.round((currentDues / currentLimit) * 100) : 0}% credit utilization
              </p>
            </CardContent>
          </Card>

          {/* Credit terms */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Credit Terms</p>
              <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5 capitalize">{currentTerms}</h3>
              <p className="text-xs text-brand-forest font-bold mt-5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Account in Good Standing
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Location/Branch or Count */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              {activeBranch ? (
                <>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Branch Location</p>
                  <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">{activeBranch.zone}</h3>
                  <p className="text-xs text-gray-400 mt-5 font-semibold">Dedicated delivery zone</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    {customer.isParent ? "Active Branches" : "Account Level"}
                  </p>
                  <h3 className="text-2xl font-bold text-brand-forest font-heading mt-1.5">
                    {customer.isParent ? `${customer.branches.length} Branches` : "Standalone Point"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-5 font-semibold">
                    {customer.isParent ? "Select a branch tab to view details" : "Accumulates personal outstanding dues"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 border-b border-brand-sage/40 pb-px overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`pb-3 text-sm font-bold border-b-2 px-4 cursor-pointer transition-all shrink-0 ${
              activeTab === "ledger" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-500 hover:text-brand-forest"
            }`}
          >
            {customer.isParent ? "Consolidated Account Ledger" : "Account Transaction Ledger"}
          </button>
          
          {customer.isParent && (
            <button
              onClick={() => setActiveTab("branches")}
              className={`pb-3 text-sm font-bold border-b-2 px-4 cursor-pointer transition-all shrink-0 ${
                activeTab === "branches" 
                  ? "border-brand-forest text-brand-forest" 
                  : "border-transparent text-gray-500 hover:text-brand-forest"
              }`}
            >
              Branch Breakdown ({customer.branches.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("consumption")}
            className={`pb-3 text-sm font-bold border-b-2 px-4 cursor-pointer transition-all shrink-0 ${
              activeTab === "consumption" 
                ? "border-brand-forest text-brand-forest" 
                : "border-transparent text-gray-500 hover:text-brand-forest"
            }`}
          >
            Consumption Analysis
          </button>

          {customer.isParent && customer.branches.map((b: any) => (
            <button
              key={b.id}
              onClick={() => setActiveTab(b.id)}
              className={`pb-3 text-sm font-bold border-b-2 px-4 cursor-pointer transition-all shrink-0 ${
                activeTab === b.id 
                  ? "border-brand-forest text-brand-forest" 
                  : "border-transparent text-gray-500 hover:text-brand-forest"
              }`}
            >
              {b.name.replace("Shoprite ", "").replace("Mega Standard ", "").replace(" Branch", "")}
            </button>
          ))}
        </div>

        {/* Content Section based on selected tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* LEDGER TAB */}
            {(activeTab === "ledger" || activeBranch) && (
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 border-b border-brand-sage pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4">
                  <div>
                    <CardTitle className="text-base font-bold text-brand-forest font-heading flex items-center gap-2">
                      <History size={18} className="text-brand-forest" />
                      {activeBranch 
                        ? `${activeBranch.name} Ledger` 
                        : (customer.isParent ? "Consolidated Corporate Ledger" : "Account Transaction Ledger")}
                    </CardTitle>
                    <CardDescription className="text-xs">Audit ledger of in-store delivery debits and receipt credits</CardDescription>
                  </div>
                  
                  {/* Branch filter for parents (only show on consolidated tab) */}
                  {customer.isParent && !activeBranch && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Filter:</span>
                      <select 
                        value={ledgerFilter} 
                        onChange={(e) => setLedgerFilter(e.target.value)}
                        className="text-xs font-bold text-brand-forest border border-brand-sage/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-8"
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
                          <TableHead className="text-xs font-bold text-brand-forest">Ref / Invoice</TableHead>
                          {customer.isParent && <TableHead className="text-xs font-bold text-brand-forest">Branch</TableHead>}
                          <TableHead className="text-xs font-bold text-brand-forest">Description</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Ledger Entry Type</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Handled By</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Debit (Invoice)</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Credit (Payment)</TableHead>
                          <TableHead className="text-center text-xs font-bold text-brand-forest">Verify</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Running Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLedgerLoading ? (
                          <TableRow>
                            <TableCell colSpan={customer.isParent ? 10 : 9} className="text-center py-12">
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-bold">
                                <Loader2 className="animate-spin text-brand-forest" size={16} />
                                Loading transaction ledger history...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : displayLedger.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={customer.isParent ? 10 : 9} className="text-center py-12 text-gray-500 font-body text-xs">
                              No transaction logs found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayLedger.map((tx: any) => (
                            <TableRow key={tx.id} className="hover:bg-brand-sage/5 transition-colors">
                              <TableCell className="text-xs pl-6 whitespace-nowrap">{format(new Date(tx.date), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-xs">
                                <div className="font-mono font-bold text-brand-forest">{tx.ref}</div>
                              </TableCell>
                              {customer.isParent && (
                                <TableCell>
                                  <Badge className="bg-brand-sage/30 text-brand-forest text-[9px] border-none font-bold">
                                    {tx.branchName || "HQ"}
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell className="text-xs text-gray-650 font-medium py-3 max-w-xs">
                                <div className="font-bold text-gray-900 mb-1">{tx.description}</div>
                                {tx.items && tx.items.length > 0 && (
                                  <div className="mt-1.5 space-y-1 text-[10px] text-gray-500 font-normal pl-2 border-l border-brand-sage/40">
                                    {tx.items.map((item: any, idx: number) => (
                                      <div key={idx} className="leading-relaxed whitespace-nowrap">
                                        <span className="font-bold text-brand-forest">{item.productName}</span>
                                        <span className="text-gray-400 mx-1.5">•</span>
                                        <span className="font-semibold text-gray-700">{item.quantity} {item.unit}</span>
                                        <span className="text-gray-400 mx-1.5">@</span>
                                        <span className="font-mono text-gray-600">UGX {item.unitPrice.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {tx.type === "invoice" ? (
                                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-lg py-0.5 px-2">
                                    Invoice Raised
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold rounded-lg py-0.5 px-2">
                                    Payment Received
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-gray-550 whitespace-nowrap">
                                {tx.receivedBy || "—"}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-red-600">
                                {tx.debit > 0 ? `UGX ${tx.debit.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-green-600">
                                {tx.credit > 0 ? `UGX ${tx.credit.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setSelectedProofTx(tx)}
                                  className="h-7 px-2.5 bg-brand-sage/30 hover:bg-brand-sage/50 text-brand-forest font-extrabold text-[10px] gap-1 rounded-lg border-none cursor-pointer"
                                >
                                  <FileText size={12} />
                                  Proof
                                </Button>
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
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
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
                            <Link href={`/customers/${branch.id}`} className="hover:underline">
                              {branch.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-gray-550 font-semibold uppercase">{branch.zone}</TableCell>
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

            {/* CONSUMPTION TAB */}
            {activeTab === "consumption" && (
              <div className="space-y-6">
                
                {/* 1. Consumption Summary Sub-Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Days Since Last Order */}
                  <Card className="border border-brand-sage/30 shadow-xs bg-white">
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Days Since Last Order</p>
                      <h4 className="text-xl font-black font-heading text-brand-forest mt-1">
                        {isConsumptionLoading ? (
                          <span className="text-xs font-normal text-gray-400">Loading...</span>
                        ) : consumptionData?.metrics?.days_since_last_order !== null && consumptionData?.metrics?.days_since_last_order !== undefined ? (
                          `${consumptionData.metrics.days_since_last_order} Days`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {consumptionData?.metrics?.last_order_date 
                          ? `Last ordered: ${format(new Date(consumptionData.metrics.last_order_date), "dd MMM yyyy")}`
                          : "No orders recorded"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Avg Order Frequency */}
                  <Card className="border border-brand-sage/30 shadow-xs bg-white">
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Avg Order Interval</p>
                      <h4 className="text-xl font-black font-heading text-brand-forest mt-1">
                        {isConsumptionLoading ? (
                          <span className="text-xs font-normal text-gray-400">Loading...</span>
                        ) : consumptionData?.metrics?.avg_frequency_days !== null && consumptionData?.metrics?.avg_frequency_days !== undefined ? (
                          `${consumptionData.metrics.avg_frequency_days} Days`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {consumptionData?.metrics?.avg_frequency_days 
                          ? "Typical purchasing frequency"
                          : "Need at least 2 orders"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Next Predicted Order */}
                  <Card className="border border-brand-sage/30 shadow-xs bg-white">
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Next Predicted Order</p>
                      <h4 className="text-xl font-black font-heading text-brand-forest mt-1">
                        {isConsumptionLoading ? (
                          <span className="text-xs font-normal text-gray-400">Loading...</span>
                        ) : consumptionData?.metrics?.predicted_next_order_date ? (
                          format(new Date(consumptionData.metrics.predicted_next_order_date), "dd/MM/yyyy")
                        ) : (
                          "—"
                        )}
                      </h4>
                      <div className="mt-1 flex items-center">
                        {consumptionData?.metrics?.predicted_next_order_date && (
                          (() => {
                            const daysDiff = consumptionData.metrics.days_since_last_order;
                            const avgFreq = consumptionData.metrics.avg_frequency_days;
                            
                            if (avgFreq && daysDiff > avgFreq) {
                              return (
                                <Badge className="bg-red-50 text-red-700 border border-red-200 text-[8px] font-extrabold uppercase py-0.5 px-1.5 rounded">
                                  Overdue
                                </Badge>
                              );
                            } else if (avgFreq && Math.abs(daysDiff - avgFreq) <= 1) {
                              return (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-extrabold uppercase py-0.5 px-1.5 rounded">
                                  Due Soon
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge className="bg-green-50 text-green-700 border border-green-200 text-[8px] font-extrabold uppercase py-0.5 px-1.5 rounded">
                                  On Track
                                </Badge>
                              );
                            }
                          })()
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Order Size */}
                  <Card className="border border-brand-sage/30 shadow-xs bg-white">
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Avg Order Volume</p>
                      <h4 className="text-xl font-black font-heading text-brand-forest mt-1">
                        {isConsumptionLoading ? (
                          <span className="text-xs font-normal text-gray-400">Loading...</span>
                        ) : consumptionData?.metrics?.avg_order_size_qty !== null && consumptionData?.metrics?.avg_order_size_qty !== undefined ? (
                          `${consumptionData.metrics.avg_order_size_qty} units`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {consumptionData?.metrics?.total_qty_ordered
                          ? `Total volume: ${consumptionData.metrics.total_qty_ordered.toLocaleString()}`
                          : "No volume taken"}
                      </p>
                    </CardContent>
                  </Card>

                </div>

                {/* 2. Visual Analytics Section (Product Share + Trends) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Product Consumption Share */}
                  <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage px-5 py-3">
                      <CardTitle className="text-xs font-bold text-brand-forest font-heading">Product Demand Breakdown</CardTitle>
                      <CardDescription className="text-[10px]">Percentage share of total volume taken by category</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {isConsumptionLoading ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-bold">Loading shares...</div>
                      ) : !consumptionData?.product_breakdown || consumptionData.product_breakdown.length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-body">No product consumption data available.</div>
                      ) : (
                        consumptionData.product_breakdown.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                              <span>{item.product_name}</span>
                              <span className="font-mono text-brand-forest">{item.total_qty.toLocaleString()} {item.unit} ({item.percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-forest h-full rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Monthly Consumption Trends */}
                  <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage px-5 py-3">
                      <CardTitle className="text-xs font-bold text-brand-forest font-heading">Monthly Order Volume Trends</CardTitle>
                      <CardDescription className="text-[10px]">Chronological trend of quantities and orders taken</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {isConsumptionLoading ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-bold">Loading trends...</div>
                      ) : !consumptionData?.monthly_trends || consumptionData.monthly_trends.length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-body">No trend history available.</div>
                      ) : (
                        <div className="space-y-3">
                          {consumptionData.monthly_trends.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <div>
                                <p className="text-xs font-bold text-gray-800">{item.month}</p>
                                <p className="text-[9px] text-gray-400 font-semibold">{item.order_count} Orders placed</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-brand-forest font-mono">{item.total_qty.toLocaleString()} units</p>
                                <p className="text-[9px] text-gray-550 font-semibold font-mono">UGX {item.total_value.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* 3. Consumption Frequency Table */}
                <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
                  <CardHeader className="bg-gray-50/50 border-b border-brand-sage px-6 py-4">
                    <CardTitle className="text-base font-bold text-brand-forest font-heading">
                      Consumption Interval History
                    </CardTitle>
                    <CardDescription className="text-xs">Chronological log of client order frequency intervals and volumes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                          <TableRow>
                            <TableHead className="text-xs font-bold text-brand-forest pl-6">Order Date</TableHead>
                            <TableHead className="text-xs font-bold text-brand-forest">Order #</TableHead>
                            {customer.isParent && <TableHead className="text-xs font-bold text-brand-forest">Branch</TableHead>}
                            <TableHead className="text-xs font-bold text-brand-forest">Products Taken</TableHead>
                            <TableHead className="text-center text-xs font-bold text-brand-forest">Interval (Days)</TableHead>
                            <TableHead className="text-right text-xs font-bold text-brand-forest">Total Qty</TableHead>
                            <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Order Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isConsumptionLoading ? (
                            <TableRow>
                              <TableCell colSpan={customer.isParent ? 7 : 6} className="text-center py-12">
                                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-bold">
                                  <Loader2 className="animate-spin text-brand-forest" size={16} />
                                  Calculating frequency history...
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : !consumptionData?.order_history || consumptionData.order_history.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={customer.isParent ? 7 : 6} className="text-center py-12 text-gray-500 font-body text-xs">
                                No historical orders found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            consumptionData.order_history.map((ord: any) => (
                              <TableRow key={ord.order_id} className="hover:bg-brand-sage/5 transition-colors">
                                <TableCell className="text-xs pl-6 whitespace-nowrap">{format(new Date(ord.order_date), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-xs font-mono font-bold text-brand-forest">{ord.order_number}</TableCell>
                                {customer.isParent && (
                                  <TableCell className="text-xs font-semibold text-gray-650">{ord.branch_name || "—"}</TableCell>
                                )}
                                <TableCell className="text-xs text-gray-650 font-medium py-3 max-w-xs">
                                  {ord.items && ord.items.length > 0 ? (
                                    <div className="space-y-1.5 pl-2 border-l border-brand-sage/40">
                                      {ord.items.map((item: any, idx: number) => (
                                        <div key={idx} className="leading-relaxed whitespace-nowrap text-[10px]">
                                          <span className="font-bold text-brand-forest">{item.product_name}</span>
                                          <span className="text-gray-400 mx-1.5">•</span>
                                          <span className="font-semibold text-gray-700">{item.quantity} {item.unit}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    "No products detail"
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {ord.days_since_previous !== null && ord.days_since_previous !== undefined ? (
                                    (() => {
                                      const avgFreq = consumptionData.metrics.avg_frequency_days;
                                      const interval = ord.days_since_previous;
                                      
                                      if (avgFreq && interval > avgFreq * 1.5) {
                                        return (
                                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold py-0.5 px-2 rounded-lg">
                                            {interval} Days (Delayed)
                                          </Badge>
                                        );
                                      } else {
                                        return (
                                          <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold py-0.5 px-2 rounded-lg">
                                            {interval} Days
                                          </Badge>
                                        );
                                      }
                                    })()
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">First Order</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold font-mono text-gray-800">
                                  {ord.total_qty.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-xs font-extrabold pr-6 text-brand-forest font-heading font-mono">
                                  UGX {ord.total_value.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

          </div>

          {/* Contact info sidebar */}
          <div className="space-y-6">
            
            {/* Corporate Logo Card Upload */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Corporate Identity Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className={`h-20 w-20 rounded-2xl font-heading font-black text-xl flex items-center justify-center shadow-md select-none border border-black/10 bg-brand-sage/10 text-brand-forest shrink-0 ${
                    customerLogo 
                      ? customerLogo.color 
                      : customer.id === "parent-shoprite" ? "bg-red-600 text-white" :
                        customer.id === "parent-mega" ? "bg-brand-forest text-brand-yellow border border-brand-yellow/30" :
                        "bg-brand-sage/20 text-brand-forest"
                  }`}>
                    {customerLogo ? customerLogo.letter : customer.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <label htmlFor="logo-upload-input" className="absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-extrabold uppercase">
                    Upload
                  </label>
                  <input 
                    type="file" 
                    id="logo-upload-input" 
                    accept="image/*" 
                    onChange={handleSimulateLogoUpload} 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-800">{customer.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Brand Identity Logo</p>
                </div>

                {logoUploading ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-brand-forest">
                      <span>Simulating Secure Upload...</span>
                      <span>{logoProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-yellow h-full transition-all duration-200" style={{ width: `${logoProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="logo-upload-input" 
                    className="w-full cursor-pointer h-9 px-4 bg-brand-sage/20 hover:bg-brand-sage/40 text-brand-forest font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-brand-sage/50"
                  >
                    <FileText size={14} />
                    Upload Brand Logo
                  </label>
                )}
              </CardContent>
            </Card>

            {/* HQ / Branch Contact Info */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  {activeBranch ? "Branch Office Details" : "HQ Corporate Office Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Account Manager / Contact</p>
                    <p className="text-xs font-bold text-gray-800">{activeBranch ? activeBranch.contact : customer.contact_person}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Contact Phone</p>
                    <p className="text-xs font-bold text-gray-800">{activeBranch ? activeBranch.phone : customer.phone}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Financial Email</p>
                    <p className="text-xs font-bold text-gray-800">{activeBranch ? activeBranch.email : customer.email}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{activeBranch ? "Branch Address" : "Billing HQ Address"}</p>
                    <p className="text-xs font-bold text-brand-forest">{activeBranch ? activeBranch.address : customer.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>

      {/* RECORD PAYMENT MODAL */}
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
              
              <div>
                <label className="text-xs font-bold text-brand-forest block mb-1">Received Payment Amount (UGX) *</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter exact receipt value"
                  required
                  className="font-mono text-brand-forest font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-forest block mb-1">Payment Method *</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                >
                  <option value="bank_transfer">Bank Transfer / EFT</option>
                  <option value="cash">Cash Collection</option>
                  <option value="mobile_money">Mobile Money (MTN/Airtel)</option>
                  <option value="cheque">Cheque Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-forest block mb-1">Receipt Reference #</label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="E.g. TXN-10293848"
                />
              </div>

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
                    <option value="all">Consolidated Payment (Apply to first branch)</option>
                    {customer.branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} (Outstanding: UGX {b.balance.toLocaleString()})</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-gray-400 font-medium mt-1">
                    Selecting a branch directly decreases that specific branch's balance.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-500 leading-normal">
                  Posting directly to outstanding branch statement: <span className="font-bold text-brand-forest">{customer.name}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-brand-forest block mb-1">Payment Notes</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="E.g. Consolidated payment for order invoices"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
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
                className="text-white/60 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 h-6 px-2 rounded-lg transition-colors border-none cursor-pointer"
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
                    selectedProofTx.type === "invoice" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {selectedProofTx.type === "invoice" ? "EFRIS Fiscal Invoice" : "Payment Receipt Voucher"}
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
                  <div className="flex justify-between text-gray-700 font-semibold mb-2 text-[10px]">
                    <span className="max-w-[200px] truncate">{selectedProofTx.description}</span>
                    <span>
                      UGX {(selectedProofTx.debit > 0 ? selectedProofTx.debit : selectedProofTx.credit).toLocaleString()}
                    </span>
                  </div>

                  {/* Mapped products breakdown (items taken) */}
                  {selectedProofTx.items && selectedProofTx.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-dotted border-gray-200 text-[9px] text-gray-600 space-y-1">
                      <div className="font-bold text-[8px] text-gray-400 uppercase tracking-wide">Items Mapped / Taken:</div>
                      {selectedProofTx.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-mono pl-1">
                          <span>• {item.productName} (x{item.quantity} {item.unit}) @ UGX {item.unitPrice.toLocaleString()}</span>
                          <span className="font-bold text-gray-700">UGX {(item.quantity * item.unitPrice).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-brand-forest border-t border-dashed border-gray-200 pt-1.5 text-xs">
                    <span>TOTAL VALUE</span>
                    <span>UGX {(selectedProofTx.debit > 0 ? selectedProofTx.debit : selectedProofTx.credit).toLocaleString()}</span>
                  </div>
                </div>

                {/* Handled By */}
                <div className="text-[9px] text-gray-500 space-y-1">
                  {selectedProofTx.receivedBy && selectedProofTx.receivedBy !== "—" && (
                    <div>
                      <span className="text-gray-400">RECORDED BY:</span> <strong className="text-gray-700">{selectedProofTx.receivedBy}</strong>
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
                  className="bg-brand-forest text-white hover:bg-brand-forest/90 font-bold border-none text-xs rounded-xl h-10 px-6 w-full cursor-pointer"
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
