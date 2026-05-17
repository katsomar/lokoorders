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
  MapPin,
  ListFilter,
  Gauge,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Relational Mock Data to match our fresh MySQL Seeders
const mockVehiles = [
  {
    id: "v1",
    registration_number: "UBL 482Y",
    make: "Isuzu",
    model: "Cargo Crate Truck",
    max_crates_capacity: 500,
    fuel_level: 85,
    status: "active",
    assigned_drivers: ["Musa Driver", "Sarah Namubiru"] // 👈 Multiple drivers assigned to one vehicle!
  },
  {
    id: "v2",
    registration_number: "UAB 123X",
    make: "Toyota",
    model: "Hiace Crate Van",
    max_crates_capacity: 200,
    fuel_level: 90,
    status: "active",
    assigned_drivers: ["John Okello"]
  },
  {
    id: "v3",
    registration_number: "UAE 445Z",
    make: "Mitsubishi",
    model: "Fuso Transporter",
    max_crates_capacity: 800,
    fuel_level: 60,
    status: "active",
    assigned_drivers: []
  },
  {
    id: "v4",
    registration_number: "UBC 778A",
    make: "Isuzu",
    model: "Elf Crate Truck",
    max_crates_capacity: 400,
    fuel_level: 45,
    status: "maintenance",
    assigned_drivers: ["Peter Pan"]
  }
];

