"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Printer,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";

const mockOrder = {
  id: "1",
  order_number: "LHO-2026-0042",
  customer: {
    name: "Shoprite Lugogo",
    contact_person: "John Okello",
    phone: "0772 123 456",
    address: "Lugogo Bypass, Kampala",
    zone: "Kampala Central"
  },
  order_date: "2026-05-16",
  required_delivery_date: "2026-05-18",
  urgency: "urgent",
  status: "pending",
  total_amount: 4250000,
  order_notes: "Please deliver before 10 AM. Gate 4.",
  items: [
    { id: "i1", product: { name: "White Eggs (Trays)", code: "EGG-WHT" }, quantity: 150, unit_price: 12000, line_total: 1800000 },
    { id: "i2", product: { name: "Brown Eggs (Trays)", code: "EGG-BRN" }, quantity: 100, unit_price: 13500, line_total: 1350000 },
    { id: "i3", product: { name: "Dressed Chicken (Unit)", code: "POU-DRS" }, quantity: 44, unit_price: 25000, line_total: 1100000 },
  ],
  timeline: [
    { status: "Pending Approval", user: "Sarah Namubiru", time: "2026-05-16 10:15 AM", notes: "Order received via phone. Waiting for inventory check." },
  ]
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(mockOrder);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Critical</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Urgent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Processing</Badge>;
      case 'ready_for_dispatch':
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Ready</Badge>;
      case 'dispatched':
        return <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Dispatched</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-lg shrink-0">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-lg shrink-0">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Standardized Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="h-9.5 w-9.5 p-0 bg-brand-sage/20 hover:bg-brand-sage/40 rounded-xl text-brand-forest transition-colors flex items-center justify-center shrink-0 border border-brand-sage/30"
            >
              <ChevronLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-brand-forest font-heading leading-none">{order.order_number}</h1>
                {getStatusBadge(order.status)}
                {getUrgencyBadge(order.urgency)}
              </div>
              <p className="text-gray-500 font-body text-xs mt-1.5">
                Order Placed: <strong className="text-gray-700">{format(new Date(order.order_date), "dd MMMM yyyy")}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9.5 px-4 text-xs font-extrabold border-brand-sage/60 text-brand-forest hover:bg-brand-sage/10 rounded-xl gap-1.5 shadow-sm">
              <Printer size={14} />
              Print Invoice
            </Button>
            <Button className="h-9.5 px-4 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm rounded-xl text-xs gap-1.5">
              Move to Processing
              <ArrowRight size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9.5 w-9.5 text-gray-500 hover:bg-brand-sage/20 rounded-xl">
              <MoreVertical size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Customer & Delivery Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Customer & Delivery details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    
                    {/* Customer Info with Corporate Logo Badge */}
                    <div className="flex gap-3.5">
                      <div className={`h-12 w-12 rounded-xl font-heading font-black text-sm flex items-center justify-center shadow-sm select-none shrink-0 ${
                        order.customer.name.includes("Shoprite") ? "bg-red-600 text-white" :
                        order.customer.name.includes("KFC") ? "bg-red-800 text-white" :
                        order.customer.name.includes("Javas") ? "bg-amber-800 text-white" :
                        "bg-brand-forest text-brand-yellow"
                      }`}>
                        {order.customer.name.includes("Shoprite") ? "S" :
                         order.customer.name.includes("KFC") ? "K" :
                         order.customer.name.includes("Javas") ? "CJ" :
                         order.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Corporate Customer</p>
                        <p className="font-bold text-gray-800 text-xs mt-0.5">{order.customer.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{order.customer.contact_person} • {order.customer.phone}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Address & Zone</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{order.customer.address}</p>
                        <p className="text-xs text-brand-forest font-extrabold mt-0.5">{order.customer.zone}</p>
                      </div>
                    </div>

                  </div>
                  
                  <div className="space-y-5">
                    
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Required Delivery Date</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{format(new Date(order.required_delivery_date), "EEEE, dd MMMM yyyy")}</p>
                        <p className="text-[10px] text-amber-600 font-extrabold mt-0.5 uppercase tracking-wide">2 Days Remaining</p>
                      </div>
                    </div>

                    {order.order_notes && (
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-sage/20 text-brand-forest flex items-center justify-center flex-shrink-0 shadow-sm">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Dispatch Instructions</p>
                          <p className="text-xs font-bold text-gray-700 italic mt-0.5">"{order.order_notes}"</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-brand-forest font-heading">
                  Ordered Items & Packaging
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6">Product Details</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest">Fulfillment Quantity</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Subtotal Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                        <TableCell className="pl-6 py-4">
                          <p className="font-bold text-brand-forest text-xs">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold tracking-wider font-mono mt-0.5">{item.product.code}</p>
                        </TableCell>
                        <TableCell className="text-center font-bold text-gray-800 text-xs">{item.quantity} Trays</TableCell>
                        <TableCell className="text-right font-medium text-gray-500 text-xs">UGX {item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-extrabold pr-6 text-brand-forest text-xs font-heading">UGX {item.line_total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent bg-gray-50/20 border-t border-brand-sage/20">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subtotal</TableCell>
                      <TableCell className="text-right font-bold text-gray-700 text-xs pr-6">UGX {order.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent bg-gray-50/20 border-none">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">V.A.T (0%)</TableCell>
                      <TableCell className="text-right font-bold text-gray-700 text-xs pr-6">UGX 0</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent bg-brand-sage/10 border-t border-brand-sage/30">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-xs font-extrabold text-brand-forest uppercase tracking-wider">Total Value</TableCell>
                      <TableCell className="text-right text-sm font-black text-brand-forest font-heading pr-6">UGX {order.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            
            {/* Timeline */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/30 border-b border-brand-sage/40 py-3.5 px-5">
                <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-brand-forest">
                  Order Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-sage/50">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="relative pl-7">
                      <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-white border-2 border-brand-forest z-10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-brand-yellow rounded-full" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-brand-forest text-xs">{event.status}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{event.time}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                          <User size={10} className="text-gray-400" /> {event.user}
                        </p>
                        {event.notes && (
                          <p className="text-[10px] text-gray-600 bg-brand-sage/20 p-2.5 rounded-lg mt-2 leading-relaxed">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions / Info */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-brand-sage/10">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="text-brand-amber shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Fulfillment block will trigger if Loko Sales Store available stock falls below requested dispatch quantity.
                  </p>
                </div>
                <Button variant="outline" className="w-full text-brand-forest border-brand-forest/60 hover:bg-brand-forest hover:text-white h-9.5 text-xs font-extrabold rounded-xl transition-colors">
                  View Linked Invoice Statement
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
