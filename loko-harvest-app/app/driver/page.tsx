"use client";

import React from "react";
import Link from "next/link";
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LogOut,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { Badge } from "@/components/ui/badge";

const mockAssignedDeliveries = [
  { id: "1", order: "LHO-0042", customer: "Shoprite Lugogo", zone: "Kampala Central", status: "pending" },
  { id: "2", order: "LHO-0041", customer: "KFC Bukoto", zone: "Bukoto", status: "pending" },
];

export default function DriverDashboard() {
  const { user, clearAuth } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-body pb-20">
      {/* Mobile Top Bar */}
      <header className="bg-brand-forest text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-yellow font-bold text-xl">
              {user?.name?.charAt(0) || "D"}
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Driver</p>
              <h2 className="text-lg font-bold font-heading">{user?.name || "Musa Driver"}</h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 bg-brand-yellow rounded-full" />
            </button>
            <button onClick={clearAuth} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-red-300">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-[10px] font-bold uppercase">Pending</p>
            <p className="text-2xl font-bold font-heading mt-1">05</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-[10px] font-bold uppercase">Delivered</p>
            <p className="text-2xl font-bold font-heading mt-1">12</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 -mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-forest font-heading">Current Route</h3>
          <Link href="/driver/deliveries" className="text-xs font-bold text-brand-mid uppercase tracking-wider">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {mockAssignedDeliveries.map((delivery, index) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/driver/deliveries/${delivery.id}`}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage flex items-center justify-between group active:scale-[0.98] transition-transform">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-brand-sage/50 flex items-center justify-center text-brand-forest">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-forest">{delivery.customer}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin size={12} className="text-brand-mid" />
                        {delivery.zone}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="pending" className="text-[10px] py-0">{delivery.order}</Badge>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={10} /> 20 mins away
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-forest transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Action Quick Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="bg-brand-sage/20 border border-brand-sage rounded-2xl p-6 flex flex-col items-center gap-3 text-brand-forest hover:bg-brand-sage/40 transition-colors">
            <Truck size={32} />
            <span className="text-sm font-bold font-heading">Vehicle Info</span>
          </button>
          <button className="bg-brand-sage/20 border border-brand-sage rounded-2xl p-6 flex flex-col items-center gap-3 text-brand-forest hover:bg-brand-sage/40 transition-colors">
            <MapPin size={32} />
            <span className="text-sm font-bold font-heading">Route Map</span>
          </button>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-sage px-8 py-4 flex justify-between items-center z-50">
        <button className="text-brand-forest flex flex-col items-center gap-1">
          <Truck size={24} />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button className="text-gray-300 flex flex-col items-center gap-1">
          <Clock size={24} />
          <span className="text-[10px] font-bold uppercase">History</span>
        </button>
        <button className="text-gray-300 flex flex-col items-center gap-1">
          <Bell size={24} />
          <span className="text-[10px] font-bold uppercase">Alerts</span>
        </button>
        <button className="text-gray-300 flex flex-col items-center gap-1">
          <LogOut size={24} />
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
}
