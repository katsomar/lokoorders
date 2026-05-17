"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Search, 
  Truck, 
  Phone, 
  Star, 
  ChevronRight,
  ShieldCheck,
  Plus,
  Clock,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockDrivers = [
  { 
    id: "1", 
    name: "Musa Driver", 
    phone: "0700 000 002", 
    license: "UG-1048", 
    vehicle: "UAB 123X", 
    status: "available", 
    rating: 4.8, 
    deliveries: 156,
    current_location: "Wandegeya"
  },
  { 
    id: "2", 
    name: "John Okello", 
    phone: "0772 111 222", 
    license: "UG-5562", 
    vehicle: "UAE 445Z", 
    status: "busy", 
    rating: 4.9, 
    deliveries: 89,
    current_location: "Bukoto"
  },
  { 
    id: "3", 
    name: "Sarah Namubiru", 
    phone: "0755 333 444", 
    license: "UG-8821", 
    vehicle: "UBC 778A", 
    status: "available", 
    rating: 4.7, 
    deliveries: 210,
    current_location: "Kampala Central"
  },
  { 
    id: "4", 
    name: "Peter Pan", 
    phone: "0788 666 555", 
    license: "UG-2231", 
    vehicle: "UBG 990P", 
    status: "offline", 
    rating: 4.5, 
    deliveries: 45,
    current_location: "N/A"
  },
];

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Driver Management</h1>
            <p className="text-gray-500 font-body">Manage delivery personnel and vehicle assignments</p>
          </div>
          <Button className="gap-2">
            <Plus size={18} />
            Register New Driver
          </Button>
        </div>

        <div className="relative w-full max-w-md bg-white rounded-xl shadow-sm border border-brand-sage p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by name, phone or vehicle..." 
            className="pl-11 border-none focus-visible:ring-0 shadow-none h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDrivers.map((driver) => (
            <Card key={driver.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-brand-sage flex items-center justify-center text-brand-forest">
                      <User size={28} />
                    </div>
                    <Badge variant={driver.status as any} className="capitalize">
                      {driver.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-brand-forest font-heading">{driver.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={12} /> {driver.phone}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 py-4 border-y border-brand-sage/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</p>
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Truck size={12} className="text-brand-mid" /> {driver.vehicle}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deliveries</p>
                      <p className="text-xs font-bold text-gray-700">{driver.deliveries} total</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-brand-yellow">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold text-gray-700">{driver.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <MapPin size={10} className="text-brand-mid" />
                      {driver.current_location}
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-4 bg-brand-sage/20 text-brand-forest font-bold text-xs flex items-center justify-center gap-2 group-hover:bg-brand-sage/40 transition-colors">
                  VIEW FULL PERFORMANCE PROFILE
                  <ChevronRight size={14} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
