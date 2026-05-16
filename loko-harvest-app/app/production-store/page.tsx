"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowDownToLine, 
  ArrowRightLeft, 
  Search, 
  Warehouse,
  History,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockProductionStock = [
  { id: "1", product: "White Eggs", code: "EGG-WHT", quantity: 2450, unit: "Trays", capacity: 5000 },
  { id: "2", product: "Brown Eggs", code: "EGG-BRN", quantity: 1200, unit: "Trays", capacity: 3000 },
  { id: "3", product: "Cream Eggs", code: "EGG-CRM", quantity: 800, unit: "Trays", capacity: 2000 },
  { id: "4", product: "Dressed Chicken", code: "POU-DRS", quantity: 450, unit: "Units", capacity: 1000 },
];

const mockIntakes = [
  { id: "1", date: "2026-05-16 09:00 AM", product: "White Eggs", quantity: 500, batch: "B-0516-A", recorded_by: "Grace Namuli" },
  { id: "2", date: "2026-05-16 08:30 AM", product: "Brown Eggs", quantity: 300, batch: "B-0516-B", recorded_by: "Grace Namuli" },
  { id: "3", date: "2026-05-15 04:00 PM", product: "Dressed Chicken", quantity: 100, batch: "C-0515-X", recorded_by: "Grace Namuli" },
];

export default function ProductionStorePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Production Store Management</h1>
            <p className="text-gray-500 font-body">Track product intake from the farm and manage bulk inventory</p>
          </div>
          <div className="flex gap-2">
            <Link href="/production-store/intake">
              <Button className="gap-2">
                <ArrowDownToLine size={18} />
                New Intake
              </Button>
            </Link>
          </div>
        </div>

        {/* Current Stock Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProductionStock.map((item) => (
            <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-brand-sage text-brand-forest">
                    <Package size={20} />
                  </div>
                  <Badge variant="ready" className="bg-green-50 text-green-600">IN STOCK</Badge>
                </div>
                <h3 className="text-sm font-medium text-gray-500 font-body">{item.product}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-brand-forest font-heading">{item.quantity.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 font-medium">{item.unit}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <span>Utilization</span>
                    <span>{Math.round((item.quantity / item.capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-mid h-full rounded-full" 
                      style={{ width: `${(item.quantity / item.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Intake Ledger */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sage pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History size={20} className="text-brand-forest" />
                Recent Intake Logs
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Search intakes..." className="pl-9 h-9 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent border-none">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIntakes.map((intake) => (
                    <TableRow key={intake.id}>
                      <TableCell className="text-xs text-gray-500">{intake.date}</TableCell>
                      <TableCell className="font-semibold text-brand-forest">{intake.product}</TableCell>
                      <TableCell className="font-mono text-xs">{intake.batch}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">+{intake.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-gray-600">{intake.recorded_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <button className="w-full py-4 text-sm font-semibold text-brand-forest hover:bg-brand-sage/20 transition-colors">
                View All Intake Records
              </button>
            </CardContent>
          </Card>

          {/* Quick Stats / Info */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-brand-forest text-white">
              <CardHeader>
                <CardTitle className="text-white text-lg">Daily Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Total Intake (Today)</p>
                  <h3 className="text-3xl font-bold font-heading">800 Trays</h3>
                  <p className="text-xs text-brand-yellow font-medium flex items-center gap-1">
                    <TrendingUp size={12} /> 15% more than yesterday
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Opening Stock</span>
                    <span className="font-bold">3,850</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Transferred to Sales</span>
                    <span className="font-bold text-brand-yellow">-200</span>
                  </div>
                </div>

                <Button className="w-full bg-white text-brand-forest hover:bg-gray-100 font-bold mt-2">
                  Generate Today's Report
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 bg-brand-sage/30 rounded-xl border border-brand-sage flex gap-3">
               <AlertCircle className="text-brand-forest shrink-0" size={20} />
               <p className="text-xs text-brand-forest leading-relaxed font-medium">
                  <strong>Stock Accuracy:</strong> Please ensure all intakes are weighed or counted before recording. Mismatches will require manager adjustment.
               </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
