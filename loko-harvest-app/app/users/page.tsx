"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, 
  Check, 
  X, 
  Trash2, 
  Lock, 
  Unlock, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  Loader2,
  ShieldAlert
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import api from "@/lib/api";
import { useAuth } from "@/store/useAuth";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'store_manager' | 'sales_accounts' | 'driver' | 'production_manager';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  created_at: string;
}

type TabType = "pending" | "active" | "suspended" | "rejected";

export default function UsersManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "suspend" | "delete";
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    type: "approve",
    userId: "",
    userName: ""
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch user accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Access check: only admins can access this page
    if (currentUser && currentUser.role !== "admin") {
      // Redirect to their dashboard or driver control center
      if (currentUser.role === "driver") {
        router.push("/driver");
      } else {
        router.push("/dashboard/admin");
      }
    } else if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Clean success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-bold text-xs">
        <Loader2 className="animate-spin text-brand-forest mb-2" size={32} />
        Verifying user credentials...
      </div>
    );
  }

  // Double check client-side block for security UI
  if (currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full border border-red-100 shadow-lg text-center">
          <CardContent className="pt-6 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-sm text-gray-500">
              You do not have the required permissions to view this administration panel.
            </p>
            <Button 
              onClick={() => {
                if (currentUser.role === 'driver') {
                  router.push("/driver");
                } else {
                  router.push("/dashboard/admin");
                }
              }}
              className="w-full font-bold"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const triggerAction = (type: "approve" | "reject" | "suspend" | "delete", userId: string, userName: string) => {
    // If it's approve, we can run it directly or confirm. To protect from mistakes, we'll confirm rejects/suspends/deletes.
    if (type === "approve") {
      executeAction(type, userId);
    } else {
      setConfirmModal({
        isOpen: true,
        type,
        userId,
        userName
      });
    }
  };

  const executeAction = async (type: "approve" | "reject" | "suspend" | "delete", userId: string) => {
    setIsActionLoading(userId);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      let response;
      if (type === "approve") {
        response = await api.post(`/admin/users/${userId}/approve`);
      } else if (type === "reject") {
        response = await api.post(`/admin/users/${userId}/reject`);
      } else if (type === "suspend") {
        response = await api.post(`/admin/users/${userId}/suspend`);
      } else if (type === "delete") {
        response = await api.delete(`/admin/users/${userId}`);
      }

      if (response && response.data.success) {
        setSuccessMessage(response.data.message || `Action ${type} completed successfully.`);
        // Refresh local listings
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Operation failed. Please try again.`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "System Administrator";
      case "store_manager": return "Store Manager";
      case "sales_accounts": return "Sales & Accounts";
      case "driver": return "Fleet Driver";
      case "production_manager": return "Production Manager";
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "critical"; // red
      case "store_manager": return "dispatched"; // purple
      case "sales_accounts": return "processing"; // blue
      case "driver": return "ready"; // amber
      case "production_manager": return "delivered"; // green
      default: return "outline";
    }
  };

  // Filter users by current tab and search query
  const filteredUsers = users.filter(u => {
    // Tab filter
    if (u.status !== activeTab) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(query);
      const emailMatch = u.email.toLowerCase().includes(query);
      const phoneMatch = u.phone?.toLowerCase().includes(query) || false;
      const roleMatch = u.role.toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || roleMatch;
    }

    return true;
  });

  // Calculate counts for badges in tabs
  const getTabCount = (tab: TabType) => {
    return users.filter(u => u.status === tab).length;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-body relative">
        {/* Success / Error Banners */}
        {successMessage && (
          <div className="rounded-xl bg-green-50 p-4 border border-green-200 text-green-700 font-semibold text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="hover:text-green-900 font-bold text-xs cursor-pointer">Dismiss</button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 font-semibold text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:text-red-900 font-bold text-xs cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Action Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-brand-sage rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${
                  confirmModal.type === 'delete' ? 'bg-red-50 text-red-600 border border-red-100' :
                  confirmModal.type === 'reject' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">
                    {confirmModal.type === "delete" ? "Delete User Account" :
                     confirmModal.type === "reject" ? "Reject Signup Request" :
                     "Suspend Staff User"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    Are you sure you want to {confirmModal.type} **{confirmModal.userName}**?
                    {confirmModal.type === "delete" && " This action is permanent and cannot be undone."}
                    {confirmModal.type === "suspend" && " The user will be instantly locked out and unable to log in until re-activated."}
                    {confirmModal.type === "reject" && " Their signup request will be rejected and login denied."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="font-bold text-xs h-9"
                >
                  Cancel
                </Button>
                <Button 
                  variant={confirmModal.type === "delete" || confirmModal.type === "reject" ? "danger" : "primary"}
                  onClick={() => executeAction(confirmModal.type, confirmModal.userId)}
                  className="font-bold text-xs h-9 bg-brand-amber hover:bg-brand-amber/90"
                  style={confirmModal.type === 'delete' || confirmModal.type === 'reject' ? {backgroundColor: '#DC2626'} : {backgroundColor: '#D97706'}}
                >
                  Confirm Action
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading">User Account Management</h1>
            <p className="text-gray-500 text-xs mt-1">Approve signup requests, suspend/delete staff, or view user records</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9.5 w-full rounded-xl border border-brand-sage/60 bg-white text-xs placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest transition-shadow"
              />
            </div>
            
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              className="h-9.5 px-3 border-brand-sage/60 bg-white rounded-xl gap-1.5 shadow-sm text-xs font-bold"
              isLoading={isLoading}
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              Refresh list
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-brand-sage/80 gap-1.5 pt-2">
          {(["pending", "active", "suspended", "rejected"] as TabType[]).map((tab) => {
            const count = getTabCount(tab);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-xs font-bold font-heading rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? "bg-white text-brand-forest border-t border-x border-brand-sage/80 -mb-[1px] shadow-[0_-2px_6px_-2px_rgba(0,0,0,0.02)]" 
                    : "text-gray-400 hover:text-brand-forest hover:bg-brand-sage/20"
                }`}
              >
                <span className="capitalize">{tab === "active" ? "Active Staff" : tab === "pending" ? "Pending Requests" : tab}</span>
                <span className={`h-4.5 px-1.5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                  isActive ? 
                    (tab === "pending" ? "bg-amber-100 text-amber-700" :
                     tab === "active" ? "bg-green-100 text-green-700" :
                     tab === "suspended" ? "bg-red-100 text-red-700" :
                     "bg-gray-100 text-gray-700") : 
                    "bg-gray-200/50 text-gray-500"
                }`}>
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-forest" />
                )}
              </button>
            );
          })}
        </div>

        {/* Users Table / List */}
        <Card className="border border-brand-sage/40 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs text-gray-400 font-bold">
                <Loader2 className="animate-spin text-brand-forest" size={32} />
                Loading registered user accounts...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-brand-sage/25 flex items-center justify-center text-brand-mid">
                  <Users size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">No users found</h3>
                  <p className="text-xs text-gray-400 max-w-xs px-4">
                    {searchQuery 
                      ? `No staff members matching "${searchQuery}" under ${activeTab}.` 
                      : `There are currently no staff accounts with "${activeTab}" status.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Details</TableHead>
                    <TableHead>Operational Role</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userRecord) => (
                    <TableRow key={userRecord.id} className="hover:bg-brand-sage/5">
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-sage text-brand-forest font-extrabold text-sm flex items-center justify-center shrink-0 shadow-inner">
                            {userRecord.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{userRecord.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{userRecord.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3.5">
                        <Badge variant={getRoleBadgeVariant(userRecord.role)}>
                          {getRoleLabel(userRecord.role)}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-gray-500 font-medium">
                        {userRecord.phone || "Not provided"}
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-gray-500 font-medium">
                        {formatDate(userRecord.created_at)}
                      </TableCell>

                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {userRecord.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm"
                                onClick={() => triggerAction("approve", userRecord.id, userRecord.name)}
                                isLoading={isActionLoading === userRecord.id}
                              >
                                <Check size={13} />
                                Approve
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg shrink-0 flex items-center gap-1.5"
                                onClick={() => triggerAction("reject", userRecord.id, userRecord.name)}
                                disabled={isActionLoading === userRecord.id}
                              >
                                <X size={13} />
                                Reject
                              </Button>
                            </>
                          )}

                          {userRecord.status === "active" && (
                            <>
                              {userRecord.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[11px] font-bold text-amber-600 border-amber-200 hover:bg-amber-50 rounded-lg shrink-0 flex items-center gap-1.5"
                                  onClick={() => triggerAction("suspend", userRecord.id, userRecord.name)}
                                  disabled={isActionLoading === userRecord.id}
                                >
                                  <Lock size={13} />
                                  Suspend
                                </Button>
                              )}
                              
                              {userRecord.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 rounded-lg shrink-0 flex items-center justify-center hover:bg-red-50"
                                  onClick={() => triggerAction("delete", userRecord.id, userRecord.name)}
                                  disabled={isActionLoading === userRecord.id}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </>
                          )}

                          {userRecord.status === "suspended" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm"
                                onClick={() => triggerAction("approve", userRecord.id, userRecord.name)}
                                isLoading={isActionLoading === userRecord.id}
                              >
                                <Unlock size={13} />
                                Activate
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 rounded-lg shrink-0 flex items-center justify-center hover:bg-red-50"
                                onClick={() => triggerAction("delete", userRecord.id, userRecord.name)}
                                disabled={isActionLoading === userRecord.id}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}

                          {userRecord.status === "rejected" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm"
                                onClick={() => triggerAction("approve", userRecord.id, userRecord.name)}
                                isLoading={isActionLoading === userRecord.id}
                              >
                                <Unlock size={13} />
                                Activate
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 rounded-lg shrink-0 flex items-center justify-center hover:bg-red-50"
                                onClick={() => triggerAction("delete", userRecord.id, userRecord.name)}
                                disabled={isActionLoading === userRecord.id}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
