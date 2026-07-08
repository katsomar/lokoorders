"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Warehouse,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  User,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  Sliders,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

export default function PendingRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transfers" | "adjustments">("transfers");
  
  // Transfers state
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  
  // Adjustments state
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(true);
  
  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reject Modal state
  const [rejectingItem, setRejectingItem] = useState<{ id: string; type: "transfer" | "adjustment" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Lightbox modal state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const res = await api.get("/store-transfers", {
        params: { status: "pending", per_page: 100 }
      });
      setTransfers(res.data?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch pending transfers:", err);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const fetchAdjustments = async () => {
    setLoadingAdjustments(true);
    try {
      const res = await api.get("/store-adjustments", {
        params: { status: "pending", per_page: 100 }
      });
      setAdjustments(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch pending adjustments:", err);
    } finally {
      setLoadingAdjustments(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchAdjustments();
  }, []);

  const handleApproveTransfer = async (id: string) => {
    if (!confirm("Are you sure you want to approve this transfer? This will debit production stock and credit sales stock.")) return;
    setProcessingId(id);
    try {
      await api.post(`/store-transfers/${id}/approve`);
      alert("Transfer request approved successfully!");
      fetchTransfers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to approve transfer.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAdjustment = async (id: string) => {
    if (!confirm("Are you sure you want to approve this adjustment? This will adjust the stock accordingly.")) return;
    setProcessingId(id);
    try {
      await api.post(`/store-adjustments/${id}/approve`);
      alert("Adjustment request approved successfully!");
      fetchAdjustments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to approve adjustment.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id: string, type: "transfer" | "adjustment") => {
    setRejectingItem({ id, type });
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setRejectingItem(null);
    setRejectionReason("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    
    setProcessingId(rejectingItem.id);
    try {
      if (rejectingItem.type === "transfer") {
        await api.post(`/store-transfers/${rejectingItem.id}/reject`, {
          rejection_reason: rejectionReason
        });
        alert("Transfer request rejected successfully.");
        fetchTransfers();
      } else {
        await api.post(`/store-adjustments/${rejectingItem.id}/reject`, {
          rejection_reason: rejectionReason
        });
        alert("Adjustment request rejected successfully.");
        fetchAdjustments();
      }
      closeRejectModal();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 w-full max-w-[1500px] mx-auto p-3 md:p-5">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gradient-to-r from-brand-forest to-[#1A3D29] text-white py-4 px-5 rounded-xl shadow-md border border-brand-sage/20 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 opacity-[0.04] flex items-center justify-center pointer-events-none pr-8">
            <Sliders size={120} />
          </div>
          <div className="space-y-1 z-10">
            <h1 className="text-lg md:text-xl font-extrabold font-heading tracking-tight uppercase flex items-center gap-1.5">
              <Clock className="text-brand-yellow" size={18} />
              Pending Requests
            </h1>
            <p className="text-[11px] text-brand-sage font-medium max-w-xl">
              Authorize stock movements and inventory adjustments submitted by order managers and warehouse team members.
            </p>
          </div>
          <div className="flex gap-2 z-10">
            <button
              onClick={() => {
                fetchTransfers();
                fetchAdjustments();
              }}
              className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw size={12} className={loadingTransfers || loadingAdjustments ? "animate-spin" : ""} />
              Sync Lists
            </button>
          </div>
        </div>

        {/* Tab Switching Menu */}
        <div className="flex bg-[#F0F4F2] p-1 rounded-xl border border-brand-sage/20 max-w-xs shadow-inner">
          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "transfers"
                ? "bg-brand-forest text-white shadow-sm"
                : "text-brand-forest hover:bg-brand-sage/15"
            }`}
          >
            <ArrowRightLeft size={12} />
            Transfers ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab("adjustments")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "adjustments"
                ? "bg-brand-forest text-white shadow-sm"
                : "text-brand-forest hover:bg-brand-sage/15"
            }`}
          >
            <AlertTriangle size={12} />
            Adjustments ({adjustments.length})
          </button>
        </div>

        {/* Request Lists container */}
        <AnimatePresence mode="wait">
          {activeTab === "transfers" ? (
            <motion.div
              key="transfers-tab-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {loadingTransfers ? (
                <div className="bg-white rounded-xl border border-brand-sage/20 p-10 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-3 shadow-sm">
                  <RefreshCw className="animate-spin text-brand-mid" size={24} />
                  <span className="text-xs">Loading pending transfer requests...</span>
                </div>
              ) : transfers.length === 0 ? (
                <div className="bg-white rounded-xl border border-brand-sage/20 py-12 px-6 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-2 shadow-sm">
                  <CheckCircle2 className="text-green-500 animate-pulse" size={30} />
                  <span className="text-brand-forest text-xs font-extrabold mt-1">All Clear!</span>
                  <span className="text-[11px] text-gray-500 font-medium">No pending stock transfers require approval.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transfers.map((req) => (
                    <Card key={req.id} className="border border-brand-sage/35 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                      <div className="p-4 space-y-3">
                        {/* Title and Badge */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-brand-forest text-xs flex items-center gap-1.5 leading-snug">
                              {req.product?.name}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-bold font-mono tracking-wider">{req.product?.code}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-50 text-brand-amber rounded text-[8px] font-black uppercase tracking-wider border border-brand-yellow/30 shrink-0">
                            Pending
                          </span>
                        </div>

                        {/* Store Path Diagram */}
                        <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-150 flex items-center justify-between text-[10px] font-bold text-gray-800">
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">From</span>
                            <span>{req.production_store?.name}</span>
                          </div>
                          <ArrowRightLeft className="text-brand-mid shrink-0 mx-2" size={12} />
                          <div className="space-y-0.5 text-right">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">To</span>
                            <span>{req.sales_store?.name}</span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-50/30 p-2.5 rounded-lg border border-brand-sage/10">
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Quantity</span>
                            <span className="font-extrabold text-brand-forest">{parseFloat(req.quantity)} {req.product?.unit_of_measure}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Valuation Rate</span>
                            <span className="font-extrabold text-brand-forest">UGX {parseFloat(req.unit_price).toLocaleString()}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Batch Selection</span>
                            <span className={`font-extrabold font-mono ${req.batch_reference ? "text-brand-amber" : "text-brand-forest"}`}>
                              {req.batch_reference || "FIFO Auto Allocation"}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Date Requested</span>
                            <span className="font-semibold text-gray-600">{req.transfer_date}</span>
                          </div>
                        </div>

                        {/* Requester Info */}
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-brand-sage/15 text-[10px] font-semibold text-gray-600">
                          <User size={12} className="text-brand-mid shrink-0" />
                          <span>Submitted by: <strong>{req.user?.name || "Order Manager"}</strong></span>
                        </div>

                        {/* Internal Notes */}
                        {req.notes && (
                          <div className="p-2 bg-brand-sage/5 rounded-lg border border-brand-sage/20 text-[10px] text-gray-600 font-medium leading-relaxed">
                            <strong className="text-brand-forest">Notes:</strong> {req.notes}
                          </div>
                        )}
                      </div>

                      {/* Approval/Rejection Actions */}
                      <div className="flex border-t border-brand-sage/20 bg-gray-50/50 p-2 gap-2 rounded-b-xl">
                        <button
                          onClick={() => openRejectModal(req.id, "transfer")}
                          disabled={processingId !== null}
                          className="flex-1 h-8 border border-red-200 text-red-650 hover:bg-red-50 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer bg-white"
                        >
                          <X size={12} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveTransfer(req.id)}
                          disabled={processingId !== null}
                          className="flex-1 h-8 bg-brand-forest hover:bg-brand-forest/90 text-white disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer border-none"
                        >
                          {processingId === req.id ? (
                            <RefreshCw className="animate-spin" size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                          Approve
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="adjustments-tab-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {loadingAdjustments ? (
                <div className="bg-white rounded-xl border border-brand-sage/20 p-10 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-3 shadow-sm">
                  <RefreshCw className="animate-spin text-brand-mid" size={24} />
                  <span className="text-xs">Loading pending adjustment requests...</span>
                </div>
              ) : adjustments.length === 0 ? (
                <div className="bg-white rounded-xl border border-brand-sage/20 py-12 px-6 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-2 shadow-sm">
                  <CheckCircle2 className="text-green-500 animate-pulse" size={30} />
                  <span className="text-brand-forest text-xs font-extrabold mt-1">All Clear!</span>
                  <span className="text-[11px] text-gray-500 font-medium">No pending damages or stock adjustments require approval.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adjustments.map((req) => (
                    <Card key={req.id} className="border border-brand-sage/35 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                      <div className="p-4 space-y-3">
                        {/* Title and Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-brand-forest text-xs leading-snug">
                              {req.product?.name}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-bold font-mono tracking-wider">{req.product?.code}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[8px] font-black uppercase tracking-wider border border-red-100 shrink-0">
                            Adjustment
                          </span>
                        </div>

                        {/* Store Location */}
                        <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-150 flex items-center gap-1.5 text-[10px] font-bold text-gray-800">
                          <Warehouse className="text-brand-mid shrink-0" size={12} />
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Location Store</span>
                            <span>{req.store_type === 'production' ? req.production_store?.name : req.sales_store?.name}</span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-50/30 p-2.5 rounded-lg border border-brand-sage/10">
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Wastage Qty</span>
                            <span className="font-extrabold text-red-650">{Math.abs(parseFloat(req.quantity_change))} {req.product?.unit_of_measure}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Batch Reference</span>
                            <span className="font-extrabold font-mono text-brand-amber">
                              {req.batch_reference || "N/A"}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Requested Date</span>
                            <span className="font-semibold text-gray-650">{req.adjustment_date}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7px] text-gray-400 uppercase font-black block leading-none">Submitted by</span>
                            <span className="font-semibold text-gray-600">{req.creator?.name || "Order Manager"}</span>
                          </div>
                        </div>

                        {/* Reason / details */}
                        <div className="p-2.5 bg-red-50/20 rounded-lg border border-red-200/20 text-[10px] text-gray-700 font-semibold leading-relaxed">
                          <strong className="text-red-700 font-extrabold block mb-0.5">Issue:</strong>
                          {req.reason}
                        </div>

                        {/* Visual Proofs (Signature and Photo) */}
                        <div className="flex gap-3 pt-1.5 items-center border-t border-brand-sage/15">
                          {req.image_url && (
                            <div className="flex-1 space-y-1">
                              <span className="text-[7px] text-gray-450 font-black uppercase tracking-wider block leading-none">Photo Proof</span>
                              <div 
                                onClick={() => setLightboxUrl(req.image_url)}
                                className="border border-brand-sage/20 rounded-lg overflow-hidden bg-white p-1 hover:border-brand-mid transition-colors cursor-zoom-in max-h-16 flex justify-center items-center shadow-inner"
                              >
                                <img src={req.image_url} alt="Photo proof" className="max-h-12 object-contain rounded" />
                              </div>
                            </div>
                          )}
                          {req.signature_url && (
                            <div className="flex-1 space-y-1">
                              <span className="text-[7px] text-gray-450 font-black uppercase tracking-wider block leading-none">Signature</span>
                              <div 
                                onClick={() => setLightboxUrl(req.signature_url)}
                                className="border border-brand-sage/20 rounded-lg overflow-hidden bg-gray-50/50 p-1 hover:border-brand-mid transition-colors cursor-zoom-in max-h-16 flex justify-center items-center shadow-inner"
                              >
                                <img src={req.signature_url} alt="Signature" className="max-h-12 object-contain rounded bg-transparent" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Approval/Rejection Actions */}
                      <div className="flex border-t border-brand-sage/20 bg-gray-50/50 p-2 gap-2 rounded-b-xl">
                        <button
                          onClick={() => openRejectModal(req.id, "adjustment")}
                          disabled={processingId !== null}
                          className="flex-1 h-8 border border-red-200 text-red-650 hover:bg-red-50 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer bg-white"
                        >
                          <X size={12} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveAdjustment(req.id)}
                          disabled={processingId !== null}
                          className="flex-1 h-8 bg-brand-forest hover:bg-brand-forest/90 text-white disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer border-none"
                        >
                          {processingId === req.id ? (
                            <RefreshCw className="animate-spin" size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                          Approve
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rejection Modal */}
        <AnimatePresence>
          {rejectingItem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-brand-sage/20"
              >
                <div className="p-4 border-b border-brand-sage/15 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-extrabold text-brand-forest text-xs uppercase tracking-wider">Reject Request</h3>
                  <button onClick={closeRejectModal} className="p-1 rounded-full hover:bg-gray-250 transition-colors border-none cursor-pointer bg-transparent">
                    <X size={14} className="text-gray-450 hover:text-gray-650" />
                  </button>
                </div>
                <form onSubmit={handleRejectSubmit} className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Provide Rejection Reason *</label>
                    <textarea
                      required
                      placeholder="Explain why this request is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full min-h-[80px] p-2.5 text-xs font-medium rounded-lg border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeRejectModal}
                      className="flex-1 h-9 border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingId !== null}
                      className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer border-none"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Lightbox Photo View Modal */}
        <AnimatePresence>
          {lightboxUrl && (
            <div 
              onClick={() => setLightboxUrl(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            >
              <div className="relative max-w-3xl max-h-[85vh]">
                <button 
                  onClick={() => setLightboxUrl(null)} 
                  className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white border-none cursor-pointer bg-transparent"
                >
                  <X size={24} />
                </button>
                <img src={lightboxUrl} alt="Visual Proof Lightbox" className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10" />
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
