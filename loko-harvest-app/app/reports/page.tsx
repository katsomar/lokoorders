"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
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
  Filter
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const salesData = [
  { month: "Jan", eggs: 45, poultry: 30, manure: 10 },
  { month: "Feb", eggs: 52, poultry: 35, manure: 12 },
  { month: "Mar", eggs: 48, poultry: 40, manure: 15 },
  { month: "Apr", eggs: 61, poultry: 45, manure: 20 },
  { month: "May", eggs: 55, poultry: 50, manure: 18 },
];

const categoryData = [
  { name: "White Eggs", value: 400, color: "#1A5C2A" },
  { name: "Brown Eggs", value: 300, color: "#3A8C3F" },
  { name: "Poultry", value: 200, color: "#F5A800" },
  { name: "By-products", value: 100, color: "#E08C00" },
];

const driverPerformance = [
  { name: "Musa", deliveries: 42, onTime: 38 },
  { name: "John", deliveries: 35, onTime: 34 },
  { name: "Sarah", deliveries: 28, onTime: 25 },
  { name: "Peter", deliveries: 22, onTime: 20 },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Advanced Analytics</h1>
            <p className="text-gray-500 font-body">Performance insights and financial reconciliation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download size={18} />
              Export PDF
            </Button>
            <Button className="gap-2">
              <Calendar size={18} />
              Last 30 Days
            </Button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-mid" />
                Net Sales Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-3xl font-bold text-brand-forest">UGX 125.4M</h3>
              <p className="text-xs text-green-600 font-semibold mt-2">+14.5% vs prev month</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users size={16} className="text-brand-mid" />
                Average Customer Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-3xl font-bold text-brand-forest">UGX 4.2M</h3>
              <p className="text-xs text-brand-yellow font-semibold mt-2">+2.1% vs prev month</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Truck size={16} className="text-brand-mid" />
                Delivery Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-3xl font-bold text-brand-forest">98.2%</h3>
              <p className="text-xs text-green-600 font-semibold mt-2">+0.5% vs prev month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Growth */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Sales Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0E9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip cursor={{ fill: '#F8FBF8' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E8F0E9' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="eggs" name="Eggs" fill="#1A5C2A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="poultry" name="Poultry" fill="#3A8C3F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="manure" name="By-products" fill="#F5A800" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Inventory Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Performance Table */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Logistics Performance Ledger</CardTitle>
            <Button variant="ghost" size="sm" className="text-brand-forest">Full Leaderboard</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-sage/20 text-brand-forest uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Driver Name</th>
                    <th className="px-6 py-4 text-center">Total Jobs</th>
                    <th className="px-6 py-4 text-center">On-Time</th>
                    <th className="px-6 py-4 text-center">Efficiency</th>
                    <th className="px-6 py-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sage/50">
                  {driverPerformance.map((driver) => (
                    <tr key={driver.name} className="hover:bg-brand-sage/5">
                      <td className="px-6 py-4 font-semibold text-gray-900">{driver.name}</td>
                      <td className="px-6 py-4 text-center">{driver.deliveries}</td>
                      <td className="px-6 py-4 text-center">{driver.onTime}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-mid h-full" 
                                style={{ width: `${(driver.onTime / driver.deliveries) * 100}%` }}
                              />
                           </div>
                           <span className="text-[10px] font-bold">{Math.round((driver.onTime / driver.deliveries) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1 text-brand-yellow">
                            {"★".repeat(4)}{"☆".repeat(1)}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
