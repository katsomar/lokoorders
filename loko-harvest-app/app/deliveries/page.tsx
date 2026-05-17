"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Truck, 
  Search, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Filter,
  Plus,
  ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockDeliveries = [
  { id: "1", order: "LHO-0042", customer: "Shoprite Lugogo", driver: "Musa Driver", zone: "Kampala Central", status: "pending", time: "2026-05-18 10:00 AM" },
  { id: "2", order: "LHO-0041", customer: "KFC Bukoto", driver: "John Okello", zone: "Bukoto", status: "dispatched", time: "2026-05-16 02:30 PM" },
  { id: "3", order: "LHO-0040", customer: "Café Javas", driver: "Musa Driver", zone: "Oasis Mall", status: "delivered", time: "2026-05-16 11:15 AM" },
  { id: "4", order: "LHO-0039", customer: "Carrefour Oasis", driver: "Sarah Namubiru", zone: "Kampala Central", status: "returned", time: "2026-05-15 03:00 PM" },
];

export default function DeliveriesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Logistics & Deliveries</h1>
            <p className="text-gray-500 font-body">Track fleet status and delivery fulfillment</p>
          </div>
          <Button className="gap-2 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none">
            <Plus size={18} />
            Assign Delivery
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by order, customer or driver..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Filter by Zone
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Ref</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Scheduled/Actual Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-bold text-brand-forest">{delivery.order}</TableCell>
                <TableCell className="font-medium">{delivery.customer}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm">{delivery.driver}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-mid" />
                    <span className="text-xs">{delivery.zone}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    {delivery.time}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={delivery.status as any}>{delivery.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-2 text-brand-forest">
                    Details
                    <ArrowRight size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
