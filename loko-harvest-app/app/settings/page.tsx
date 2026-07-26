"use client";

import React, { useState } from "react";
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Building, 
  Truck, 
  Save, 
  CheckCircle2, 
  Globe, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  CloudLightning,
  Sparkles
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/store/useAuth";
import api from "@/lib/api";


type TabType = "general" | "security" | "notifications" | "logistics";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // General Settings State
  const [companyName, setCompanyName] = useState("Loko Harvest Ltd");
  const [supportEmail, setSupportEmail] = useState("support@lokoharvest.com");
  const [currency, setCurrency] = useState("UGX");
  const [taxRate, setTaxRate] = useState("18");

  // User Profile details
  const [userName, setUserName] = useState(user?.name || "Administrator");
  const [userEmail, setUserEmail] = useState(user?.email || "admin@loko.com");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification Preferences
  const [prefTransfers, setPrefTransfers] = useState(true);
  const [prefDamages, setPrefDamages] = useState(true);
  const [prefStockAlerts, setPrefStockAlerts] = useState(true);
  const [prefDeliveries, setPrefDeliveries] = useState(true);
  const [prefPayments, setPrefPayments] = useState(true);

  // Logistics parameters
  const [baseDeliveryFee, setBaseDeliveryFee] = useState("15000");
  const [fuelAdjustmentFactor, setFuelAdjustmentFactor] = useState("1.2");

  React.useEffect(() => {
    async function loadNotificationPreferences() {
      try {
        const res = await api.get('/notification-preferences');
        if (res.data?.data) {
          const p = res.data.data;
          setPrefTransfers(p.channel_transfers ?? true);
          setPrefDamages(p.channel_damages ?? true);
          setPrefStockAlerts(p.channel_stock_alerts ?? true);
          setPrefDeliveries(p.channel_deliveries ?? true);
          setPrefPayments(p.channel_payments ?? true);
        }
      } catch (err) {
        console.error("Failed to fetch notification preferences:", err);
      }
    }
    loadNotificationPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (activeTab === "notifications") {
        await api.put('/notification-preferences', {
          channel_transfers: prefTransfers,
          channel_damages: prefDamages,
          channel_stock_alerts: prefStockAlerts,
          channel_deliveries: prefDeliveries,
          channel_payments: prefPayments,
        });
      }
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setIsLoading(false);
    }
  };


  const tabs = [
    { id: "general", label: "General & Profile", icon: Building },
    { id: "security", label: "Security & Access", icon: Lock },
    { id: "notifications", label: "Notification Rules", icon: Bell },
    { id: "logistics", label: "Logistics Config", icon: Truck },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">System Settings</h1>
            <p className="text-gray-500 font-body">Customize portal branding, security configurations and system parameters</p>
          </div>
          {isSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold animate-pulse shadow-sm">
              <CheckCircle2 size={16} />
              Settings updated successfully!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Tab Navigation Sidebar */}
          <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 bg-white p-2 rounded-xl shadow-sm border border-brand-sage md:w-full scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all w-full min-w-max md:min-w-0 ${
                    isActive 
                      ? "bg-brand-forest text-white shadow-sm" 
                      : "text-gray-600 hover:bg-brand-sage/20 hover:text-brand-forest"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Panels */}
          <div className="md:col-span-3 space-y-6">
            <form onSubmit={handleSave}>
              
              {/* GENERAL PREFERENCES TAB */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <Card className="border-none shadow-xl">
                    <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
                      <CardTitle className="text-lg font-heading text-brand-forest flex items-center gap-2">
                        <Building size={20} className="text-brand-mid" />
                        Branding & Company Settings
                      </CardTitle>
                      <CardDescription>Configure Loko Harvest tenant details and base regional formatting</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Company / Farm Name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                        <Input
                          label="System Support Email"
                          type="email"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Base Currency Code"
                          options={[
                            { label: "UGX - Ugandan Shilling", value: "UGX" },
                            { label: "KES - Kenyan Shilling", value: "KES" },
                            { label: "USD - US Dollar", value: "USD" }
                          ]}
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          required
                        />
                        <Input
                          label="VAT / Tax Rate (%)"
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-xl">
                    <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
                      <CardTitle className="text-lg font-heading text-brand-forest flex items-center gap-2">
                        <User size={20} className="text-brand-mid" />
                        Admin Profile Details
                      </CardTitle>
                      <CardDescription>Configure your personal profile details</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Your Full Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required
                        />
                        <Input
                          label="Your Email Address"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-500">
                        Profile Role assigned: <span className="font-bold capitalize text-brand-forest">{user?.role?.replace('_', ' ') || "System Administrator"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <Card className="border-none shadow-xl">
                  <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
                    <CardTitle className="text-lg font-heading text-brand-forest flex items-center gap-2">
                      <Lock size={20} className="text-brand-mid" />
                      Update Password & Credentials
                    </CardTitle>
                    <CardDescription>Keep your portal account protected with robust passwords</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    
                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="New Security Password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                      <Input
                        label="Confirm New Password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                    </div>

                    <div className="p-4 bg-amber-50/40 rounded-xl flex items-start gap-3 border border-amber-100/70">
                      <ShieldAlert className="text-brand-amber mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-xs text-brand-forest leading-relaxed">
                        <span className="font-bold">Password Security Recommendation:</span> Your password should be at least 8 characters long, incorporating capital letters, numbers, and symbols.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* NOTIFICATIONS PREFERENCES TAB */}
              {activeTab === "notifications" && (
                <Card className="border-none shadow-xl">
                  <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
                    <CardTitle className="text-lg font-heading text-brand-forest flex items-center gap-2">
                      <Bell size={20} className="text-brand-mid" />
                      Alert & Notification Rules
                    </CardTitle>
                    <CardDescription>Control when and how you receive alerts from Loko Harvest system actions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    
                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-forest">Store Transfer Requests & Approvals</p>
                          <p className="text-xs text-gray-500 max-w-md">Receive push and in-app notifications when store transfers are requested, approved, or rejected.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefTransfers}
                          onChange={(e) => setPrefTransfers(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-forest">Egg Damages & Breakage Reports</p>
                          <p className="text-xs text-gray-500 max-w-md">Receive alerts when managers log breakages or when admins audit and approve damage claims.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefDamages}
                          onChange={(e) => setPrefDamages(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-forest">Stock Safety Threshold Warnings</p>
                          <p className="text-xs text-gray-500 max-w-md">Trigger urgent warnings when Production or Sales Store egg trays drop below safety reorder limits.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefStockAlerts}
                          onChange={(e) => setPrefStockAlerts(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-forest">Logistics & Driver Delivery Updates</p>
                          <p className="text-xs text-gray-500 max-w-md">Receive alerts when driver shifts start, route assignments change, or deliveries are confirmed.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefDeliveries}
                          onChange={(e) => setPrefDeliveries(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-150">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-forest">Payment Postings & Invoice Receipts</p>
                          <p className="text-xs text-gray-500 max-w-md">Receive confirmations when customer payments are posted or invoices clear.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefPayments}
                          onChange={(e) => setPrefPayments(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest"
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )}

              {/* LOGISTICS CONFIG TAB */}
              {activeTab === "logistics" && (
                <Card className="border-none shadow-xl">
                  <CardHeader className="bg-brand-sage/20 border-b border-brand-sage">
                    <CardTitle className="text-lg font-heading text-brand-forest flex items-center gap-2">
                      <Truck size={20} className="text-brand-mid" />
                      Logistics & Fleet Constants
                    </CardTitle>
                    <CardDescription>Set base configurations for fleet cost estimates and routing calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Standard Base Delivery Fee (UGX)"
                        type="number"
                        value={baseDeliveryFee}
                        onChange={(e) => setBaseDeliveryFee(e.target.value)}
                        required
                      />
                      <Input
                        label="Fuel Price Adjustment Index"
                        type="number"
                        step="0.01"
                        value={fuelAdjustmentFactor}
                        onChange={(e) => setFuelAdjustmentFactor(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="p-4 bg-blue-50/30 rounded-xl flex items-start gap-3 border border-blue-150">
                      <CloudLightning className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-xs text-blue-900 leading-relaxed">
                        <span className="font-bold">Real-time GPS routing active:</span> Standard routing coordinates calculate trip distances from the main warehouse to client drop-off zones based on these fleet parameters.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  type="submit" 
                  className="bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-bold px-8 h-12 gap-2 shadow-md hover:scale-[1.02] border-none"
                  isLoading={isLoading}
                >
                  <Save size={18} />
                  Save Preferences
                </Button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
