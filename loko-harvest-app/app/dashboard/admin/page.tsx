"use client";

import React from "react";
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
  Activity
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

const revenueData = [
  { name: "01 May", collected: 4000000, invoiced: 4500000 },
  { name: "05 May", collected: 3000000, invoiced: 5200000 },
  { name: "10 May", collected: 2000000, invoiced: 4800000 },
  { name: "15 May", collected: 2780000, invoiced: 3908000 },
  { name: "20 May", collected: 1890000, invoiced: 4800000 },
  { name: "25 May", collected: 2390000, invoiced: 3800000 },
  { name: "30 May", collected: 3490000, invoiced: 4300000 },
];

const statusData = [
  { name: "Delivered", value: 50, color: "#16A34A" }, // Fresh Green
  { name: "Pending", value: 40, color: "#F5A800" },    // Soft Amber
  { name: "Dispatched", value: 20, color: "#2563EB" }, // Vivid Blue
  { name: "Processing", value: 30, color: "#8B5CF6" }, // Purple
  { name: "Returned", value: 10, color: "#E11D48" },   // Rose
];

const topCustomers = [
  { name: "Shoprite Lugogo", balance: 12500000 },
  { name: "KFC Bukoto", balance: 8400000 },
  { name: "Café Javas", balance: 6200000 },
  { name: "Carrefour Oasis", balance: 4500000 },
  { name: "Quality Supermarket", balance: 3800000 },
];

const activityFeed = [
  { id: 1, type: "order", text: "New order LHO-2026-0042 placed by Shoprite Lugogo", time: "2 mins ago" },
  { id: 2, type: "delivery", text: "Driver Musa confirmed delivery for LHO-2026-0038", time: "15 mins ago" },
  { id: 3, type: "payment", text: "Payment of UGX 2,450,000 received from KFC Bukoto", time: "45 mins ago" },
  { id: 4, type: "stock", text: "Transfer of 500 trays (Brown Eggs) to Sales Store", time: "1 hour ago" },
  { id: 5, type: "return", text: "Return voucher LHR-2026-0008 raised for Café Javas", time: "2 hours ago" },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* ROW 1: Upgraded Operations Cards & Donut Chart (Grid of 3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Fulfillment Operations */}
          <KPICard 
            label="Fulfillment Operations" 
            value={36} 
            subtitle="Active orders handled in the last 24 hours"
            icon={ShoppingBag} 
            rightIcon={Truck}
            trend={{ value: 12, isUp: true }}
            subMetrics={[
              { label: "Today's New Orders", value: "24", icon: ShoppingBag },
              { label: "Active Fleet Drivers", value: "6 drivers", icon: Users }
            ]}
            breakdownTitle="Delivery Fulfillment Status"
            breakdown={[
              { name: "Completed / Delivered", value: "12 orders", color: "#16A34A" },
              { name: "Pending Dispatch", value: "18 orders", color: "#F5A800" },
              { name: "Returned Vouchers", value: "6 items", color: "#E11D48" }
            ]}
          />

          {/* Card 2: Financial Status & Claims */}
          <KPICard 
            label="Revenue & Collections MTD" 
            value={4250000} 
            prefix="UGX "
            subtitle="Total collections posted this month"
            icon={Wallet} 
            rightIcon={TrendingUp}
            trend={{ value: 8, isUp: true }}
            subMetrics={[
              { label: "Pending Account Credits", value: "UGX 1.2M MTD", icon: CheckCircle2 }
            ]}
            breakdownTitle="Top Outstanding Claims"
            breakdown={[
              { name: "Shoprite Lugogo Ledger", value: "UGX 12.5M", color: "#16A34A" },
              { name: "KFC Bukoto Ledger", value: "UGX 8.4M", color: "#F5A800" },
              { name: "Café Javas Ledger", value: "UGX 6.2M", color: "#2563EB" }
            ]}
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 border-t border-brand-sage/50 pt-3.5">
                {statusData.map((status) => (
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
                  <AreaChart data={revenueData}>
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
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${val/1000000}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
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
            value={103680000} 
            prefix="UGX "
            subtitle="Combined financial worth of Production and Sales stores"
            icon={Warehouse} 
            rightIcon={Warehouse}
            subMetrics={[
              { label: "Production Store Value", value: "UGX 58.2M", icon: Warehouse },
              { label: "Sales Store Value", value: "UGX 45.4M", icon: Warehouse }
            ]}
            breakdownTitle="Inventory Worth Allocation"
            breakdown={[
              { name: "Production Store (Bulk Trays)", value: "UGX 58,225,000", color: "#1A5C2A" },
              { name: "Sales Store (Packaged Eggs)", value: "UGX 45,455,000", color: "#F5A800" },
              { name: "Reserve Poultry & Feed Value", value: "UGX 10,950,000", color: "#2563EB" }
            ]}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />

        </div>

        {/* ROW 3: Top Customers Bar Chart (2/3) & Live Activity Feed (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6">
              <CardTitle className="text-base font-bold text-brand-forest font-heading">Top Customers by Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8F0E9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${val/1000000}M`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A5C2A', fontWeight: 600 }} width={120} />
                    <Tooltip 
                      cursor={{ fill: '#F8FBF8' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', fontSize: '12px' }}
                    />
                    <Bar dataKey="balance" fill="#1A5C2A" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-forest font-heading">Live System Feed</CardTitle>
              <History size={18} className="text-brand-mid" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="mt-1">
                      <div className={`h-2.5 w-2.5 rounded-full mt-1 ${
                        item.type === 'order' ? 'bg-blue-500' :
                        item.type === 'delivery' ? 'bg-green-500' :
                        item.type === 'payment' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs text-gray-700 leading-relaxed group-hover:text-brand-forest transition-colors font-medium">
                        {item.text}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2.5 text-xs font-bold text-brand-forest hover:bg-brand-sage/30 rounded-xl transition-all border border-brand-sage border-dashed">
                View All Audits
              </button>
            </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
}
