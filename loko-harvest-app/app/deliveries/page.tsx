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
  ArrowRight,
  X,
  FileText,
  Phone,
  ShieldCheck,
  AlertCircle,
  Map
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
  { 
    id: "1", 
    order: "LHO-0042", 
    orderId: "order-42",
    customer: "Shoprite Lugogo", 
    driver: "Musa Driver", 
    phone: "0772 111 222",
    vehicle: "UBL 482Y (Crate Truck)",
    zone: "Kampala Central", 
    status: "pending", 
    time: "2026-05-18 10:00 AM",
    items: [
      { name: "White Large Eggs (Crate of 30)", quantity: 150, packaging: "Special Cardboard Crate" },
      { name: "Brown Jumbo Eggs (Crate of 30)", quantity: 80, packaging: "Standard Plastic Crate" }
    ],
    route: ["HQ Dispatch Center", "Kira Road Bypass", "Shoprite Lugogo Loading Dock"]
  },
  { 
    id: "2", 
    order: "LHO-0041", 
    orderId: "order-41",
    customer: "KFC Bukoto", 
    driver: "John Okello", 
    phone: "0752 987 654",
    vehicle: "UBA 901P (Refrigerated Van)",
    zone: "Bukoto", 
    status: "dispatched", 
    time: "2026-05-16 02:30 PM",
    items: [
      { name: "Cream Farm Eggs (Crate of 30)", quantity: 60, packaging: "Standard Plastic Crate" },
      { name: "Fresh Broiler Chicken (Whole kg)", quantity: 200, packaging: "Vacuum Sealed Carton" }
    ],
    route: ["HQ Dispatch Center", "Bukoto Flyover Checkpoint", "KFC Bukoto Receiving Area"]
  },
  { 
    id: "3", 
    order: "LHO-0040", 
    orderId: "order-40",
    customer: "Café Javas", 
    driver: "Musa Driver", 
    phone: "0772 111 222",
    vehicle: "UBL 482Y (Crate Truck)",
    zone: "Oasis Mall", 
    status: "delivered", 
    time: "2026-05-16 11:15 AM",
    items: [
      { name: "White Large Eggs (Crate of 30)", quantity: 100, packaging: "Special Cardboard Crate" }
    ],
    route: ["HQ Dispatch Center", "Yusuf Lule Checkpoint", "Oasis Mall Service Bay"]
  },
  { 
    id: "4", 
    order: "LHO-0039", 
    orderId: "order-39",
    customer: "Carrefour Oasis", 
    driver: "Sarah Namubiru", 
    phone: "0702 333 444",
    vehicle: "UBB 123T (Light Box Van)",
    zone: "Kampala Central", 
    status: "returned", 
    time: "2026-05-15 03:00 PM",
    items: [
      { name: "Brown Jumbo Eggs (Crate of 30)", quantity: 120, packaging: "Standard Plastic Crate" }
    ],
    route: ["HQ Dispatch Center", "Garden City Roadblock", "Oasis Mall Entrance"]
  },
];

