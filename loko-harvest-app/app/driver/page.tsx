"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LogOut,
  Bell,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  Gauge,
  Fuel,
  X,
  Map,
  ShieldCheck,
  AlertTriangle,
  User,
  Coffee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const DriverRouteMap = dynamic(() => import("@/components/DriverRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-brand-sage/10 rounded-2xl flex items-center justify-center animate-pulse text-xs text-gray-400">
      Loading Route Map...
    </div>
  ),
});

const mockAssignedDeliveries = [
  { id: "1", order: "LHO-0042", customer: "Shoprite Lugogo", zone: "Kampala Central", status: "pending", time: "10:00 AM", crates: 230, latitude: null, longitude: null },
  { id: "2", order: "LHO-0041", customer: "KFC Bukoto", zone: "Bukoto", status: "pending", time: "02:30 PM", crates: 60, latitude: null, longitude: null },
];

const mockAlerts = [
  { id: "1", title: "New Dispatch Assigned", message: "Vehicle UBL 482Y loaded and sealed by warehouse officer.", time: "15 mins ago", type: "dispatch" },
  { id: "2", title: "Route Optimization", message: "Use Kampala Central bypass to avoid traffic on Jinja Road.", time: "1 hour ago", type: "route" },
  { id: "3", title: "Gatepass Approved", message: "Gatepass LHO-0042 signed off by Supervisor Emma.", time: "2 hours ago", type: "system" },
];

const mockHistory = [
  { id: "h1", customer: "Shoprite Acacia", date: "Yesterday, 04:15 PM", crates: 150, status: "delivered", rating: 5.0 },
  { id: "h2", customer: "Mega Standard Downtown", date: "15 May 2026, 11:30 AM", crates: 90, status: "delivered", rating: 4.8 },
  { id: "h3", customer: "Carrefour Oasis Mall", date: "14 May 2026, 03:00 PM", crates: 120, status: "returned", rating: null },
];

