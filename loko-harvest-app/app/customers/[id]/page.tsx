"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Loader2,
  PenTool
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportGeneratorModal from "@/components/ReportGeneratorModal";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const CustomGeneralTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    
    return (
      <div className="bg-white p-4 border border-brand-sage/60 rounded-xl shadow-xl font-body text-xs space-y-3 max-w-sm">
        <div className="flex justify-between items-center border-b border-brand-sage/40 pb-2">
          <span className="font-extrabold text-brand-forest">Order Date: {data.name}</span>
          <span className="font-mono text-[10px] text-gray-400">
            {data.date ? format(new Date(data.date), "dd MMM yyyy") : ""}
          </span>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs font-black text-brand-forest">
            <span>Total Orders:</span>
            <span>{data.consolidated} Trays</span>
          </div>
          
          {data.branchesList && data.branchesList.length > 0 && (
            <div className="border-t border-dotted border-brand-sage/40 pt-2 space-y-3">
              {data.branchesList.map((branch: any, bIdx: number) => (
                <div key={bIdx} className="space-y-1">
                  <div className="flex justify-between items-center font-bold text-[11px] text-brand-forest">
                    <span>• {branch.branchName}</span>
                    <span className="font-mono text-gray-700">{branch.totalTrays} Trays</span>
                  </div>
                  <div className="pl-3 space-y-0.5 text-[10px] text-gray-500 font-medium border-l border-brand-sage/20 ml-1">
                    {branch.items && branch.items.map((item: any, iIdx: number) => (
                      <div key={iIdx} className="flex justify-between">
                        <span>{item.product_name}</span>
                        <span className="pl-4">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLedgerLoading, setIsLedgerLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ledger" | "branches" | "consumption">("ledger");
  const [ledgerFilter, setLedgerFilter] = useState<string>("all");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");
  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [isConsumptionLoading, setIsConsumptionLoading] = useState(false);
  const [generalTrendFilter, setGeneralTrendFilter] = useState<string>("consolidated");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("15");
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBranch, setPaymentBranch] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedProofTx, setSelectedProofTx] = useState<any | null>(null);
  const [selectedSignatureTx, setSelectedSignatureTx] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Logo uploading real logic
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !customer) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("logo", file);

    setLogoUploading(true);
    setLogoProgress(10);
    try {
      setLogoProgress(35);
      const res = await api.post(`/customers/${customer.id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setLogoProgress(percentCompleted);
        }
      });
      setLogoProgress(100);
      
      if (res.data.data?.logo_url) {
        setCustomer((prev: any) => ({
          ...prev,
          logo_url: res.data.data.logo_url
        }));
      }
      alert("Logo uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
      setLogoProgress(0);
    }
  };

  const loadCustomerDetails = async () => {
    setIsLoading(true);
    setIsLedgerLoading(true);
    setConsumptionData(null);
    try {
      const customerId = params.id as string;
      
      // Fetch specific customer profile (which eager loads branches, parent, zone, account)
      const resCustomer = await api.get(`/customers/${customerId}`);
      const dbCustomer = resCustomer.data.data;
      if (!dbCustomer) {
        throw new Error("Customer profile not found");
      }

      const branchesDb = dbCustomer.branches || [];
      const isParent = branchesDb.length > 0;

      // Fetch consolidated ledger in one query (automatically fetches HQ + branches)
      const ledgerRes = await api.get(`/accounts/${customerId}/ledger`, { params: { per_page: 100 } });
      const txs = ledgerRes.data.data?.data || [];

      const mappedTxs = txs.map((tx: any) => {
        const items = tx.invoice?.order?.items || [];
        const mappedItems = items.map((item: any) => ({
          productName: item.product?.name || "Product",
          quantity: item.quantity,
          unit: item.product?.unit_of_measure || "units",
          unitPrice: parseFloat(item.unit_price || 0)
        }));

        const deliveries = tx.invoice?.order?.deliveries || [];
        const completedDelivery = deliveries.find((d: any) => d.status === "delivered");
        const firstProof = completedDelivery?.proofs?.[0];

        const rawBranchName = tx.customer?.name || "";
        const branchName = rawBranchName.replace("Shoprite ", "").replace("Mega Standard ", "").replace(" Branch", "");

        return {
          id: tx.id,
          date: tx.transaction_date,
          branchId: tx.customer_id,
          branchName: branchName || "HQ",
          type: tx.type === "invoice_raised" ? "invoice" : "payment",
          ref: tx.reference_number,
          description: tx.description,
          debit: parseFloat(tx.debit_amount || 0),
          credit: parseFloat(tx.credit_amount || 0),
          balance: parseFloat(tx.running_balance || 0),
          efrisNumber: tx.type === "invoice_raised" ? tx.reference_number : "-",
          paymentMethod: tx.type === "payment_received" ? "Direct Credit" : "-",
          deliveredBy: completedDelivery?.driver?.full_name || "-",
          receivedBy: tx.user?.name || "System",
          proofDoc: tx.type === "invoice_raised" ? (firstProof?.document_proof_url || "/proof_inv.jpg") : "/proof_rcpt.jpg",
          signatureUrl: firstProof?.signature_proof_url || null,
          items: mappedItems,
          fdn: tx.invoice?.order?.fiscal_document_number || "",
          orderNumber: tx.invoice?.order?.order_number || ""
        };
      });

      setLedger(mappedTxs);

      if (isParent) {
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
          logo_url: dbCustomer.logo_url,
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
      } else {
        // Standalone customer or individual branch
        const c = dbCustomer;
        const detailObj = {
          id: c.id,
          name: c.name,
          logo_url: c.logo_url,
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



  const activeBranch = customer && customer.isParent
    ? customer.branches.find((b: any) => b.id === activeTab)
    : null;

  const currentDues = activeBranch ? activeBranch.balance : getConsolidatedBalance();
  const currentLimit = activeBranch ? activeBranch.credit_limit : (customer ? customer.credit_limit : 0);
  const currentTerms = activeBranch ? activeBranch.credit_terms : (customer ? customer.credit_terms : "");

  const baseLedger = activeBranch
    ? ledger.filter((tx: any) => tx.branchId === activeBranch.id)
    : getFilteredLedger();

  const displayLedger = baseLedger.filter((tx: any) => {
    if (!ledgerSearch) return true;
    const term = ledgerSearch.toLowerCase();
    return (
      tx.ref?.toLowerCase().includes(term) ||
      tx.description?.toLowerCase().includes(term) ||
      tx.fdn?.toLowerCase().includes(term) ||
      tx.orderNumber?.toLowerCase().includes(term)
    );
  });

  // 1. General Order Trend Data & Dynamic Metrics calculations
  const convertToTrays = (nameOrCode: string, quantityInput: any): number => {
    const quantity = parseFloat(quantityInput || 0);
    const term = (nameOrCode || "").toLowerCase();
    if (term.includes("15-pack") || term.includes("15 pack") || term.endsWith("-15p")) {
      return quantity / 2;
    } else if (term.includes("6-pack") || term.includes("6 pack") || term.includes("06-pack") || term.endsWith("-06p")) {
      return quantity / 5;
    } else if (term.includes("single") || term.endsWith("-sgl")) {
      return quantity / 30;
    }
    return quantity;
  };

  const filteredOrderHistory = useMemo(() => {
    const history = consumptionData?.order_history || [];
    if (timeframeFilter === "all") return history;
    
    const limitDays = parseInt(timeframeFilter, 10);
    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - limitDays);
    
    return history.filter((ord: any) => {
      const ordDate = new Date(ord.order_date);
      return ordDate >= cutOffDate;
    });
  }, [consumptionData, timeframeFilter]);

  const chronologicalHistory = useMemo(() => {
    return [...filteredOrderHistory].reverse();
  }, [filteredOrderHistory]);

  const datesList = useMemo(() => {
    if (timeframeFilter === "all") {
      return Array.from(
        new Set(
          (consumptionData?.order_history || []).map((ord: any) => ord.order_date.split('T')[0])
        )
      ).sort() as string[];
    }
    
    const limitDays = parseInt(timeframeFilter, 10);
    const dates: string[] = [];
    const today = new Date();
    for (let i = limitDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [consumptionData, timeframeFilter]);

  const branchesInHistory = useMemo(() => {
    if (customer?.isParent && customer.branches) {
      return customer.branches.map((b: any) => b.name);
    }
    return Array.from(
      new Set(
        (consumptionData?.order_history || [])
          .map((ord: any) => ord.branch_name)
          .filter((name: any) => !!name)
      )
    ) as string[];
  }, [customer, consumptionData]);

  // Dynamic Metrics Recalculations
  const {
    orderCount,
    totalQtySum,
    totalValueSum,
    avgOrderSizeQty,
    daysSinceLastOrder,
    lastOrderDate,
    avgFrequency,
    predictedNextOrderDate
  } = useMemo(() => {
    const count = filteredOrderHistory.length;
    let qtySum = 0;
    let valSum = 0;
    
    filteredOrderHistory.forEach((ord: any) => {
      qtySum += parseFloat(ord.total_qty || 0);
      valSum += parseFloat(ord.total_value || 0);
    });

    const avgSize = count > 0 ? parseFloat((qtySum / count).toFixed(1)) : 0;

    let daysSince = null;
    let lastDate = null;
    if (count > 0) {
      lastDate = filteredOrderHistory[0].order_date;
      const diffTime = Math.abs(new Date().getTime() - new Date(lastDate).getTime());
      daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const intervals: number[] = [];
    let prevDate: Date | null = null;
    const sortedHistory = [...filteredOrderHistory].reverse(); // oldest to newest
    sortedHistory.forEach((ord: any) => {
      const currDate = new Date(ord.order_date);
      if (prevDate !== null) {
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }
      prevDate = currDate;
    });
    const avgFreq = intervals.length > 0 ? parseFloat((intervals.reduce((a, b) => a + b, 0) / intervals.length).toFixed(1)) : 0;

    let predictedNext = null;
    if (lastDate && avgFreq > 0) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + Math.round(avgFreq));
      predictedNext = nextDate.toISOString().split('T')[0];
    }

    return {
      orderCount: count,
      totalQtySum: qtySum,
      totalValueSum: valSum,
      avgOrderSizeQty: avgSize,
      daysSinceLastOrder: daysSince,
      lastOrderDate: lastDate,
      avgFrequency: avgFreq,
      predictedNextOrderDate: predictedNext
    };
  }, [filteredOrderHistory]);

  // Dynamic Product Demand Breakdown
  const dynamicProductBreakdown = useMemo(() => {
    const productTotals: { [productName: string]: { total_qty: number; unit: string } } = {};
    let qtySum = 0;
    
    filteredOrderHistory.forEach((ord: any) => {
      (ord.items || []).forEach((it: any) => {
        const parsedQty = parseFloat(it.quantity || 0);
        if (!productTotals[it.product_name]) {
          productTotals[it.product_name] = { total_qty: 0, unit: it.unit };
        }
        productTotals[it.product_name].total_qty += parsedQty;
        qtySum += parsedQty;
      });
    });

    return Object.entries(productTotals).map(([name, detail]) => ({
      product_name: name,
      total_qty: detail.total_qty,
      unit: detail.unit,
      percentage: qtySum > 0 ? parseFloat(((detail.total_qty / qtySum) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.total_qty - a.total_qty);
  }, [filteredOrderHistory]);

  // Dynamic Monthly Trends
  const dynamicMonthlyTrends = useMemo(() => {
    const monthlyMap: { [month: string]: { month: string; order_count: number; total_qty: number; total_value: number } } = {};
    
    chronologicalHistory.forEach((ord: any) => {
      const monthStr = format(new Date(ord.order_date), "MMMM yyyy");
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = {
          month: monthStr,
          order_count: 0,
          total_qty: 0,
          total_value: 0
        };
      }
      monthlyMap[monthStr].order_count++;
      monthlyMap[monthStr].total_qty += parseFloat(ord.total_qty || 0);
      monthlyMap[monthStr].total_value += parseFloat(ord.total_value || 0);
    });
    
    return Object.values(monthlyMap);
  }, [chronologicalHistory]);

  const generalTrendData = useMemo(() => {
    return datesList.map((dateStr: string) => {
      const dateOrders = filteredOrderHistory.filter(
        (ord: any) => ord.order_date.split('T')[0] === dateStr
      );
      
      const formattedDate = format(new Date(dateStr), "dd/MM");
      let consolidatedTrays = 0;
      
      const branchTrays: { [branchName: string]: number } = {};
      branchesInHistory.forEach((bName: any) => {
        branchTrays[bName] = 0;
      });

      const branchDetails: { 
        [branchName: string]: { 
          totalTrays: number; 
          items: { product_name: string; quantity: number; unit: string }[] 
        } 
      } = {};

      dateOrders.forEach((ord: any) => {
        const bName = ord.branch_name || "Main Customer";
        if (!branchDetails[bName]) {
          branchDetails[bName] = { totalTrays: 0, items: [] };
        }

        (ord.items || []).forEach((it: any) => {
          const parsedQty = parseFloat(it.quantity || 0);
          const trays = convertToTrays(it.product_code || it.product_name, parsedQty);
          consolidatedTrays += trays;
          branchDetails[bName].totalTrays += trays;

          const existingItem = branchDetails[bName].items.find(i => i.product_name === it.product_name);
          if (existingItem) {
            existingItem.quantity += parsedQty;
          } else {
            branchDetails[bName].items.push({
              product_name: it.product_name,
              quantity: parsedQty,
              unit: it.unit
            });
          }
        });
      });

      branchesInHistory.forEach((bName: any) => {
        branchTrays[bName] = parseFloat((branchDetails[bName]?.totalTrays || 0).toFixed(2));
      });

      const branchesList = Object.entries(branchDetails).map(([bName, detail]) => ({
        branchName: bName,
        totalTrays: parseFloat(detail.totalTrays.toFixed(2)),
        items: detail.items
      }));

      return {
        date: dateStr,
        name: formattedDate,
        consolidated: parseFloat(consolidatedTrays.toFixed(2)),
        ...branchTrays,
        branchesList
      };
    });
  }, [datesList, filteredOrderHistory, branchesInHistory]);

  const productNames = useMemo(() => {
    if (consumptionData?.product_breakdown) {
      return consumptionData.product_breakdown.map((item: any) => item.product_name) as string[];
    }
    return Array.from(
      new Set(
        (consumptionData?.order_history || []).flatMap((ord: any) => 
          (ord.items || []).map((it: any) => it.product_name)
        )
      )
    ) as string[];
  }, [consumptionData]);

  const productTrendData = useMemo(() => {
    return datesList.map((dateStr: string) => {
      const dateOrders = filteredOrderHistory.filter(
        (ord: any) => ord.order_date.split('T')[0] === dateStr
      );
      
      const formattedDate = format(new Date(dateStr), "dd/MM");
      const dataPoint: any = {
        name: formattedDate,
        date: dateStr
      };
      
      productNames.forEach((prodName: any) => {
        dataPoint[prodName] = 0;
      });
      
      dateOrders.forEach((ord: any) => {
        (ord.items || []).forEach((it: any) => {
          dataPoint[it.product_name] += parseFloat(it.quantity || 0);
        });
      });
      
      return dataPoint;
    });
  }, [datesList, filteredOrderHistory, productNames]);

  const reportTableRows = useMemo(() => {
    const rows: (string | React.ReactNode)[][] = displayLedger.map(tx => {
      const isInvoice = tx.type === "invoice";
      const dateStr = tx.date ? String(tx.date).split('T')[0] : 'N/A';

      return [
        <span key="date" className="font-mono text-gray-700 font-semibold">{dateStr}</span>,
        <div key="ref" className="flex items-center gap-1">
          <span className="font-mono text-brand-forest font-bold text-xs">{tx.ref || tx.orderNumber || "—"}</span>
          {tx.fdn && <span className="text-[9px] text-gray-400 font-mono">({tx.fdn})</span>}
        </div>,
        <span key="branch" className="text-gray-600 font-semibold text-[9.5px]">{tx.branchName || customer?.name}</span>,
        <Badge key="type" className={isInvoice ? "bg-blue-50 text-blue-800 border border-blue-200 text-[8px] font-extrabold uppercase" : "bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-extrabold uppercase"}>
          {isInvoice ? "INVOICE RAISED" : "PAYMENT REMITTANCE"}
        </Badge>,
        <span key="debit" className={tx.debit > 0 ? "font-mono font-bold text-blue-900" : "text-gray-400 font-mono"}>{tx.debit > 0 ? `UGX ${tx.debit.toLocaleString()}` : "—"}</span>,
        <span key="credit" className={tx.credit > 0 ? "font-mono font-bold text-emerald-800" : "text-gray-400 font-mono"}>{tx.credit > 0 ? `UGX ${tx.credit.toLocaleString()}` : "—"}</span>,
        <span key="bal" className="font-mono font-black text-brand-forest text-xs">UGX {tx.balance.toLocaleString()}</span>,
        <Badge key="status" className={tx.balance > 0 ? "bg-red-100 text-red-800 text-[8px] font-bold uppercase" : "bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase"}>
          {tx.balance > 0 ? "ACTIVE BALANCE" : "CLEARED"}
        </Badge>
      ];
    });

    // Summary TOTAL Row
    const totalDebit = displayLedger.reduce((s, tx) => s + tx.debit, 0);
    const totalCredit = displayLedger.reduce((s, tx) => s + tx.credit, 0);

    rows.push([
      <span key="sum-lbl" className="font-black text-brand-forest text-xs uppercase tracking-wider">STATEMENT TOTAL</span>,
      "—",
      "—",
      <Badge key="sum-bdg" className="bg-brand-forest text-brand-yellow text-[8px] font-black uppercase border-none">SUMMARY</Badge>,
      <span key="sum-deb" className="font-bold font-mono text-blue-900 text-xs">UGX {totalDebit.toLocaleString()}</span>,
      <span key="sum-cred" className="font-bold font-mono text-emerald-800 text-xs">UGX {totalCredit.toLocaleString()}</span>,
      <span key="sum-bal" className="font-black font-mono text-brand-forest text-xs">UGX {currentDues.toLocaleString()}</span>,
      "—"
    ]);

    return rows;
  }, [displayLedger, currentDues, customer]);

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
            {customer.logo_url ? (
              <img 
                src={customer.logo_url} 
                alt={customer.name} 
                className="h-12 w-12 rounded-xl object-cover shadow-sm select-none shrink-0 border border-brand-sage/40 bg-white"
              />
            ) : (
              <div className={`h-12 w-12 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${
                customer.name.toLowerCase().includes("shoprite") ? "bg-red-600 text-white" :
                customer.name.toLowerCase().includes("mega") ? "bg-brand-forest text-brand-yellow border border-brand-yellow/30" :
                customer.name.toLowerCase().includes("kfc") ? "bg-red-800 text-white" :
                customer.name.toLowerCase().includes("javas") ? "bg-amber-800 text-white" :
                customer.name.toLowerCase().includes("carrefour") ? "bg-blue-800 text-white" :
                "bg-brand-forest text-brand-yellow"
              }`}>
                {customer.name.toLowerCase().includes("shoprite") ? "S" :
                  customer.name.toLowerCase().includes("mega") ? "M" :
                  customer.name.charAt(0).toUpperCase()}
              </div>
            )}

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
              onClick={() => setShowReportModal(true)}
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
          
          <div className={`${activeTab === "consumption" ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
            
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
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search by FDN or Reference */}
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search FDN, Ref, Desc..."
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="text-xs font-medium text-brand-forest border border-brand-sage/60 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-8 w-44 placeholder:text-gray-400"
                      />
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
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                        <TableRow>
                          <TableHead className="text-xs font-bold text-brand-forest pl-6">Date</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Ref / Invoice</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">FDN</TableHead>
                          {customer.isParent && <TableHead className="text-xs font-bold text-brand-forest">Branch</TableHead>}
                          <TableHead className="text-xs font-bold text-brand-forest">Description</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Ledger Entry Type</TableHead>
                          <TableHead className="text-xs font-bold text-brand-forest">Handled By</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Debit (Invoice)</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest">Credit (Payment)</TableHead>
                          <TableHead className="text-center text-xs font-bold text-brand-forest">Proof Document</TableHead>
                          <TableHead className="text-center text-xs font-bold text-brand-forest">Signature</TableHead>
                          <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Running Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLedgerLoading ? (
                          <TableRow>
                            <TableCell colSpan={customer.isParent ? 12 : 11} className="text-center py-12">
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-bold">
                                <Loader2 className="animate-spin text-brand-forest" size={16} />
                                Loading transaction ledger history...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : displayLedger.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={customer.isParent ? 12 : 11} className="text-center py-12 text-gray-500 font-body text-xs">
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
                              <TableCell className="text-xs font-mono font-bold text-gray-700">
                                {tx.fdn || "—"}
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
                              <TableCell className="text-center text-xs">
                                {tx.signatureUrl ? (
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setSelectedSignatureTx(tx)}
                                    className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] gap-1 rounded-lg border border-blue-200 cursor-pointer"
                                  >
                                    <PenTool size={12} />
                                    Signature
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 italic text-[10px] font-medium">—</span>
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
                
                {/* Timeframe General Filter */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-brand-sage/40 shadow-sm">
                  <div>
                    <h3 className="text-xs font-bold text-brand-forest font-heading">Consumption Timeframe</h3>
                    <p className="text-[10px] text-gray-400">Filter consumption trends and predictive metrics by time range</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Filter Range:</span>
                    <select
                      value={timeframeFilter}
                      onChange={(e) => setTimeframeFilter(e.target.value)}
                      className="text-xs font-extrabold text-brand-forest border border-brand-sage rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-9 shadow-sm cursor-pointer"
                    >
                      <option value="all">All Time History</option>
                      <option value="15">Last 15 Days</option>
                      <option value="30">Last 30 Days</option>
                      <option value="60">Last 60 Days</option>
                      <option value="90">Last 90 Days</option>
                    </select>
                  </div>
                </div>

                {/* 1. Consumption Summary Sub-Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Days Since Last Order */}
                  <Card className="border border-brand-sage/30 shadow-xs bg-white">
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Days Since Last Order</p>
                      <h4 className="text-xl font-black font-heading text-brand-forest mt-1">
                        {isConsumptionLoading ? (
                          <span className="text-xs font-normal text-gray-400">Loading...</span>
                        ) : daysSinceLastOrder !== null && daysSinceLastOrder !== undefined ? (
                          `${daysSinceLastOrder} Days`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {lastOrderDate 
                          ? `Last ordered: ${format(new Date(lastOrderDate), "dd MMM yyyy")}`
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
                        ) : avgFrequency !== null && avgFrequency !== undefined && avgFrequency > 0 ? (
                          `${avgFrequency} Days`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {avgFrequency && avgFrequency > 0
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
                        ) : predictedNextOrderDate ? (
                          format(new Date(predictedNextOrderDate), "dd/MM/yyyy")
                        ) : (
                          "—"
                        )}
                      </h4>
                      <div className="mt-1 flex items-center">
                        {predictedNextOrderDate && (
                          (() => {
                            const daysDiff = daysSinceLastOrder;
                            const avgFreq = avgFrequency;
                            
                            if (avgFreq && daysDiff !== null && daysDiff > avgFreq) {
                              return (
                                <Badge className="bg-red-50 text-red-700 border border-red-200 text-[8px] font-extrabold uppercase py-0.5 px-1.5 rounded">
                                  Overdue
                                </Badge>
                              );
                            } else if (avgFreq && daysDiff !== null && Math.abs(daysDiff - avgFreq) <= 1) {
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
                        ) : avgOrderSizeQty !== null && avgOrderSizeQty !== undefined ? (
                          `${avgOrderSizeQty} units`
                        ) : (
                          "—"
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                        {totalQtySum
                          ? `Total volume: ${totalQtySum.toLocaleString()}`
                          : "No volume taken"}
                      </p>
                    </CardContent>
                  </Card>

                </div>

                {/* 2. Visual Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Product Consumption Share */}
                  <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col justify-between">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage px-5 py-3.5">
                      <CardTitle className="text-xs font-bold text-brand-forest font-heading">Product Demand Breakdown</CardTitle>
                      <CardDescription className="text-[10px]">Percentage share of total volume taken by category</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 flex-1">
                      {isConsumptionLoading ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-bold">Loading shares...</div>
                      ) : !dynamicProductBreakdown || dynamicProductBreakdown.length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-body">No product consumption data available.</div>
                      ) : (
                        dynamicProductBreakdown.map((item: any, idx: number) => (
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

                  {/* General Order Trend */}
                  <Card className="lg:col-span-2 border border-brand-sage/40 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-3.5 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xs font-bold text-brand-forest font-heading">General Order Trend</CardTitle>
                        <CardDescription className="text-[10px]">Chronological trend of total order volume in trays</CardDescription>
                      </div>
                      
                      {/* Branch/Consolidated Filter for HQ Corporate */}
                      {customer.isParent && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">View:</span>
                          <select 
                            value={generalTrendFilter} 
                            onChange={(e) => setGeneralTrendFilter(e.target.value)}
                            className="text-[10px] font-extrabold text-brand-forest border border-brand-sage/60 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-7"
                          >
                            <option value="consolidated">Consolidated Total</option>
                            <option value="all_branches">All Branches (Lines)</option>
                            {branchesInHistory.map((branchName: string) => (
                              <option key={branchName} value={branchName}>{branchName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-6 flex-1">
                      {isConsumptionLoading ? (
                        <div className="text-center py-20 text-xs text-gray-400 font-bold">Loading trend...</div>
                      ) : !generalTrendData || generalTrendData.length === 0 ? (
                        <div className="text-center py-20 text-xs text-gray-400 font-body">No trend history available.</div>
                      ) : (
                        <div className="h-[220px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={generalTrendData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#6B7280' }} 
                                tickFormatter={(val) => `${val} Trays`}
                              />
                              <Tooltip content={<CustomGeneralTooltip />} />
                              {generalTrendFilter === "all_branches" ? (
                                branchesInHistory.map((bName: string, idx: number) => {
                                  const colors = ["#1A5C2A", "#F5A800", "#2563EB", "#8B5CF6", "#E11D48", "#10B981"];
                                  const color = colors[idx % colors.length];
                                  return (
                                    <Line 
                                      key={bName}
                                      type="monotone" 
                                      dataKey={bName} 
                                      stroke={color} 
                                      strokeWidth={3} 
                                      dot={{ r: 4, fill: color, strokeWidth: 2 }}
                                      activeDot={{ r: 6 }}
                                      name={bName} 
                                    />
                                  );
                                })
                              ) : (
                                <Line 
                                  type="monotone" 
                                  dataKey={generalTrendFilter} 
                                  stroke="#1A5C2A" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, fill: "#1A5C2A", strokeWidth: 2 }}
                                  activeDot={{ r: 6 }}
                                  name={generalTrendFilter === "consolidated" ? "Consolidated Trays" : generalTrendFilter} 
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Product-wise & Monthly Order Trends Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Monthly Order Volume Trends Card */}
                  <Card className="border border-brand-sage/40 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-3.5 px-5">
                      <CardTitle className="text-xs font-bold text-brand-forest font-heading">Monthly Order Volume Trends</CardTitle>
                      <CardDescription className="text-[10px]">Chronological trend of quantities and orders taken</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 flex-1 overflow-y-auto max-h-[250px]">
                      {isConsumptionLoading ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-bold">Loading monthly trends...</div>
                      ) : !dynamicMonthlyTrends || dynamicMonthlyTrends.length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-body">No monthly trends available.</div>
                      ) : (
                        <div className="space-y-4">
                          {dynamicMonthlyTrends.map((trend: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                              <div>
                                <p className="text-xs font-extrabold text-gray-900">{trend.month}</p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{trend.order_count} {trend.order_count === 1 ? 'Order' : 'Orders'} placed</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-brand-forest">
                                  {trend.total_qty.toLocaleString()} <span className="font-normal text-gray-500">units</span>
                                </p>
                                <p className="text-[10px] font-bold text-gray-650 font-mono mt-0.5">
                                  UGX {trend.total_value.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Product-wise Demand Trends Card */}
                  <Card className="lg:col-span-2 border border-brand-sage/40 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-3.5 px-6">
                      <CardTitle className="text-xs font-bold text-brand-forest font-heading">Product-wise Demand Trends</CardTitle>
                      <CardDescription className="text-[10px]">Chronological trend of quantities ordered for each product type</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex-1">
                      {isConsumptionLoading ? (
                        <div className="text-center py-20 text-xs text-gray-400 font-bold">Loading trends...</div>
                      ) : !productTrendData || productTrendData.length === 0 ? (
                        <div className="text-center py-20 text-xs text-gray-400 font-body">No trend history available.</div>
                      ) : (
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={productTrendData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                              {productNames.map((name: any, idx: number) => {
                                const colors = ["#1A5C2A", "#F5A800", "#2563EB", "#8B5CF6", "#E11D48", "#10B981"];
                                const color = colors[idx % colors.length];
                                return (
                                  <Line 
                                    key={name}
                                    type="monotone" 
                                    dataKey={name} 
                                    stroke={color} 
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5 }}
                                    activeDot={{ r: 5.5 }}
                                    name={name} 
                                  />
                                );
                              })}
                            </LineChart>
                          </ResponsiveContainer>
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
                          ) : !filteredOrderHistory || filteredOrderHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={customer.isParent ? 7 : 6} className="text-center py-12 text-gray-500 font-body text-xs">
                                No historical orders found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredOrderHistory.map((ord: any) => (
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
                                      const avgFreq = avgFrequency;
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
          {activeTab !== "consumption" && (
            <div className="space-y-6">
            
            {/* Corporate Logo Card Upload */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Corporate Identity Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
                <label htmlFor="logo-upload-input" className="relative group cursor-pointer block">
                  {customer.logo_url ? (
                    <img 
                      src={customer.logo_url} 
                      alt={customer.name} 
                      className="h-20 w-20 rounded-2xl object-cover shadow-md select-none border border-black/10 shrink-0 bg-white"
                    />
                  ) : (
                    <div className={`h-20 w-20 rounded-2xl font-heading font-black text-xl flex items-center justify-center shadow-md select-none border border-black/10 bg-brand-sage/10 text-brand-forest shrink-0 ${
                      customer.name.toLowerCase().includes("shoprite") ? "bg-red-600 text-white" :
                      customer.name.toLowerCase().includes("mega") ? "bg-brand-forest text-brand-yellow border border-brand-yellow/30" :
                      "bg-brand-sage/20 text-brand-forest"
                    }`}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-extrabold uppercase">
                    Upload
                  </div>
                  <input 
                    type="file" 
                    id="logo-upload-input" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-800">{customer.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Brand Identity Logo</p>
                </div>

                {logoUploading ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-brand-forest">
                      <span>Uploading Logo...</span>
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
          )}

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
              {/* Actual Uploaded Document Image if available */}
              {selectedProofTx.proofDoc && !selectedProofTx.proofDoc.startsWith("/proof_") ? (
                <div className="border border-brand-sage/60 rounded-2xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center max-w-sm mx-auto shadow-md p-4 space-y-3">
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Driver Uploaded Delivery Proof</p>
                  <img 
                    src={selectedProofTx.proofDoc} 
                    alt="Delivery Proof Document" 
                    className="max-h-[300px] w-auto object-contain rounded-xl select-none"
                  />
                  {selectedProofTx.deliveredBy && selectedProofTx.deliveredBy !== "-" && (
                    <p className="text-[10px] text-gray-500 font-bold">
                      Delivered By: <strong className="text-brand-forest">{selectedProofTx.deliveredBy}</strong>
                    </p>
                  )}
                </div>
              ) : (
                /* Paper Receipt Mockup Graphic */
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
              )}

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

      {/* VERIFY SIGNATURE MODAL */}
      {selectedSignatureTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center justify-between border-b border-brand-sage/20">
              <div className="flex items-center gap-2">
                <PenTool size={20} className="text-brand-yellow" />
                <div>
                  <h3 className="font-heading font-bold text-base">Recipient Signature Verification</h3>
                  <p className="text-[10px] text-white/70">Secure, read-only system audit signature verification</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSignatureTx(null)}
                className="text-white/60 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 h-6 px-2 rounded-lg transition-colors border-none cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedSignatureTx.signatureUrl ? (
                <div className="border border-brand-sage/60 rounded-2xl p-4 bg-gray-50 flex flex-col items-center justify-center max-w-sm mx-auto shadow-md w-full">
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">Customer Signature File</p>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-inner w-full flex items-center justify-center h-40">
                    <img 
                      src={selectedSignatureTx.signatureUrl} 
                      alt="Customer Signature" 
                      className="max-h-[140px] w-auto object-contain select-none"
                    />
                  </div>
                  {selectedSignatureTx.deliveredBy && selectedSignatureTx.deliveredBy !== "-" && (
                    <p className="text-[10px] text-gray-500 font-bold mt-2">
                      Delivered By: <strong className="text-brand-forest">{selectedSignatureTx.deliveredBy}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500 font-medium">No digital signature recorded for this transaction.</p>
              )}

              <div className="flex justify-end gap-2.5">
                <Button 
                  onClick={() => setSelectedSignatureTx(null)}
                  className="bg-brand-forest text-white hover:bg-brand-forest/90 font-bold border-none text-xs rounded-xl h-10 px-6 w-full cursor-pointer"
                >
                  Close Verification
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Individual Customer Ledger Statement Report Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`${customer.name} Financial Account Audit Statement`}
        reportType="customer_ledger"
        storeName={customer.name}
        storeLocation={`${customer.zone || 'Kampala'} Outlet Network`}
        kpiCards={[
          {
            label: "Current Outstanding Balance",
            value: `UGX ${currentDues.toLocaleString()}`,
            subtitle: "Current account dues demanded",
            color: "red"
          },
          {
            label: "Total Invoiced Orders",
            value: `UGX ${ledger.reduce((s, tx) => s + tx.debit, 0).toLocaleString()}`,
            subtitle: "Gross lifetime invoiced sales",
            color: "blue"
          },
          {
            label: "Total Payments Remitted",
            value: `UGX ${ledger.reduce((s, tx) => s + tx.credit, 0).toLocaleString()}`,
            subtitle: "Total payments cleared",
            color: "green"
          }
        ]}
        tableHeaders={[
          "Date",
          "Ref / Order No",
          "Branch / Outlet",
          "Transaction Type",
          "Debit (Invoiced)",
          "Credit (Paid)",
          "Running Balance",
          "Status"
        ]}
        tableRows={reportTableRows}
      />
    </DashboardLayout>
  );
}