export default function DeliveriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const filteredDeliveries = mockDeliveries.filter(d => 
    d.order.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {filteredDeliveries.map((delivery) => (
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedDelivery(delivery)}
                    className="gap-2 text-brand-forest hover:bg-brand-sage/20 rounded-lg px-2.5 h-8"
                  >
                    Details
                    <ArrowRight size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* LOGISTICS DETAILS & GATEPASS OVERLAY MODAL */}
        {selectedDelivery && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2.5">
                  <Truck className="text-brand-yellow" size={22} />
                  <div>
                    <h3 className="font-heading font-black text-base text-brand-yellow">Fulfillment & Dispatch Gatepass</h3>
                    <p className="text-[11px] text-brand-sage font-medium mt-0.5">Logistics specs & shipping manifest for invoice {selectedDelivery.order}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedDelivery(null)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                
                {/* 1. FLEET & DRIVER PROFILE METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-brand-sage/30 text-xs">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Assigned Driver</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                      <User size={12} className="text-brand-mid" />
                      {selectedDelivery.driver}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fleet Vehicle</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                      <Truck size={12} className="text-brand-mid" />
                      {selectedDelivery.vehicle}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Zone</p>
                    <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1 font-mono">
                      <MapPin size={12} className="text-brand-mid" />
                      {selectedDelivery.zone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Driver Contact</p>
                    <p className="font-bold text-brand-forest mt-0.5 flex items-center gap-1 underline font-mono">
                      <Phone size={11} />
                      {selectedDelivery.phone}
                    </p>
                  </div>
                </div>

                {/* 2. LOGISTICS CARGO MANIFEST */}
                <div>
                  <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText size={13} />
                    Fulfillment Cargo Manifest
                  </h4>
                  <div className="border border-brand-sage/40 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-brand-sage/10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-brand-forest font-extrabold text-[10px] py-2">Egg Size & Packaging Spec</TableHead>
                          <TableHead className="text-brand-forest font-extrabold text-[10px] py-2">Packaging Standard</TableHead>
                          <TableHead className="text-right text-brand-forest font-extrabold text-[10px] py-2">Quantity Loaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDelivery.items.map((item: any, idx: number) => (
                          <TableRow key={idx} className="bg-white border-b border-gray-100 last:border-b-0 hover:bg-transparent">
                            <TableCell className="font-bold text-gray-700 text-xs py-2.5">{item.name}</TableCell>
                            <TableCell className="text-gray-500 font-medium text-xs py-2.5">{item.packaging}</TableCell>
                            <TableCell className="text-right font-extrabold text-brand-forest text-xs py-2.5">{item.quantity} Crates</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 3. SHIPPED CHECKPOINTS TIMELINE TRACKER */}
                <div>
                  <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Map size={13} />
                    GPS Shipped Checkpoints & Gatepass Log
                  </h4>
                  
                  <div className="relative pl-6 space-y-4 border-l border-brand-sage/40 ml-3">
                    {selectedDelivery.route.map((stop: string, idx: number) => {
                      const isFirst = idx === 0;
                      const isLast = idx === selectedDelivery.route.length - 1;
                      const isPending = selectedDelivery.status === "pending";
                      const isDelivered = selectedDelivery.status === "delivered";
                      
                      let dotColor = "bg-gray-300 border-gray-100";
                      let logMsg = "Awaiting dispatch authority signoff";

                      if (isFirst) {
                        dotColor = "bg-green-600 border-green-100 ring-4 ring-green-100";
                        logMsg = "Cargo loaded, vehicle sealed, and gatepass approved at HQ Depot";
                      } else if (isLast) {
                        if (isDelivered) {
                          dotColor = "bg-green-600 border-green-100 ring-4 ring-green-100";
                          logMsg = `Successfully delivered and signed off at ${selectedDelivery.customer} receiving docks`;
                        } else if (selectedDelivery.status === "dispatched") {
                          dotColor = "bg-amber-500 border-amber-100 ring-4 ring-amber-100 animate-pulse";
                          logMsg = `In-transit to destination at ${selectedDelivery.customer}`;
                        } else if (selectedDelivery.status === "returned") {
                          dotColor = "bg-red-500 border-red-100 ring-4 ring-red-100";
                          logMsg = "Delivery returned due to customer site storage limits";
                        }
                      } else {
                        // Mid stops
                        if (isDelivered || selectedDelivery.status === "dispatched") {
                          dotColor = "bg-green-600 border-green-100";
                          logMsg = "Passed bypass checkpoint successfully";
                        }
                      }

                      return (
                        <div key={idx} className="relative text-xs">
                          {/* Indicator Dot */}
                          <div className={`absolute -left-[30px] top-0.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${dotColor}`}>
                            {isFirst && <ShieldCheck size={10} className="text-white" />}
                            {isLast && isDelivered && <CheckCircle2 size={10} className="text-white" />}
                            {isLast && selectedDelivery.status === "returned" && <AlertCircle size={10} className="text-white" />}
                          </div>

                          <div className="font-bold text-gray-800">{stop}</div>
                          <div className="text-gray-400 font-medium text-[10px] mt-0.5">{logMsg}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer / Action buttons */}
              <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-t border-brand-sage/20">
                <Button 
                  onClick={() => window.print()}
                  variant="outline" 
                  className="h-9 px-4 rounded-xl text-xs font-extrabold gap-1.5"
                >
                  <FileText size={14} />
                  Print Delivery Note
                </Button>

                <div className="flex gap-2">
                  <Link href={`/orders`}>
                    <Button 
                      className="h-9 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5"
                    >
                      View Order Ledger
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => setSelectedDelivery(null)}
                    variant="primary" 
                    className="h-9 px-4 rounded-xl text-xs font-bold"
                  >
                    Close Portal
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
