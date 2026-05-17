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
  History
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
  Bar,
  HorizontalBarChart
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
  { name: "Pending", value: 40, color: "#6B7280" },
  { name: "Processing", value: 30, color: "#3B82F6" },
  { name: "Dispatched", value: 20, color: "#8B5CF6" },
  { name: "Delivered", value: 50, color: "#1A5C2A" },
  { name: "Returned", value: 10, color: "#F43F5E" },
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
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Today's Orders" 
            value={24} 
            icon={ShoppingBag} 
            trend={{ value: 12, isUp: true }}
          />
          <KPICard 
            label="Pending Deliveries" 
            value={18} 
            icon={Clock} 
            iconBg="bg-amber-50"
            iconColor="text-brand-amber"
          />
          <KPICard 
            label="Delivered Today" 
            value={12} 
            icon={CheckCircle2} 
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <KPICard 
            label="Today's Revenue" 
            value={4250000} 
            prefix="UGX "
            icon={Wallet} 
            trend={{ value: 8, isUp: true }}
          />
          <KPICard 
            label="Outstanding Balance" 
            value={42500000} 
            prefix="UGX "
            icon={TrendingUp} 
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <KPICard 
            label="Production Store" 
            value={1250} 
            suffix=" Trays"
            icon={Warehouse} 
          />
          <KPICard 
            label="Sales Store" 
            value={840} 
            suffix=" Trays"
            icon={ShoppingBag} 
          />
          <KPICard 
            label="Active Drivers" 
            value={6} 
            icon={Truck} 
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A5C2A" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1A5C2A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5A800" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#F5A800" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${val/1000000}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="collected" stroke="#1A5C2A" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
                    <Area type="monotone" dataKey="invoiced" stroke="#F5A800" strokeWidth={3} fillOpacity={1} fill="url(#colorInvoiced)" name="Invoiced" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                  {statusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs text-gray-600 font-medium">{status.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Top Customers by Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8F0E9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `UGX ${val/1000000}M`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1A5C2A', fontWeight: 600 }} width={120} />
                    <Tooltip 
                      cursor={{ fill: '#F8FBF8' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9' }}
                    />
                    <Bar dataKey="balance" fill="#1A5C2A" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Live Activity</CardTitle>
              <History size={18} className="text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="mt-1">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${
                        item.type === 'order' ? 'bg-blue-500' :
                        item.type === 'delivery' ? 'bg-green-500' :
                        item.type === 'payment' ? 'bg-amber-500' :
                        'bg-purple-500'
                      }`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-700 leading-snug group-hover:text-brand-forest transition-colors">
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 text-sm font-semibold text-brand-forest hover:bg-brand-sage rounded-lg transition-colors">
                View All Activity
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
