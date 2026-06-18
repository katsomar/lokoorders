"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Search, 
  Truck, 
  Phone, 
  Star, 
  ChevronRight,
  Plus,
  MapPin,
  UserCheck,
  AlertTriangle,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"drivers" | "vehicles">("drivers");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get("/drivers"),
        api.get("/vehicles")
      ]);
      setDrivers(driversRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers or vehicles registry details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering based on active directory selection
  const filteredDrivers = drivers.filter(driver =>
    (driver.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone || "").includes(searchTerm) ||
    (driver.vehicle_registration || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.registration_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.model || "").toLowerCase().includes(searchTerm.toLowerCase())
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
              Drivers Registry ({isLoading ? "..." : drivers.length})
            </button>
            <button 
              onClick={() => { setActiveDirectoryTab("vehicles"); setSearchTerm(""); }}
              className={`px-5 py-2.5 rounded-lg font-black text-xs transition-all ${
                activeDirectoryTab === "vehicles" 
                  ? "bg-brand-forest text-white shadow-sm" 
                  : "text-brand-forest hover:bg-brand-sage/35"
              }`}
            >
              Registered Fleet ({isLoading ? "..." : vehicles.length})
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-bold gap-2">
            <Loader2 className="animate-spin text-brand-forest" size={32} />
            Loading drivers & fleet management registry...
          </div>
        ) : activeDirectoryTab === "drivers" ? (
          
          /* VIEW A: DRIVERS REGISTRY */
          filteredDrivers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body">
              No drivers found matching the search criteria.
            </div>
          ) : (
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
                          <span className="text-xs font-black text-gray-700">{(driver.rating || 0).toFixed(2)}</span>
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
          )

        ) : (

          /* VIEW B: VEHICLES FLEET REGISTRY */
          filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body">
              No vehicles found matching the search criteria.
            </div>
          ) : (
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
                            {(vehicle.assigned_drivers || []).length} Drivers
                          </Badge>
                        </div>

                        {(vehicle.assigned_drivers || []).length > 0 ? (
                          <div className="space-y-1.5">
                            {(vehicle.assigned_drivers || []).map((driverName: string) => (
                              <div key={driverName} className="flex justify-between items-center text-[10px] text-gray-600 bg-white/70 px-2.5 py-1 rounded-md border border-brand-sage/20 font-bold">
                                <span>{driverName}</span>
                                <span className="text-[8px] text-green-600 font-extrabold flex items-center gap-0.5">
                                  <span className="h-1 w-1 rounded-full bg-green-500" /> Active Shift
                                </span>
                              </div>
                            ))}
                            
                            {(vehicle.assigned_drivers || []).length > 1 && (
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
          )

        )}

      </div>
    </DashboardLayout>
  );
}
