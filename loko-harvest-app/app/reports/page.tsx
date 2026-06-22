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
  Legend
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
  ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState({
    total_sales: 0,
    total_collections: 0,
    order_count: 0,
    sales_by_category: [],
    sales_trend: []
  });
  const [driverPerformance, setDriverPerformance] = useState<any[]>([]);
  const [agingReport, setAgingReport] = useState<any[]>([]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, driverRes, agingRes] = await Promise.all([
        api.get("/reports/sales-summary"),
        api.get("/reports/driver-performance"),
        api.get("/reports/aging"),
      ]);

      if (salesRes.data.data) {
        setSalesSummary(salesRes.data.data);
      }
      if (driverRes.data.data) {
        setDriverPerformance(driverRes.data.data);
      }
      if (agingRes.data.data) {
        setAgingReport(agingRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const formatCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    return `UGX ${val.toLocaleString()}`;
  };

  const formatCompactCurrency = (amount: any) => {
    const val = parseFloat(amount || 0);
    if (val >= 1_000_000) {
      return `UGX ${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `UGX ${(val / 1_000).toFixed(0)}K`;
    }
    return `UGX ${val.toLocaleString()}`;
  };

  // Compute logistics metrics
  const totalDeliveries = driverPerformance.reduce((sum, d) => sum + parseInt(d.total_deliveries || 0), 0);
  const totalSuccessful = driverPerformance.reduce((sum, d) => sum + parseInt(d.successful || 0), 0);
  const successRate = totalDeliveries > 0 ? (totalSuccessful / totalDeliveries) * 100 : 0;

  // Format category distribution pie chart data
  const pieColors = {
    eggs: "#1A5C2A",
    poultry: "#3A8C3F",
    manure: "#F5A800",
    other: "#E08C00"
  };
  const pieData = (salesSummary.sales_by_category || []).map((c: any) => {
    const categoryName = c.category === 'eggs' ? 'White Eggs' :
                         c.category === 'poultry' ? 'Poultry' :
                         c.category === 'manure' ? 'By-products' : c.category;
    return {
      name: categoryName,
      value: parseFloat(c.total || 0),
      color: pieColors[c.category as keyof typeof pieColors] || "#9CA3AF"
    };
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Compiling analytics & reports data...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading leading-none flex items-center gap-2">
              <BarChart3 className="text-brand-forest" size={26} />
              Advanced Analytics
            </h1>
            <p className="text-gray-500 font-body text-xs mt-1.5">Performance insights and financial reconciliation</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm bg-white"
            >
              <Download size={14} />
              Export Report
            </Button>
            <Button 
              onClick={fetchReportData}
              className="h-9.5 px-4 bg-brand-forest hover:bg-brand-forest/90 text-white font-extrabold shadow-sm rounded-xl text-xs gap-1.5"
            >
              <Calendar size={14} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-brand-sage/40 shadow-sm bg-brand-forest text-white rounded-xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-brand-yellow" />
                MTD Gross Net Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <h3 className="text-2xl font-black font-heading leading-tight">{formatCompactCurrency(salesSummary.total_sales)}</h3>
              <p className="text-[10px] text-brand-yellow/85 font-medium mt-1">Sum of orders placed this month</p>
            </CardContent>
          </Card>
          
          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Users size={14} className="text-brand-forest" />
                Revenue Collections (MTD)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <h3 className="text-2xl font-black text-brand-forest font-heading leading-tight">{formatCompactCurrency(salesSummary.total_collections)}</h3>
              <p className="text-[10px] text-green-600 font-bold mt-1">Total payments logged in month</p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Truck size={14} className="text-brand-forest" />
                Logistics Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <h3 className="text-2xl font-black text-brand-forest font-heading leading-tight">{successRate > 0 ? `${successRate.toFixed(1)}%` : "0%"}</h3>
              <p className="text-[10px] text-brand-amber font-bold mt-1">
                {totalSuccessful} of {totalDeliveries} runs delivered
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Growth */}
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                Sales Category Revenue (5-Month Trend)
              </CardTitle>
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
                Sales Category Distribution (MTD)
              </CardTitle>
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

        {/* Driver Performance Table */}
        <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-brand-forest font-heading flex items-center gap-1.5">
              <Clock size={16} />
              Logistics Performance Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {driverPerformance.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs italic">
                No active driver logistics logs recorded.
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Driver Name</th>
                      <th className="px-6 py-4 text-center">Total Jobs</th>
                      <th className="px-6 py-4 text-center">Successful Runs</th>
                      <th className="px-6 py-4 text-center">Efficiency Score</th>
                      <th className="px-6 py-4 text-right">Avg Transit Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {driverPerformance.map((driver: any, idx: number) => {
                      const deliveries = parseInt(driver.total_deliveries || 0);
                      const successful = parseInt(driver.successful || 0);
                      const efficiency = deliveries > 0 ? Math.round((successful / deliveries) * 100) : 0;
                      const avgMinutes = Math.round(parseFloat(driver.avg_time_minutes || 0));
                      return (
                        <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 text-xs">{driver.name}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-600 font-semibold">{deliveries}</td>
                          <td className="px-6 py-4 text-center text-xs text-green-600 font-bold">{successful}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-brand-forest h-full" 
                                  style={{ width: `${efficiency}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-extrabold text-gray-700">{efficiency}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-gray-600 font-mono">
                            {avgMinutes > 0 ? `${avgMinutes} mins` : "N/A"}
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

        {/* Customer Receivables Aging Ledger */}
        <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
            <CardTitle className="text-sm font-bold text-brand-forest font-heading flex items-center gap-1.5">
              <Users size={16} />
              Customer Accounts Receivables Aging Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {agingReport.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs italic">
                No active outstanding customer credit balances.
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-brand-sage/30 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-center">Credit Terms</th>
                      <th className="px-6 py-4 text-right">Outstanding Balance (Receivables)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agingReport.map((cust: any, idx: number) => (
                      <tr key={idx} className="hover:bg-brand-sage/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 text-xs">{cust.name}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg">
                            {cust.credit_terms?.replace('_', ' ') || "N/A"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-red-600 text-xs font-heading">
                          {formatCurrency(cust.current_balance)}
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
    </DashboardLayout>
  );
}
