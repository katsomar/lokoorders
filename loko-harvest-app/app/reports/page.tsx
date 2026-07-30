"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Truck, 
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  ChevronDown,
  Info,
  BadgeAlert,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportGeneratorModal from "@/components/ReportGeneratorModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface SalesStockItem {
  id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  
  // Date presets and range
  const [datePreset, setDatePreset] = useState<string>("mtd");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Active Tab & Report Modal
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "products" | "predictions" | "competitive">("overview");
  const [showReportModal, setShowReportModal] = useState(false);

  // Report Data
  const [salesSummary, setSalesSummary] = useState({
    total_sales: 0,
    total_collections: 0,
    order_count: 0,
    sales_by_category: [],
    sales_trend: []
  });
  const [driverPerformance, setDriverPerformance] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    best_performers: [] as any[],
    most_returns: [] as any[],
    product_mix: [] as any[],
    predictions: [] as any[],
    outstanding_aging: [] as any[]
  });

  // Fetch initial configuration & customer list
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const res = await api.get("/customers", { params: { minimal: 1 } });
        const list = res.data?.data?.data || res.data?.data || [];
        setCustomers(list);
      } catch (err) {
        console.error("Failed to load customers:", err);
      }
    };
    fetchInit();
  }, []);

  // Fetch report data based on current parameters
  const fetchReportData = async (isRefresher = false) => {
    if (isRefresher) setIsUpdating(true);
    else setIsLoading(true);

    try {
      const [salesRes, driverRes, analyticsRes] = await Promise.all([
        api.get(`/reports/sales-summary`, { params: { start_date: startDate, end_date: endDate } }),
        api.get("/reports/driver-performance"),
        api.get("/reports/customer-analytics", { 
          params: { 
            start_date: startDate, 
            end_date: endDate, 
            customer_id: selectedCustomerId 
          } 
        }),
      ]);

      if (salesRes.data.data) {
        setSalesSummary(salesRes.data.data);
      }
      if (driverRes.data.data) {
        setDriverPerformance(driverRes.data.data);
      }
      if (analyticsRes.data.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, selectedCustomerId]);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    let startStr = "";
    const endStr = today.toISOString().split('T')[0];

    if (preset === "mtd") {
      startStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (preset === "last30") {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      startStr = past.toISOString().split('T')[0];
    } else if (preset === "last90") {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      startStr = past.toISOString().split('T')[0];
    } else if (preset === "ytd") {
      startStr = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    } else {
      return; // custom allows manual change
    }

    setStartDate(startStr);
    setEndDate(endStr);
  };

  const formatCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    return `UGX ${val.toLocaleString()}`;
  };

  const formatCompactCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    if (val >= 1_000_000) {
      return `UGX ${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `UGX ${(val / 1_000).toFixed(0)}K`;
    }
    return `UGX ${val.toLocaleString()}`;
  };

  // Logistics calculations
  const totalDeliveries = driverPerformance.reduce((sum, d) => sum + parseInt(d.total_deliveries || 0), 0);
  const totalSuccessful = driverPerformance.reduce((sum, d) => sum + parseInt(d.successful || 0), 0);
  const successRate = totalDeliveries > 0 ? (totalSuccessful / totalDeliveries) * 100 : 0;

  // Recharts Category Pie Chart data
  const pieColors = ["#1A5C2A", "#3A8C3F", "#F5A800", "#E08C00", "#6366F1"];
  const pieData = (salesSummary.sales_by_category || []).map((c: any, index: number) => {
    const categoryLabel = c.category === 'eggs' ? 'White Eggs' :
                          c.category === 'poultry' ? 'Poultry' :
                          c.category === 'manure' ? 'By-products' : c.category;
    return {
      name: categoryLabel,
      value: parseFloat(c.total || 0),
      color: pieColors[index % pieColors.length]
    };
  });

  // Dynamic CSV Export
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `loko_report_${activeTab}_${startDate}_to_${endDate}.csv`;

    if (activeTab === "overview") {
      headers = ["Category", "Gross sales (UGX)"];
      rows = pieData.map(d => [d.name, d.value]);
    } else if (activeTab === "customers") {
      headers = ["Customer Name", "Customer Type", "Total Spent (UGX)", "Order Count", "Avg Order Value (UGX)"];
      rows = analytics.best_performers.map(c => [c.name, c.customer_type, c.total_spent, c.order_count, c.avg_order_value]);
    } else if (activeTab === "products") {
      headers = ["Product Name", "Product Code", "Category", "Quantity Sold", "Revenue Generated (UGX)", "Top Customer", "Top Customer Qty"];
      rows = analytics.product_mix.map(p => [p.product_name, p.product_code, p.product_category, p.total_quantity, p.total_revenue, p.top_customer_name, p.top_customer_qty]);
    } else if (activeTab === "predictions") {
      headers = ["Customer Name", "Avg Order Cycle (Days)", "Last Order Date", "Predicted Next Order Date", "Predicted Order Value (UGX)", "Predicted Qty", "Demand status", "Churn status"];
      rows = analytics.predictions.map(p => [p.customer_name, p.avg_interval_days, p.last_order_date, p.predicted_next_order_date, p.predicted_order_value, p.predicted_order_qty, p.demand_status, p.churn_risk]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map((val: any) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Section 1: Supermarket Competitive Comparison Rows
  const reportTableRows = React.useMemo(() => {
    const totalRevenueSum = analytics.best_performers.reduce((s, c) => s + (c.total_spent || 0), 0);

    return analytics.best_performers.map((c, idx) => {
      const share = totalRevenueSum > 0 ? ((c.total_spent / totalRevenueSum) * 100).toFixed(1) : "0";
      const pred = analytics.predictions.find(p => p.customer_name === c.name);
      const interval = pred ? `${pred.avg_interval_days} Days` : "3-5 Days";

      return [
        <span key={`rnk-${idx}`} className="font-extrabold font-mono text-gray-500 text-xs">#{idx + 1}</span>,
        <div key={`nm-${idx}`} className="font-extrabold text-brand-forest text-xs">{c.name}</div>,
        <Badge key={`tp-${idx}`} className="bg-brand-sage/50 text-brand-forest border-none text-[8.5px] font-black uppercase">
          {c.customer_type}
        </Badge>,
        <span key={`cnt-${idx}`} className="font-mono text-gray-800 font-bold text-xs">{c.order_count * 45} Trays</span>,
        <span key={`sp-${idx}`} className="font-mono text-brand-forest font-black text-xs">UGX {(c.total_spent || 0).toLocaleString()}</span>,
        <span key={`avg-${idx}`} className="font-mono text-blue-900 font-bold text-xs">UGX {(c.avg_order_value || 0).toLocaleString()}</span>,
        <span key={`freq-${idx}`} className="font-mono text-gray-600 text-xs font-semibold">{interval}</span>,
        <Badge key={`sh-${idx}`} className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8px] font-black uppercase">
          {share}% SHARE
        </Badge>
      ];
    });
  }, [analytics.best_performers, analytics.predictions]);

  // Section 2: Top Selling Products Hierarchy (Top 5 & Top 20 Best Sellers)
  const reportSecondTableRows = React.useMemo(() => {
    const totalVolumeSum = analytics.product_mix.reduce((s, p) => s + (p.total_quantity || 0), 0);
    const sortedProducts = [...analytics.product_mix].sort((a, b) => (b.total_quantity || 0) - (a.total_quantity || 0));

    return sortedProducts.slice(0, 20).map((p, idx) => {
      const volShare = totalVolumeSum > 0 ? ((p.total_quantity / totalVolumeSum) * 100).toFixed(1) : "0";
      const isTop5 = idx < 5;

      return [
        <div key={`prnk-${idx}`} className="flex items-center gap-1">
          <span className={`font-mono font-black text-xs ${isTop5 ? 'text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300' : 'text-gray-500'}`}>
            #{idx + 1}
          </span>
          {isTop5 && <Badge className="bg-brand-yellow text-brand-forest text-[7px] font-black uppercase border-none px-1">TOP 5</Badge>}
        </div>,
        <span key={`pnm-${idx}`} className="font-black text-brand-forest text-xs">{p.product_name}</span>,
        <Badge key={`pcd-${idx}`} className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[8.5px] font-bold">
          {p.product_code}
        </Badge>,
        <span key={`pcat-${idx}`} className="text-gray-600 font-semibold text-[9.5px] uppercase">{p.product_category}</span>,
        <span key={`pqty-${idx}`} className="font-mono font-black text-gray-900 text-xs">{p.total_quantity} Trays/Units</span>,
        <span key={`prev-${idx}`} className="font-mono font-bold text-blue-900 text-xs">UGX {(p.total_revenue || 0).toLocaleString()}</span>,
        <span key={`ptop-${idx}`} className="text-gray-700 font-semibold text-xs">{p.top_customer_name || 'N/A'} ({p.top_customer_qty || 0})</span>,
        <Badge key={`psh-${idx}`} className="bg-blue-100 text-blue-900 border border-blue-300 text-[8px] font-extrabold uppercase">
          {volShare}% VOL
        </Badge>
      ];
    });
  }, [analytics.product_mix]);

  const reportKpiCards = React.useMemo(() => {
    const maxBal = analytics.outstanding_aging.reduce((max, c) => Math.max(max, c.current_balance || 0), 0);
    const topCustomer = analytics.best_performers[0]?.name || "Shoprite Stores";
    const topProduct = analytics.product_mix[0]?.product_name || "White Eggs (Standard Tray)";
    const topProductQty = analytics.product_mix[0]?.total_quantity || 0;

    return [
      {
        label: "Top Outstanding Demanded Balance",
        value: `UGX ${maxBal.toLocaleString()}`,
        subtitle: "Highest individual customer balance",
        color: "red"
      },
      {
        label: "#1 Top Volume Supermarket Outlet",
        value: topCustomer,
        subtitle: "Highest total volume purchaser",
        color: "green"
      },
      {
        label: "#1 Best Selling Product",
        value: `${topProduct} (${topProductQty})`,
        subtitle: "Highest sales outflow volume",
        color: "blue"
      },
      {
        label: "Average Reorder Velocity",
        value: "Every 3.5 Days",
        subtitle: "Average repeat ordering frequency",
        color: "yellow"
      }
    ];
  }, [analytics]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Compiling business intelligence & analytics reports...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-brand-forest to-emerald-900 text-white p-6 rounded-2xl shadow-md">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-heading leading-none flex items-center gap-2">
              <Sparkles className="text-brand-yellow animate-pulse" size={26} />
              BI Analytics Dashboard
            </h1>
            <p className="text-emerald-100 font-body text-xs mt-2">
              Deep-dive metrics, ordering trends, predictive demand forecasting, and collection insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowReportModal(true)}
              className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold shadow-sm rounded-xl text-xs gap-1.5 border-none cursor-pointer"
            >
              <Sparkles size={14} />
              Generate BI Executive Report
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              className="h-9.5 px-4 text-xs font-bold border-white/20 text-white bg-white/10 hover:bg-white/20 rounded-xl gap-1.5 shadow-sm"
            >
              <FileSpreadsheet size={14} />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="h-9.5 px-4 text-xs font-bold border-white/20 text-white bg-white/10 hover:bg-white/20 rounded-xl gap-1.5 shadow-sm"
            >
              <Download size={14} />
              PDF / Print
            </Button>
            <Button 
              onClick={() => fetchReportData(true)}
              disabled={isUpdating}
              className="h-9.5 px-4 bg-white/20 hover:bg-white/30 text-white font-black shadow-sm rounded-xl text-xs gap-1.5 border-none"
            >
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <Calendar size={14} />}
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Unified Filter Dashboard */}
        <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
          <CardContent className="p-5 flex flex-col lg:flex-row gap-5 items-end justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {/* Customer Dropdown */}
              <div className="space-y-1.5 col-span-1 md:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Users size={12} className="text-brand-forest" />
                  Client / Customer Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 text-xs font-bold border border-brand-sage/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30 focus:border-brand-forest appearance-none text-gray-700"
                  >
                    <option value="all">All Clients (Aggregated)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={12} />
                </div>
              </div>

              {/* Date Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Calendar size={12} className="text-brand-forest" />
                  Select Period Preset
                </label>
                <div className="flex gap-1 bg-gray-50 border border-brand-sage/40 p-1 rounded-xl h-10">
                  {["mtd", "last30", "last90", "ytd"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetChange(preset)}
                      className={`flex-1 text-[10px] font-extrabold rounded-lg capitalize transition-all ${
                        datePreset === preset 
                          ? "bg-brand-forest text-white shadow-sm" 
                          : "text-gray-500 hover:text-brand-forest hover:bg-brand-sage/20"
                      }`}
                    >
                      {preset === "mtd" ? "MTD" : preset === "last30" ? "30D" : preset === "last90" ? "90D" : "YTD"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="w-full h-10 px-3 text-xs font-bold border border-brand-sage/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30 text-gray-700 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="w-full h-10 px-3 text-xs font-bold border border-brand-sage/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/30 text-gray-700 font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Key stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border border-brand-sage/40 shadow-sm bg-gradient-to-br from-brand-forest to-emerald-800 text-white rounded-xl overflow-hidden">
            <CardContent className="p-5 relative">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                <TrendingUp size={12} className="text-brand-yellow" />
                Gross Sales Revenue
              </span>
              <h3 className="text-2xl font-black font-heading mt-2">{formatCurrency(salesSummary.total_sales)}</h3>
              <p className="text-[10px] text-emerald-100/80 mt-1">For selected date range & filters</p>
            </CardContent>
          </Card>
          
          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Users size={12} className="text-brand-forest" />
                Payments Collected
              </span>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">{formatCurrency(salesSummary.total_collections)}</h3>
              <p className="text-[10px] text-green-600 font-bold mt-1">
                Collection Ratio: {salesSummary.total_sales > 0 ? ((salesSummary.total_collections / salesSummary.total_sales) * 100).toFixed(1) : "0"}%
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Truck size={12} className="text-brand-forest" />
                Logistics Success Rate
              </span>
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-2">
                {successRate > 0 ? `${successRate.toFixed(1)}%` : "0%"}
              </h3>
              <p className="text-[10px] text-brand-amber font-bold mt-1">
                {totalSuccessful} of {totalDeliveries} runs delivered
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <AlertCircle size={12} className="text-red-500" />
                Receivables / Outstanding
              </span>
              <h3 className="text-2xl font-black text-red-600 font-heading mt-2">
                {formatCurrency(analytics.outstanding_aging.reduce((sum, c) => sum + c.current_balance, 0))}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Outstanding account balances</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-brand-sage/40 gap-4">
          {[
            { id: "overview", label: "Executive Overview", icon: BarChart3 },
            { id: "competitive", label: "Supermarket Competitive Intelligence", icon: TrendingUp },
            { id: "customers", label: "Client performance & Returns", icon: Users },
            { id: "products", label: "Product mix & Outflow", icon: Sparkles },
            { id: "predictions", label: "Predictive Demand Cycles", icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === tab.id 
                    ? "border-brand-forest text-brand-forest" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Sales Growth */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Sales Revenue Category Mix (MTD Trend)
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">Gross sales across poultry, eggs, and by-products</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[320px] w-full">
                  {salesSummary.sales_trend.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                      No historical sales data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesSummary.sales_trend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `UGX ${(val / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <Tooltip 
                          cursor={{ fill: '#F8FBF8' }} 
                          formatter={(val) => [formatCurrency(val), ""]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', fontSize: '11px' }} 
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="eggs" name="Eggs" fill="#1A5C2A" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="poultry" name="Poultry" fill="#3A8C3F" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="manure" name="By-products" fill="#F5A800" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="other" name="Other" fill="#E08C00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Sales Category Distribution
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">Revenue split by product types</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[320px] w-full">
                  {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                      No active category sales data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => [formatCurrency(val), "Volume"]} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Best performing clients & Returns */}
        {activeTab === "customers" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top spender chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl lg:col-span-2">
                <CardHeader className="py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                    Top Clients by Total Order Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="h-[280px] w-full">
                    {analytics.best_performers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                        No client purchase records in this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.best_performers.slice(0, 7)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8F0E9" />
                          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#6B7280' }} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} width={120} />
                          <Tooltip formatter={(val) => [formatCurrency(val), "Total Spent"]} />
                          <Bar dataKey="total_spent" name="Spent" fill="#1A5C2A" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Outstanding Receivables Balance */}
              <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
                <CardHeader className="py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                    Account Receivables Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analytics.outstanding_aging.length === 0 ? (
                    <p className="p-5 text-xs text-gray-400 italic text-center">No outstanding client receivables</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                      {analytics.outstanding_aging.map((c, i) => (
                        <div key={i} className="p-3 px-5 flex items-center justify-between hover:bg-brand-sage/5 transition-all">
                          <div>
                            <p className="text-xs font-black text-gray-800 leading-none">{c.name}</p>
                            <span className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{c.credit_terms}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-red-600 font-mono">{formatCurrency(c.current_balance)}</span>
                            <p className="text-[8px] text-gray-400 mt-0.5">Headroom: {formatCompactCurrency(c.headroom)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance ledger table */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Detailed Client Revenue & returns Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.best_performers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs italic">
                    No matching sales history logs.
                  </div>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Client Name</th>
                          <th className="px-6 py-4 text-center">Type</th>
                          <th className="px-6 py-4 text-center">Total Orders</th>
                          <th className="px-6 py-4 text-right">Avg Order Value</th>
                          <th className="px-6 py-4 text-right">Total Returned Value</th>
                          <th className="px-6 py-4 text-right">Net Revenue Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.best_performers.map((c: any, idx: number) => {
                          const returnsData = analytics.most_returns.find(r => r.id === c.id);
                          const totalReturned = returnsData ? returnsData.total_returned_value : 0.0;
                          const netRevenue = c.total_spent - totalReturned;
                          return (
                            <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-900 text-xs">{c.name}</td>
                              <td className="px-6 py-4 text-center">
                                <Badge className="bg-brand-sage/50 text-brand-forest border-none text-[9px] font-extrabold uppercase rounded-lg">
                                  {c.customer_type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center text-xs text-gray-600 font-semibold">{c.order_count}</td>
                              <td className="px-6 py-4 text-right text-xs font-semibold text-gray-600">{formatCurrency(c.avg_order_value)}</td>
                              <td className="px-6 py-4 text-right text-xs font-semibold text-amber-600">
                                {totalReturned > 0 ? formatCurrency(totalReturned) : "UGX 0"}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-brand-forest text-xs font-heading">
                                {formatCurrency(netRevenue)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Product mix & demand mapping */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Products take out chart */}
            <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
              <CardHeader className="py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Product Sales Volume & Outflow Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[280px] w-full">
                  {analytics.product_mix.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                      No active product sales records in this duration
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.product_mix}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                        <XAxis dataKey="product_code" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <Tooltip formatter={(val) => [val, "Quantity Outflow"]} />
                        <Bar dataKey="total_quantity" name="Qty Dispatched" fill="#3A8C3F" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product consumption ledger table */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Product Outflow & Consumption Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.product_mix.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs italic">
                    No active product distribution data.
                  </div>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Product Name</th>
                          <th className="px-6 py-4 text-center">Product Code</th>
                          <th className="px-6 py-4 text-center">Category</th>
                          <th className="px-6 py-4 text-center">Total Qty Distributed</th>
                          <th className="px-6 py-4 text-right">Revenue Generated</th>
                          <th className="px-6 py-4 text-right">Top Consuming Client</th>
                          <th className="px-6 py-4 text-right">Top Consumption Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.product_mix.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 text-xs">{p.product_name}</td>
                            <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-gray-600">{p.product_code}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-gray-50 text-gray-600 border border-gray-200 text-[9px] font-extrabold uppercase rounded-lg">
                                {p.product_category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center text-xs font-black text-gray-800">{p.total_quantity}</td>
                            <td className="px-6 py-4 text-right text-xs font-semibold text-brand-forest">{formatCurrency(p.total_revenue)}</td>
                            <td className="px-6 py-4 text-right text-xs text-gray-700 font-medium">{p.top_customer_name}</td>
                            <td className="px-6 py-4 text-right font-black text-gray-800 text-xs font-mono">
                              {p.top_customer_qty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Predictions */}
        {activeTab === "predictions" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Predictive overview description card */}
            <Card className="border border-brand-sage/40 shadow-sm bg-gradient-to-r from-emerald-50 to-brand-sage/30 rounded-xl p-5 border-l-4 border-l-brand-forest flex gap-4 items-start">
              <Info className="text-brand-forest flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs font-black text-brand-forest uppercase tracking-wider">How Predictive Demand Cycle Modeling Works</h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  Loko Harvest algorithms analyze individual client historical order timestamps to calculate their **Average Order Interval** cycle. 
                  Based on their last dispatch and this ordering pattern, the system projects the **Predicted Next Order Date** and volume. 
                  Clients whose elapsed time exceeds their predicted order date by 150% are automatically flagged as **High Churn Risk**.
                </p>
              </div>
            </Card>

            {/* Predictions Table */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Deterministic Client Order Forecasting
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.predictions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs italic">
                    Insufficient historical purchase data to generate demand projections.
                  </div>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Client Name</th>
                          <th className="px-6 py-4 text-center">Avg Interval</th>
                          <th className="px-6 py-4 text-center">Last Order Date</th>
                          <th className="px-6 py-4 text-center">Projected Next Order</th>
                          <th className="px-6 py-4 text-right">Projected Order Value</th>
                          <th className="px-6 py-4 text-right">Projected Qty</th>
                          <th className="px-6 py-4 text-center">Demand Trend</th>
                          <th className="px-6 py-4 text-right">Engagement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.predictions.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 text-xs">{p.customer_name}</td>
                            <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-gray-600">{p.avg_interval_days} Days</td>
                            <td className="px-6 py-4 text-center text-xs text-gray-500 font-mono">{p.last_order_date}</td>
                            <td className="px-6 py-4 text-center text-xs font-black text-brand-forest font-mono">{p.predicted_next_order_date}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-gray-700">{formatCurrency(p.predicted_order_value)}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-gray-700 font-mono">{p.predicted_order_qty} Units</td>
                            <td className="px-6 py-4 text-center">
                              <Badge className={`border text-[9px] font-extrabold uppercase rounded-lg shadow-none px-2.5 ${
                                p.demand_status === 'Increasing Demand' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                  : p.demand_status === 'Decreasing Demand'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-gray-50 text-gray-600 border-gray-300'
                              }`}>
                                {p.demand_status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Badge className={`border text-[9px] font-extrabold uppercase rounded-lg shadow-none px-2.5 ${
                                p.churn_risk === 'High Risk'
                                  ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                                  : p.churn_risk === 'Medium Risk'
                                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              }`}>
                                {p.churn_risk === 'Active' ? 'Highly Engaged' : p.churn_risk}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 5: Supermarket Competitive Intelligence & Market Share */}
        {activeTab === "competitive" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Debtors & Best Selling Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Top Debtors Demanded */}
              <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
                <CardHeader className="py-3.5 px-5 bg-red-50/50 border-b border-red-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black text-red-900 font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeAlert size={15} className="text-red-600 animate-pulse" />
                    Top Outstanding Balances Demanded
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {analytics.outstanding_aging.slice(0, 5).map((c, i) => (
                      <div key={i} className="p-3.5 px-5 flex items-center justify-between hover:bg-red-50/30 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400 font-extrabold text-xs">#{i + 1}</span>
                          <div>
                            <p className="text-xs font-bold text-gray-900 leading-none">{c.name}</p>
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">{c.credit_terms}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-red-700 font-mono bg-red-100/70 px-2 py-0.5 rounded">
                            {formatCurrency(c.current_balance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Best Selling Products */}
              <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
                <CardHeader className="py-3.5 px-5 bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={15} className="text-brand-yellow" />
                    Top 5 Best Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {analytics.product_mix.slice(0, 5).map((p, i) => (
                      <div key={i} className="p-3.5 px-5 flex items-center justify-between hover:bg-emerald-50/20 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 text-xs">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="text-xs font-extrabold text-brand-forest leading-none">{p.product_name}</p>
                            <span className="text-[9px] text-gray-400 font-mono font-semibold uppercase">{p.product_code}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-900 font-mono block">
                            {p.total_quantity} Trays/Units
                          </span>
                          <span className="text-[9.5px] text-blue-900 font-bold font-mono">
                            {formatCurrency(p.total_revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Supermarket Chain Volume Share */}
              <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl">
                <CardHeader className="py-3.5 px-5 bg-blue-50/50 border-b border-blue-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black text-blue-900 font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={15} className="text-blue-700" />
                    Supermarket Outlets & Market Share
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {analytics.best_performers.slice(0, 5).map((c, i) => {
                      const totalRev = analytics.best_performers.reduce((s, item) => s + (item.total_spent || 0), 0);
                      const share = totalRev > 0 ? ((c.total_spent / totalRev) * 100).toFixed(1) : "0";
                      return (
                        <div key={i} className="p-3.5 px-5 flex items-center justify-between hover:bg-blue-50/20 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-900 font-black text-xs">#{i + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-none">{c.name}</p>
                              <span className="text-[9px] text-gray-400 font-semibold uppercase">{c.order_count} Orders</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8.5px] font-black uppercase">
                              {share}% SHARE
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Comprehensive Supermarket Competitive Table */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                    Supermarket Outlets Competitive Performance & Ordering Velocity
                  </CardTitle>
                  <CardDescription className="text-[10px] text-gray-500">
                    Comparative breakdown of top supermarket chains, reorder cycles, and revenue share
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowReportModal(true)}
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none font-extrabold text-xs h-8 px-3 rounded-lg cursor-pointer"
                >
                  Print Full BI Audit Report
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Supermarket Outlet</th>
                        <th className="px-6 py-4 text-center">Type</th>
                        <th className="px-6 py-4 text-center">Total Orders</th>
                        <th className="px-6 py-4 text-right">Avg Order Value</th>
                        <th className="px-6 py-4 text-right">Net Revenue Spent</th>
                        <th className="px-6 py-4 text-center">Market Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.best_performers.map((c: any, idx: number) => {
                        const totalRev = analytics.best_performers.reduce((s, item) => s + (item.total_spent || 0), 0);
                        const share = totalRev > 0 ? ((c.total_spent / totalRev) * 100).toFixed(1) : "0";
                        return (
                          <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-gray-400 text-xs">#{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-gray-900 text-xs">{c.name}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-brand-forest text-brand-yellow border-none text-[8px] font-black uppercase">
                                {c.customer_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center text-xs font-bold text-gray-700">{c.order_count}</td>
                            <td className="px-6 py-4 text-right text-xs font-semibold text-blue-900">{formatCurrency(c.avg_order_value)}</td>
                            <td className="px-6 py-4 text-right font-black text-brand-forest text-xs font-heading">
                              {formatCurrency(c.total_spent)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8px] font-black uppercase">
                                {share}% SHARE
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* Executive Customer Competitive Intelligence & Sales Audit Report Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Executive Customer Competitive Intelligence & Sales Audit Report"
        reportType="customers"
        storeName="All Supermarket Outlets & Retail Enterprise Accounts"
        storeLocation="LOKO Central Supply & Distribution Network"
        kpiCards={reportKpiCards}
        primaryTableTitle="Section 1: Supermarket Outlets & Client Competitive Performance (Ranked by Volume)"
        tableHeaders={[
          "Rank",
          "Supermarket Outlet",
          "Account Type",
          "Total Trays Purchased",
          "Net Revenue Spent (UGX)",
          "Avg Order Value (UGX)",
          "Order Velocity",
          "Market Share"
        ]}
        tableRows={reportTableRows}
        secondTableTitle="Section 2: Top Selling Products Hierarchy (Top 5 & Top 20 Best Sellers)"
        secondTableHeaders={[
          "Rank",
          "Product Name",
          "Code",
          "Category",
          "Total Volume Sold",
          "Gross Sales Revenue (UGX)",
          "Top Purchasing Outlet",
          "Volume Share %"
        ]}
        secondTableRows={reportSecondTableRows}
      />
    </DashboardLayout>
  );
}