export default function DriverDashboard() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "history" | "alerts">("home");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  interface AssignedDelivery {
    id: string;
    order: string;
    customer: string;
    zone: string;
    status: string;
    time: string;
    crates: number;
    latitude: number | null;
    longitude: number | null;
  }

  interface DashboardStats {
    driver_id: string;
    driver_name: string;
    avatar: string | null;
    rating: number;
    completed_today: number;
    total_today: number;
    pending_orders_count: number;
    pending_crates_sum: number;
    vehicle: {
      id: string | null;
      plate: string;
      make_model: string;
      max_capacity: number;
      fuel_level: number;
      supervisor_name: string;
      fuel_tank_capacity: number;
      consumption_per_km: number;
      added_fuel_per_shift: number;
    };
    assigned_route: AssignedDelivery[];
    performance: {
      fulfillment_rate: number;
      fulfillment_trend: string;
      fuel_economy: number;
      fuel_efficiency: number;
      quality_rate: number;
      damaged_crates_count: number;
      photo_compliance_rate: number;
      composite_score: number;
      league_class: string;
    };
  }

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get("/driver/dashboard");
        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch driver stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const [newFuelLevel, setNewFuelLevel] = useState<number>(85);
  const [isUpdatingFuel, setIsUpdatingFuel] = useState(false);

  useEffect(() => {
    if (stats?.vehicle) {
      setNewFuelLevel(stats.vehicle.fuel_level);
    }
  }, [stats]);

  const handleUpdateFuelLevel = async () => {
    if (!stats?.vehicle?.id) {
      alert("No vehicle associated with this driver to update.");
      return;
    }
    setIsUpdatingFuel(true);
    try {
      const response = await api.put(`/vehicles/${stats.vehicle.id}/logistics`, {
        fuel_level: newFuelLevel,
      });
      if (response.data?.success) {
        alert("Fuel level recorded successfully!");
        const statsRes = await api.get("/driver/dashboard");
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
      }
    } catch (error) {
      console.error("Failed to record fuel level:", error);
      alert("Failed to record current fuel level. Please try again.");
    } finally {
      setIsUpdatingFuel(false);
    }
  };

  const completionPercentage = stats
    ? stats.total_today > 0
      ? (stats.completed_today / stats.total_today) * 100
      : 0
    : 85;

  const fuelTankCapacity = stats?.vehicle?.fuel_tank_capacity ?? 80;
  const fuelLevel = stats?.vehicle?.fuel_level ?? 85;
  const consumptionPerKm = stats?.vehicle?.consumption_per_km ?? 0.12;
  const addedFuelPerShift = stats?.vehicle?.added_fuel_per_shift ?? 0;

  const currentLiters = (fuelLevel / 100) * fuelTankCapacity;
  const rangeLeftKm = consumptionPerKm > 0 ? (currentLiters / consumptionPerKm) : 0;

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col font-body pb-24 text-gray-800">
      
      {/* 🟢 TOP PREMIUM BRAND HEADER */}
      <header className={`bg-brand-forest text-white p-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0 ${loading ? "animate-pulse" : ""}`}>
        
        {/* Subtle Background Glow Details */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-brand-sage/10 blur-xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow font-black text-xl font-heading shadow-inner overflow-hidden">
              {stats?.avatar ? (
                <img src={stats.avatar} alt={stats.driver_name} className="h-full w-full object-cover" />
              ) : (
                stats ? stats.driver_name.charAt(0) : (user?.name?.charAt(0) || "M")
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">Fulfillment Driver</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-black font-heading leading-tight">{stats ? stats.driver_name : (user?.name || "Musa Driver")}</h2>
            </div>
          </div>

          <div className="flex gap-2.5">
            {/* System Rating Badge inside Header */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl text-[10px] text-brand-yellow font-black border border-brand-yellow/20 shadow-sm">
              <Star size={11} className="fill-brand-yellow text-brand-yellow" />
              {stats ? stats.rating.toFixed(2) : "4.95"} Rating
            </div>
            <button 
              onClick={handleLogout} 
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-red-300 hover:text-red-400 hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              title="Logout Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* 📊 DRIVER PERFORMANCE Radial/Progress Bar Overlay */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 shadow-lg relative z-10 text-xs">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Award className="text-brand-yellow" size={15} />
              <span className="font-extrabold text-white">Daily Route Completion</span>
            </div>
            <span className="font-mono font-bold text-brand-yellow">{stats ? `${stats.completed_today} / ${stats.total_today}` : "12 / 14"} Completed</span>
          </div>

          {/* Styled progress bar */}
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden shadow-inner flex mb-3">
            <div 
              className="bg-brand-yellow h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 divide-x divide-white/10 text-center">
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Pending Load</p>
              <p className="text-xl font-black font-heading text-white mt-0.5">{stats ? String(stats.pending_orders_count).padStart(2, '0') : "02"} Orders</p>
            </div>
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Verified Crates</p>
              <p className="text-xl font-black font-heading text-white mt-0.5">{stats ? stats.pending_crates_sum : "290"} Crates</p>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 TAB SWITCHER VIEW CONTAINER */}
      <main className="flex-1 p-6 -mt-4 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME PANEL */}
          {activeTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* CURRENT ROUTE PIPELINE LIST */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={16} className="text-brand-mid" />
                    Current Assigned Route
                  </h3>
                  <Badge className="bg-brand-sage/20 text-brand-forest border-none font-bold text-[10px] uppercase">
                    Active Shift
                  </Badge>
                </div>

                <div className="space-y-3.5">
                  {stats && stats.assigned_route.length > 0 ? (
                    stats.assigned_route.map((delivery, index) => (
                      <motion.div
                        key={delivery.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/driver/deliveries/${delivery.id}`}>
                          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-brand-sage flex items-center justify-between group active:scale-[0.98] transition-all">
                            <div className="flex gap-3.5">
                              <div className="h-11 w-11 rounded-xl bg-brand-sage/20 border border-brand-sage/30 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage/40 transition-colors">
                                <Package size={22} />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-brand-forest leading-tight group-hover:text-brand-mid transition-colors">{delivery.customer}</h4>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 font-medium">
                                  <MapPin size={11} className="text-brand-mid" />
                                  {delivery.zone}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="bg-brand-yellow/15 text-[#C47B00] font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-brand-yellow/20">{delivery.order}</span>
                                  <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                                    <Clock size={10} /> {delivery.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-brand-forest">
                              <span className="text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">Start</span>
                              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-forest transition-colors transform group-hover:translate-x-1 duration-200" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))
                  ) : loading ? (
                    <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400 animate-pulse">
                      <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold text-gray-500">Loading Active Route...</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400">
                      <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold text-gray-500">No Active Route Assigned</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Please check back later or contact supervisor.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 🛠️ SHIFT INTERACTIVE ACTION MODAL CARDS */}
              <div>
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gauge size={16} className="text-brand-mid" />
                  Shift Tools & Fleet
                </h3>
                <div className="grid grid-cols-2 gap-3.5">
                  
                  {/* Card A: Vehicle & Crates Info */}
                  <button 
                    onClick={() => setShowVehicleModal(true)}
                    className="bg-white border border-brand-sage rounded-2xl p-4.5 flex flex-col items-start text-left gap-3.5 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <Truck size={22} />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Plate: {stats ? stats.vehicle.plate : "UBL 482Y"}</span>
                      <h4 className="text-xs font-black text-brand-forest group-hover:text-brand-mid mt-0.5">Vehicle Loaded Specs</h4>
                    </div>
                  </button>

                  {/* Card B: Interactive Route Map */}
                  <button 
                    onClick={() => setShowMapModal(true)}
                    className="bg-white border border-brand-sage rounded-2xl p-4.5 flex flex-col items-start text-left gap-3.5 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <Map size={22} />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Zone Grid</span>
                      <h4 className="text-xs font-black text-brand-forest group-hover:text-brand-mid mt-0.5">Interactive Route Map</h4>
                    </div>
                  </button>

                </div>
              </div>

              {/* 🌟 LEAGUE DRIVER RATINGS / METRICS LEDGER */}
              <div className="bg-white rounded-2xl p-4.5 border border-brand-sage shadow-sm space-y-3.5">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-brand-yellow" />
                      Driver Analytics Ledger
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">System performance rating and averages</p>
                  </div>
                  <Badge className={
                    stats?.performance?.league_class === "Elite" ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-brand-forest font-black text-[9px] uppercase border-none" :
                    stats?.performance?.league_class === "Silver" ? "bg-slate-400 text-white font-bold text-[9px] uppercase border-none" :
                    stats?.performance?.league_class === "Bronze" ? "bg-amber-700 text-white font-bold text-[9px] uppercase border-none" :
                    "bg-green-600 text-white font-bold text-[9px] uppercase border-none"
                  }>
                    {stats ? `${stats.performance.league_class} Class` : "Gold Class"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* On-Time Fulfillment */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">On-Time Fulfillment</p>
                    <p className="text-lg font-black text-brand-forest mt-0.5 flex items-center gap-1 font-heading">
                      {stats ? `${stats.performance.fulfillment_rate}%` : "98.6%"}
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                        !(stats?.performance?.fulfillment_trend || "+1.2%").startsWith("-") ? "text-green-600" : "text-red-500"
                      }`}>
                        {!(stats?.performance?.fulfillment_trend || "+1.2%").startsWith("-") ? <TrendingUp size={10} /> : <span className="scale-y-[-1]"><TrendingUp size={10} /></span>}
                        {stats?.performance?.fulfillment_trend || "+1.2%"}
                      </span>
                    </p>
                  </div>

                  {/* Fuel Economy */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Average Fuel Economy</p>
                    <p className="text-lg font-black text-brand-forest mt-0.5 flex items-center gap-1 font-heading">
                      {stats ? `${stats.performance.fuel_economy.toFixed(2)} L/km` : "0.12 L/km"}
                      <Fuel size={12} className="text-brand-mid" />
                    </p>
                  </div>

                  {/* Photo Proof Compliance */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Photo Proof Compliance</p>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                          Fulfillment photo verification rate
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                        {stats ? `${stats.performance.photo_compliance_rate}%` : "98.0%"}
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Status Quality */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Fulfillment Status Quality</p>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                          {stats 
                            ? (stats.performance.damaged_crates_count === 0 ? "Zero damaged crates reported!" : `Only ${stats.performance.damaged_crates_count} damaged crates reported.`)
                            : "Zero damaged eggs reported this month!"}
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-black text-[10px]">
                        {stats ? `${stats.performance.quality_rate}%` : "100%"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: HISTORY PANEL */}
          {activeTab === "history" && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider">
                  Completed Shipments
                </h3>
                <span className="text-xs text-gray-400 font-bold">This Week</span>
              </div>

              {mockHistory.map((item) => (
                <div key={item.id} className="bg-white border border-brand-sage rounded-2xl p-4 shadow-sm flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-brand-forest text-sm leading-tight">{item.customer}</h4>
                      {item.status === "delivered" ? (
                        <span className="bg-green-100 text-green-700 font-bold text-[8px] uppercase px-1 rounded flex items-center gap-0.5">
                          <CheckCircle2 size={8} /> Delivered
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 font-bold text-[8px] uppercase px-1 rounded flex items-center gap-0.5">
                          <AlertTriangle size={8} /> Returned
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-[10px] font-semibold">{item.date}</p>
                    <p className="text-xs text-gray-600 font-bold">{item.crates} crates transferred</p>
                  </div>

                  {item.rating && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-lg text-amber-600 font-extrabold text-xs">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-brand-sage/10 rounded-2xl p-4 border border-brand-sage/30 text-center">
                <Coffee size={24} className="text-brand-forest mx-auto mb-2" />
                <p className="text-xs font-black text-brand-forest">You kept up a 99% Perfect Delivery Rate this week!</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Keep driving safely and keep your customers happy.</p>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ALERTS PANEL */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-3.5"
            >
              <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider mb-1">
                Operational Dispatch Notices
              </h3>

              {mockAlerts.map((alert) => (
                <div key={alert.id} className="bg-white border border-brand-sage rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
                  <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                    alert.type === "dispatch" ? "bg-green-50 text-green-600" :
                    alert.type === "route" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {alert.type === "dispatch" ? <ShieldCheck size={18} /> :
                     alert.type === "route" ? <MapPin size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-brand-forest text-xs">{alert.title}</h4>
                      <span className="text-[9px] text-gray-400 font-bold">{alert.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 🟢 FLOATING INTERACTIVE MODALS FOR TOOLS */}
      
      {/* A. VEHICLE DETAILS MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Crate Truck Specs</h3>
              </div>
              <button onClick={() => setShowVehicleModal(false)} className="text-brand-sage hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Plate Registration</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.plate : "UBL 482Y"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Vehicle Make</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.make_model : "Isuzu Cargo Crate"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Max Load Capacity</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.max_capacity : 500} Crates Max</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Fuel Level Status</p>
                  <p className="font-black text-green-600 text-sm mt-0.5 flex items-center gap-1">
                    {stats ? stats.vehicle.fuel_level : 85}% ({currentLiters.toFixed(1)} L)
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Consumption Rate</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{consumptionPerKm.toFixed(2)} L/km</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Operational Range</p>
                  <p className="font-black text-brand-forest text-sm mt-0.5">~{Math.round(rangeLeftKm)} km left</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Refueled Volume</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">+{addedFuelPerShift.toFixed(1)} L (shift)</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Tank Capacity</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{fuelTankCapacity} Liters</p>
                </div>
              </div>

              <div className="bg-brand-sage/5 p-3.5 rounded-xl border border-brand-sage/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Record Current Fuel Level</span>
                  <span className="font-mono font-black text-xs text-brand-forest">{newFuelLevel}% ({((newFuelLevel / 100) * fuelTankCapacity).toFixed(1)} L)</span>
                </div>
                <div className="flex gap-3 items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={newFuelLevel} 
                    onChange={(e) => setNewFuelLevel(parseInt(e.target.value))}
                    className="flex-1 accent-brand-forest h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                  />
                  <Button 
                    onClick={handleUpdateFuelLevel} 
                    disabled={isUpdatingFuel}
                    className="h-8 text-[10px] px-3 font-bold bg-brand-forest text-white rounded-lg cursor-pointer shrink-0"
                  >
                    {isUpdatingFuel ? "Saving..." : "Record"}
                  </Button>
                </div>
              </div>

              <div className="bg-brand-sage/10 p-3 rounded-xl border border-brand-sage/30 flex items-center gap-3">
                <ShieldCheck className="text-green-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-extrabold text-brand-forest text-[11px]">Cargo Gatepass Verified</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Verified & Sealed at Depot Gate by {stats ? stats.vehicle.supervisor_name : "Emma Supervisor"}.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-end">
              <Button onClick={() => setShowVehicleModal(false)} variant="primary" className="h-8 text-[11px] rounded-lg">
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* B. ROUTE MAP MODAL */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Map className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Assigned Route Plan</h3>
              </div>
              <button onClick={() => setShowMapModal(false)} className="text-brand-sage hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <DriverRouteMap 
                assignedRoute={stats?.assigned_route || []} 
                vehicleConsumption={stats?.vehicle?.consumption_per_km || 0.12}
              />
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-end">
              <Button onClick={() => setShowMapModal(false)} variant="primary" className="h-8 text-[11px] rounded-lg">
                Close Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 SAFE MOBILE BOTTOM INTERACTIVE NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-sage/60 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
        
        {/* TAB 1: HOME BUTTON */}
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "home" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Truck size={20} className={activeTab === "home" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Home</span>
          {activeTab === "home" && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 2: HISTORY BUTTON */}
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "history" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Clock size={20} className={activeTab === "history" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">History</span>
          {activeTab === "history" && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 3: ALERTS BUTTON */}
        <button 
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "alerts" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <div className="relative">
            <Bell size={20} className={activeTab === "alerts" ? "scale-110 text-brand-forest" : "text-gray-400"} />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-yellow rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="text-[9px] uppercase tracking-wider">Alerts</span>
          {activeTab === "alerts" && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-gray-400 hover:text-red-500 transition-all font-semibold"
        >
          <LogOut size={20} />
          <span className="text-[9px] uppercase tracking-wider">Logout</span>
        </button>

      </nav>
    </div>
  );
}