const mockDrivers = [
  { 
    id: "d1", 
    name: "Musa Driver", 
    phone: "0700 000 002", 
    license: "UG-1048", 
    vehicle_registration: "UBL 482Y", // 👈 Shares UBL 482Y
    vehicle_make: "Isuzu Cargo Crate Truck",
    status: "available", 
    rating: 4.95, 
    deliveries: 156,
    current_location: "Wandegeya"
  },
  { 
    id: "d2", 
    name: "Sarah Namubiru", 
    phone: "0755 333 444", 
    license: "UG-8821", 
    vehicle_registration: "UBL 482Y", // 👈 Shares UBL 482Y (Shared Shift!)
    vehicle_make: "Isuzu Cargo Crate Truck",
    status: "available", 
    rating: 4.85, 
    deliveries: 210,
    current_location: "Kampala Central"
  },
  { 
    id: "d3", 
    name: "John Okello", 
    phone: "0772 111 222", 
    license: "UG-5562", 
    vehicle_registration: "UAB 123X", 
    vehicle_make: "Toyota Hiace Crate Van",
    status: "busy", 
    rating: 4.90, 
    deliveries: 89,
    current_location: "Bukoto"
  },
  { 
    id: "d4", 
    name: "Peter Pan", 
    phone: "0788 666 555", 
    license: "UG-2231", 
    vehicle_registration: "UBC 778A", 
    vehicle_make: "Isuzu Elf Crate Truck",
    status: "offline", 
    rating: 4.50, 
    deliveries: 45,
    current_location: "N/A"
  },
];

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"drivers" | "vehicles">("drivers");

  // Filtering based on active directory selection
  const filteredDrivers = mockDrivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.vehicle_registration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = mockVehiles.filter(vehicle =>
    vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading tracking-tight">Driver & Fleet Management</h1>
            <p className="text-gray-500 font-body text-sm">Coordinate operational delivery personnel, registered vehicle assets, and shared shift mappings</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl text-xs px-4 h-11">
              <Plus size={16} />
              Register Vehicle
            </Button>
            <Button className="gap-2 bg-brand-mid hover:bg-brand-mid/90 text-white font-bold rounded-xl text-xs px-4 h-11">
              <Plus size={16} />
              Register New Driver
            </Button>
          </div>
        </div>

        {/* Directory Search & Directory Filter Toggle Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 py-2">
          
          {/* Dual Directory Tabs selector */}
          <div className="flex bg-brand-sage/20 p-1 rounded-xl self-start">
            <button 
              onClick={() => { setActiveDirectoryTab("drivers"); setSearchTerm(""); }}
              className={`px-5 py-2.5 rounded-lg font-black text-xs transition-all ${
                activeDirectoryTab === "drivers" 
                  ? "bg-brand-forest text-white shadow-sm" 
                  : "text-brand-forest hover:bg-brand-sage/35"
              }`}
            >
              Drivers Registry ({mockDrivers.length})
            </button>
            <button 
              onClick={() => { setActiveDirectoryTab("vehicles"); setSearchTerm(""); }}
              className={`px-5 py-2.5 rounded-lg font-black text-xs transition-all ${
                activeDirectoryTab === "vehicles" 
                  ? "bg-brand-forest text-white shadow-sm" 
                  : "text-brand-forest hover:bg-brand-sage/35"
              }`}
            >
              Registered Fleet ({mockVehiles.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-sm border border-brand-sage p-0.5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder={activeDirectoryTab === "drivers" ? "Search drivers, phone, vehicle plate..." : "Search vehicles by registration plate, model..."}
              className="pl-10 border-none focus-visible:ring-0 shadow-none h-10 text-xs font-semibold text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        </div>

        {/* 💻 DIRECTORY RENDERING VIEW */}
        {activeDirectoryTab === "drivers" ? (
          
          /* VIEW A: DRIVERS REGISTRY */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white rounded-2xl">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-5">
                      <div className="h-12 w-12 rounded-xl bg-brand-sage/30 flex items-center justify-center text-brand-forest shadow-inner">
                        <User size={24} />
                      </div>
                      <Badge variant={driver.status as any} className="capitalize font-bold text-[9px] px-2.5 py-0.5 border-none">
                        {driver.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-brand-forest font-heading">{driver.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                        <Phone size={12} className="text-gray-400" /> {driver.phone}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 py-3.5 border-y border-brand-sage/50 text-xs">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Vehicle</p>
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          <Truck size={12} className="text-brand-mid shrink-0" /> 
                          {driver.vehicle_registration}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold truncate max-w-full">{driver.vehicle_make}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Log</p>
                        <p className="text-xs font-bold text-gray-700">{driver.deliveries} total orders</p>
                        <span className="bg-brand-sage/20 text-brand-forest px-1 py-0.5 rounded text-[8px] font-bold">Verified Logs</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-brand-yellow">
                        <Star size={13} className="fill-brand-yellow text-brand-yellow" />
                        <span className="text-xs font-black text-gray-700">{driver.rating.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                        <MapPin size={11} className="text-brand-mid" />
                        {driver.current_location}
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-3.5 bg-brand-sage/10 text-brand-forest font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-brand-sage/30 transition-colors border-t border-brand-sage/30">
                    VIEW DRIVER SHIFT LOGS
                    <ChevronRight size={12} className="text-brand-forest group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

        ) : (

          /* VIEW B: VEHICLES FLEET REGISTRY */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white rounded-2xl">
                <CardContent className="p-0">
                  
                  {/* Premium top vehicle bar */}
                  <div className="bg-brand-forest/5 p-5 border-b border-brand-sage/30 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck size={18} className="text-brand-mid" />
                        <h3 className="font-heading font-black text-brand-forest text-base leading-tight">
                          {vehicle.registration_number}
                        </h3>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{vehicle.make} • {vehicle.model}</p>
                    </div>
                    <Badge className={`font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 border-none ${
                      vehicle.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-[#C47B00]"
                    }`}>
                      {vehicle.status}
                    </Badge>
                  </div>

                  <div className="p-6 space-y-5 text-xs">
                    
                    {/* Fuel & Load capacity sliders */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Crate Capacity</span>
                          <span className="font-mono font-bold text-gray-700">{vehicle.max_crates_capacity}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-mid h-full rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fuel Level</span>
                          <span className={`font-mono font-bold ${vehicle.fuel_level > 50 ? 'text-green-600' : 'text-amber-500'}`}>{vehicle.fuel_level}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${vehicle.fuel_level > 50 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${vehicle.fuel_level}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Shared Shift Driver mapping list */}
                    <div className="bg-brand-sage/10 p-4 rounded-xl border border-brand-sage/40 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-brand-forest font-black uppercase tracking-wider flex items-center gap-1">
                          <UserCheck size={12} className="text-brand-mid" />
                          Assigned Shift Drivers
                        </span>
                        <Badge className="bg-brand-forest text-white font-extrabold text-[8px] border-none px-1.5 rounded-md">
                          {vehicle.assigned_drivers.length} Drivers
                        </Badge>
                      </div>

                      {vehicle.assigned_drivers.length > 0 ? (
                        <div className="space-y-1.5">
                          {vehicle.assigned_drivers.map((driverName) => (
                            <div key={driverName} className="flex justify-between items-center text-[10px] text-gray-600 bg-white/70 px-2.5 py-1 rounded-md border border-brand-sage/20 font-bold">
                              <span>{driverName}</span>
                              <span className="text-[8px] text-green-600 font-extrabold flex items-center gap-0.5">
                                <span className="h-1 w-1 rounded-full bg-green-500" /> Active Shift
                              </span>
                            </div>
                          ))}
                          
                          {vehicle.assigned_drivers.length > 1 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-1.5 flex items-center gap-1.5 text-[8px] text-[#A66000] font-bold">
                              <AlertTriangle size={10} className="shrink-0" />
                              <span>Shared shift rotation active for this vehicle!</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 font-medium italic py-1">No driver assigned to this vehicle yet.</p>
                      )}
                    </div>

                  </div>

                  <button className="w-full py-3.5 bg-brand-forest/5 text-brand-forest font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-brand-forest/10 transition-colors border-t border-brand-sage/30">
                    MANAGE VEHICLE LOGISTICS
                    <ChevronRight size={12} className="text-brand-forest group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

        )}

      </div>
    </DashboardLayout>
  );
}

