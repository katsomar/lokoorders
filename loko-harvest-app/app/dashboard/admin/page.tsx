"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  TrendingUp, 
  Warehouse,
  History,
  Users,
  User,
  Activity,
  Loader2,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    fulfillment: {
      active_orders: 0,
      today_new_orders: 0,
      active_drivers: 0,
      completed_today: 0,
      pending_dispatch: 0,
      returned_vouchers: 0,
      trend: { value: 0, isUp: true }
    },
    financials: {
      total_collections: 0,
      pending_credits: 0,
      top_claims: [],
      trend: { value: 0, isUp: true }
    },
    status_distribution: [],
    revenue_trend: [],
    warehouse: {
      total_value: 0,
      production_value: 0,
      sales_value: 0,
      reserve_value: 0
    },
    top_customers: [],
    activity_feed: []
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/dashboard/admin");
      if (res.data.data) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard statistics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-xs text-gray-500 font-bold">
          <Loader2 className="animate-spin text-brand-forest" size={36} />
          Assembling real-time admin metrics...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading">HQ Control Center</h1>
            <p className="text-gray-500 font-body text-xs mt-1">Real-time operational overview and performance statistics</p>
          </div>
          <Button 
            onClick={fetchDashboardData}
            variant="outline"
            className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm bg-white"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Refresh Control Panel
          </Button>
        </div>

        {/* ROW 1: Upgraded Operations Cards & Donut Chart (Grid of 3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Fulfillment Operations */}
          <KPICard 
            label="Fulfillment Operations" 
            value={dashboardData.fulfillment.active_orders} 
            subtitle="Active orders currently in pipeline"
            icon={ShoppingBag} 
            rightIcon={Truck}
            trend={dashboardData.fulfillment.trend}
            subMetrics={[
              { label: "Today's New Orders", value: dashboardData.fulfillment.today_new_orders.toString(), icon: ShoppingBag },
              { label: "Active Fleet Drivers", value: `${dashboardData.fulfillment.active_drivers} driver${dashboardData.fulfillment.active_drivers !== 1 ? 's' : ''}`, icon: Users }
            ]}
            breakdownTitle="Delivery Fulfillment Status"
            breakdown={[
              { name: "Completed (Last 24h)", value: `${dashboardData.fulfillment.completed_today} order${dashboardData.fulfillment.completed_today !== 1 ? 's' : ''}`, color: "#16A34A" },
              { name: "Pending Dispatch", value: `${dashboardData.fulfillment.pending_dispatch} order${dashboardData.fulfillment.pending_dispatch !== 1 ? 's' : ''}`, color: "#F5A800" },
              { name: "Returned Vouchers", value: `${dashboardData.fulfillment.returned_vouchers} item${dashboardData.fulfillment.returned_vouchers !== 1 ? 's' : ''}`, color: "#E11D48" }
            ]}
          />

          {/* Card 2: Financial Status & Claims */}
          <KPICard 
            label="Revenue & Collections MTD" 
            value={dashboardData.financials.total_collections} 
            prefix="UGX "
            subtitle="Total collections posted this month"
            icon={Wallet} 
            rightIcon={TrendingUp}
            trend={dashboardData.financials.trend}
            subMetrics={[
              { label: "Total Receivables Ledger", value: formatCompactCurrency(dashboardData.financials.pending_credits), icon: CheckCircle2 }
            ]}
            breakdownTitle="Top Outstanding Claims"
            breakdown={dashboardData.financials.top_claims.map((claim: any) => ({
              name: claim.name,
              value: claim.value,
              color: "#16A34A"
            }))}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />

          {/* Card 3: Order Status Distribution (Pie Chart matching screenshot style) */}
          <Card className="border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between h-full">
            <div className="bg-brand-forest text-white px-5 py-3.5 flex items-center gap-2">
              <Activity size={16} className="text-brand-yellow" />
              <h3 className="font-heading font-semibold text-sm">Order Status Distribution</h3>
            </div>
            
            <CardContent className="p-5 flex flex-col justify-between flex-1">
              <div className="h-[210px] w-full flex items-center justify-center">
                {dashboardData.status_distribution.every((d: any) => d.value === 0) ? (
                  <div className="text-gray-400 text-xs italic">No active order records this month</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dashboardData.status_distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', fontSize: '12px' }}
                        formatter={(val) => [`${val}%`, "Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 border-t border-brand-sage/50 pt-3.5">
                {dashboardData.status_distribution.map((status: any) => (
                  <div key={status.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{status.name}</span>
                    <span className="text-[11px] text-gray-700 font-extrabold ml-auto">{status.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ROW 2: Revenue Area Chart (2/3) & Warehouse Stock KPICard (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6">
              <CardTitle className="text-base font-bold text-brand-forest font-heading">Revenue Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.revenue_trend}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A5C2A" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1A5C2A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5A800" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#F5A800" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${(val/1_000_000).toFixed(0)}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(val) => [formatCurrency(val), ""]}
                    />
                    <Area type="monotone" dataKey="collected" stroke="#1A5C2A" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
                    <Area type="monotone" dataKey="invoiced" stroke="#F5A800" strokeWidth={3} fillOpacity={1} fill="url(#colorInvoiced)" name="Invoiced" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Stock detailed card */}
          <KPICard 
            label="Warehouse Inventory Valuation" 
            value={dashboardData.warehouse.total_value} 
            prefix="UGX "
            subtitle="Combined financial worth of production & sales stores"
            icon={Warehouse} 
            rightIcon={Warehouse}
            subMetrics={[
              { label: "Production Store Value", value: formatCompactCurrency(dashboardData.warehouse.production_value), icon: Warehouse },
              { label: "Sales Store Value", value: formatCompactCurrency(dashboardData.warehouse.sales_value), icon: Warehouse }
            ]}
            breakdownTitle="Inventory Worth Allocation"
            breakdown={[
              { name: "Production Store (Bulk)", value: formatCurrency(dashboardData.warehouse.production_value), color: "#1A5C2A" },
              { name: "Sales Store (Packaged)", value: formatCurrency(dashboardData.warehouse.sales_value), color: "#F5A800" },
              { name: "Reserve Poultry & Feed", value: formatCurrency(dashboardData.warehouse.reserve_value), color: "#2563EB" }
            ]}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />

        </div>

        {/* ROW 3: Top Customers Bar Chart (2/3) & Live Activity Feed (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <Card className="lg:col-span-2 border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6">
              <CardTitle className="text-base font-bold text-brand-forest font-heading">Top Customers by Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                {dashboardData.top_customers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs italic">
                    No customers with outstanding credit balance.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.top_customers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8F0E9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${(val/1_000_000).toFixed(1)}M`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A5C2A', fontWeight: 600 }} width={120} />
                      <Tooltip 
                        cursor={{ fill: '#F8FBF8' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', fontSize: '12px' }}
                        formatter={(val) => [formatCurrency(val), "Outstanding"]}
                      />
                      <Bar dataKey="balance" fill="#1A5C2A" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-forest font-heading font-heading">Live System Feed</CardTitle>
              <History size={18} className="text-brand-mid" />
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {dashboardData.activity_feed.length === 0 ? (
                  <div className="text-center py-12 text-xs italic text-gray-400">No recent transactions or log activities recorded.</div>
                ) : (
                  dashboardData.activity_feed.map((item: any) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="mt-1">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 ${
                          item.type === 'order' ? 'bg-blue-500 animate-pulse' :
                          item.type === 'delivery' ? 'bg-green-500 animate-pulse' :
                          item.type === 'payment' ? 'bg-amber-500 animate-pulse' :
                          'bg-rose-500 animate-pulse'
                        }`} />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs text-gray-700 leading-relaxed group-hover:text-brand-forest transition-colors font-semibold">
                          {item.text}
                        </p>
                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">{formatTimeAgo(item.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
}
