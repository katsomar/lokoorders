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
  Printer
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
    { status: "Pending", user: "Sarah Namubiru", time: "2026-05-16 10:15 AM", notes: "Order received via phone." },
  ]
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(mockOrder);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="text-gray-400" size={18} />;
      case 'processing': return <Package className="text-blue-500" size={18} />;
      case 'ready_for_dispatch': return <Package className="text-amber-500" size={18} />;
      case 'dispatched': return <Truck className="text-purple-500" size={18} />;
      case 'delivered': return <CheckCircle2 className="text-green-500" size={18} />;
      default: return <Clock size={18} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft size={24} />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-forest font-heading">{order.order_number}</h1>
                <Badge variant={order.status as any}>{order.status.replace(/_/g, ' ')}</Badge>
                <Badge variant={order.urgency as any}>{order.urgency}</Badge>
              </div>
              <p className="text-gray-500 font-body">Placed on {format(new Date(order.order_date), "dd MMMM, yyyy")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Printer size={18} />
              Print Invoice
            </Button>
            <Button className="gap-2 bg-brand-mid hover:bg-brand-forest">
              Move to Processing
              <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Customer & Delivery Card */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Customer & Delivery Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <User size={20} className="text-brand-forest shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</p>
                        <p className="font-semibold text-gray-900">{order.customer.name}</p>
                        <p className="text-sm text-gray-600">{order.customer.contact_person}</p>
                        <p className="text-sm text-gray-600">{order.customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Truck size={20} className="text-brand-forest shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Delivery Address</p>
                        <p className="text-sm text-gray-700">{order.customer.address}</p>
                        <p className="text-sm font-medium text-brand-forest">{order.customer.zone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Calendar size={20} className="text-brand-forest shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Required Delivery Date</p>
                        <p className="font-semibold text-gray-900">{format(new Date(order.required_delivery_date), "EEEE, dd MMMM yyyy")}</p>
                        <p className="text-xs text-brand-amber font-medium mt-1">2 days remaining</p>
                      </div>
                    </div>
                    {order.order_notes && (
                      <div className="flex gap-3">
                        <FileText size={20} className="text-brand-forest shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order Notes</p>
                          <p className="text-sm text-gray-700 italic">"{order.order_notes}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-semibold text-brand-forest">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">UGX {item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">UGX {item.line_total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-gray-500 font-medium">Subtotal</TableCell>
                      <TableCell className="text-right font-medium">UGX {order.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-gray-500 font-medium">Tax (0%)</TableCell>
                      <TableCell className="text-right font-medium">UGX 0</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell colSpan={2} />
                      <TableCell className="text-right text-brand-forest font-bold text-lg">Total</TableCell>
                      <TableCell className="text-right text-brand-forest font-bold text-lg">UGX {order.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Timeline */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-sage">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-white border-2 border-brand-forest z-10" />
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-brand-forest text-sm">{event.status}</p>
                          <p className="text-[10px] text-gray-400">{event.time}</p>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <User size={10} /> {event.user}
                        </p>
                        {event.notes && (
                          <p className="text-xs text-gray-500 bg-brand-sage/20 p-2 rounded-lg mt-2">
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
            <Card className="border-none shadow-sm bg-brand-sage/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-brand-amber shrink-0" size={18} />
                  <p className="text-sm text-gray-700 font-body">
                    Dispatch will be blocked if Sales Store stock is insufficient.
                  </p>
                </div>
                <Button variant="outline" className="w-full text-brand-forest border-brand-forest hover:bg-brand-forest hover:text-white">
                  View Linked Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
