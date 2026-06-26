"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Truck, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  Warehouse,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { group: "General", items: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  ]},
  { group: "Production & Sales", items: [
    { name: "Production Store", href: "/production-store", icon: Warehouse },
    { name: "Sales Store", href: "/sales-store", icon: ShoppingBag },
  ]},
  { group: "Orders & Customers", items: [
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Customers", href: "/customers", icon: Users },
  ]},
  { group: "Logistics", items: [
    { name: "Deliveries", href: "/deliveries", icon: Truck },
    { name: "Drivers", href: "/drivers", icon: Users },
  ]},
  { group: "Finance", items: [
    { name: "Invoices", href: "/invoices", icon: CreditCard },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Returns", href: "/returns", icon: ShoppingBag },
  ]},
  { group: "Analytics", items: [
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ]},
  { group: "System", items: [
    { name: "Users", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ]}
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();

  React.useEffect(() => {
    if (user && user.role === "order_manager") {
      router.push("/order-manager");
    }
  }, [user, router]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="relative z-20 flex flex-col bg-brand-forest text-white transition-all duration-300 ease-in-out"
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          {isSidebarOpen ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center"
            >
              <img 
                src="/logo/loko.png" 
                alt="Loko Harvest Logo" 
                className="h-9 w-auto object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center w-6 h-6"
            >
              <img 
                src="/logo/loko.png" 
                alt="Loko Harvest Logo" 
                className="h-6 w-auto object-contain"
              />
            </motion.div>
          )}
          <button onClick={toggleSidebar} className="text-white hover:text-brand-yellow shrink-0">
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {navItems
            .map((group) => ({
              ...group,
              items: group.items.filter(
                (item) => item.href !== "/users" || user?.role === "admin"
              ),
            }))
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.group} className="space-y-2">
              {isSidebarOpen && (
                <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-sage-300 opacity-50 font-heading">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all group ${
                        isActive 
                          ? "bg-white/10 text-brand-yellow border-l-4 border-brand-yellow" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon size={20} className={isActive ? "text-brand-yellow" : ""} />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                      {!isSidebarOpen && isActive && (
                         <div className="absolute left-0 w-1 h-6 bg-brand-yellow rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="h-16 bg-brand-forest border-b border-white/10 flex items-center justify-between px-8 z-10 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white font-heading tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
              {navItems.flatMap(g => g.items).find(i => i.href === pathname)?.name || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-white/80 hover:text-brand-yellow transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-extrabold text-brand-forest">
                3
              </span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none">{user?.name || "Admin User"}</p>
                <p className="text-xs text-brand-yellow/80 mt-1 capitalize font-medium">{user?.role?.replace('_', ' ') || "Administrator"}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-forest font-extrabold border border-white/20 shadow-inner">
                {user?.name?.charAt(0) || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
