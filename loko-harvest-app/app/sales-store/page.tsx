"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRightLeft, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  Warehouse,
  History,
  AlertTriangle
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

const mockStock = [
  { id: "1", product: "White Eggs", code: "EGG-WHT", quantity: 840, unit: "Trays", status: "good" },
  { id: "2", product: "Brown Eggs", code: "EGG-BRN", quantity: 210, unit: "Trays", status: "low" },
  { id: "3", product: "Cream Eggs", code: "EGG-CRM", quantity: 450, unit: "Trays", status: "good" },
  { id: "4", product: "Dressed Chicken", code: "POU-DRS", quantity: 125, unit: "Units", status: "good" },
  { id: "5", product: "Chicken Manure", code: "BY-MNR", quantity: 1500, unit: "Kg", status: "good" },
];

const mockMovements = [
  { id: "1", date: "2026-05-16 02:30 PM", product: "White Eggs", type: "transfer_in", quantity: 200, ref: "TRF-001" },
  { id: "2", date: "2026-05-16 01:15 PM", product: "Dressed Chicken", type: "dispatch_out", quantity: 15, ref: "LHO-0042" },
  { id: "3", date: "2026-05-15 11:00 AM", product: "Brown Eggs", type: "transfer_in", quantity: 100, ref: "TRF-000" },
];

export default function SalesStorePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Sales Store Management</h1>
            <p className="text-gray-500 font-body">Monitor packaged stock and inventory movements</p>
          </div>
          <Link href="/sales-store/transfers">
            <Button className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none">
              <ArrowRightLeft size={18} />
              New Stock Transfer
            </Button>
          </Link>
        </div>

        {/* Stock Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockStock.map((item) => (
            <Card key={item.id} className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${item.status === 'low' ? 'bg-red-50 text-red-600' : 'bg-brand-sage text-brand-forest'}`}>
                    <Warehouse size={20} />
                  </div>
                  {item.status === 'low' && (
                    <Badge variant="critical" className="animate-pulse-gentle">LOW STOCK</Badge>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500 font-body">{item.product}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-brand-forest font-heading">{item.quantity}</span>
                  <span className="text-sm text-gray-400 font-medium">{item.unit}</span>
                </div>
                <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.status === 'low' ? 'bg-red-500' : 'bg-brand-mid'}`} 
                    style={{ width: `${Math.min((item.quantity / 1000) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Movements */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sage pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History size={20} className="text-brand-forest" />
                Recent Stock Movements
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Search logs..." className="pl-9 h-9 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-none">
                <TableHeader>
                  <TableRow className="bg-transparent border-none">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMovements.map((move) => (
                    <TableRow key={move.id}>
                      <TableCell className="text-xs text-gray-500">{move.date}</TableCell>
                      <TableCell className="font-medium text-brand-forest">{move.product}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {move.type === 'transfer_in' ? (
                            <ArrowDownToLine size={14} className="text-green-600" />
                          ) : (
                            <ArrowUpFromLine size={14} className="text-amber-600" />
                          )}
                          <span className="text-xs capitalize">{move.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${move.type === 'transfer_in' ? 'text-green-600' : 'text-amber-600'}`}>
                        {move.type === 'transfer_in' ? '+' : '-'}{move.quantity}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-400">{move.ref}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <button className="w-full py-4 text-sm font-semibold text-brand-forest hover:bg-brand-sage/20 transition-colors">
                View Full Movement Ledger
              </button>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="text-red-500 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-red-700">Brown Eggs Low</p>
                    <p className="text-xs text-red-600 mt-1">Stock is below 20% of required threshold for pending orders.</p>
                    <Button variant="outline" size="sm" className="mt-3 h-8 text-xs border-red-200 text-red-700 hover:bg-red-100">
                      View Pending Orders
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-brand-sage/30 rounded-xl border border-brand-sage">
                  <p className="text-sm font-semibold text-brand-forest">Storage Capacity</p>
                  <p className="text-xs text-gray-500 mt-1">Currently at 64% total capacity across all products.</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Trays (Eggs)</span>
                      <span className="font-bold">1,500 / 2,500</span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-forest h-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
