"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Printer, 
  ShieldAlert, 
  Clock, 
  Truck, 
  FileText, 
  Loader2, 
  ExternalLink,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useToast } from "@/store/useToast";

interface OrderItem {
  id: string;
  order_number: string;
  customer?: { name: string; address?: string };
  total_amount?: number | string;
}

interface EmergencyQRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
  onPassGenerated?: () => void;
}

export function EmergencyQRGeneratorModal({
  isOpen,
  onClose,
  orders,
  onPassGenerated
}: EmergencyQRGeneratorModalProps) {
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(12);

  const [passData, setPassData] = useState<{
    id: string;
    pass_number: string;
    secure_token: string;
    qr_link: string;
    expires_at: string;
    status: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGeneratePass = async () => {
    if (orders.length === 0) {
      toast.error("Select at least 1 order to generate an emergency QR pass.");
      return;
    }

    setIsGenerating(true);
    try {
      const orderIds = orders.map(o => o.id);
      const res = await api.post("/emergency-passes/generate", {
        order_ids: orderIds,
        expires_in_hours: expiresInHours
      });

      if (res.data && res.data.data) {
        const pass = res.data.data.pass;
        // Always build full public link using current window origin to ensure smartphone cameras open the correct host
        const qrLink = `${window.location.origin}/driver/qr/${pass.secure_token}`;
        
        setPassData({
          id: pass.id,
          pass_number: pass.pass_number,
          secure_token: pass.secure_token,
          qr_link: qrLink,
          expires_at: pass.expires_at,
          status: pass.status
        });

        toast.success(`Emergency Pass Generated: ${pass.pass_number} is ready for rider scanning.`);
        if (onPassGenerated) onPassGenerated();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not generate emergency QR pass.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!passData) return;
    navigator.clipboard.writeText(passData.qr_link);
    setCopied(true);
    toast.success("Link Copied! Emergency dispatch link copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevokePass = async () => {
    if (!passData) return;
    if (!confirm(`Are you sure you want to revoke Delivery Pass ${passData.pass_number}?`)) return;

    setIsRevoking(true);
    try {
      await api.post(`/emergency-passes/${passData.id}/revoke`, { reason: "Revoked by Dispatch Manager" });
      toast.info(`Pass Revoked: ${passData.pass_number} has been deactivated.`);
      setPassData(null);
      if (onPassGenerated) onPassGenerated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not revoke pass.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-brand-sage/40 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-brand-forest text-white px-6 py-5 flex items-center justify-between border-b border-brand-sage/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center shrink-0 border border-brand-yellow/30">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg">Emergency Boda / External Rider Pass</h3>
              <p className="text-[11px] text-white/70">Assign guest rider delivery via scannable QR Code & Live GPS</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer border-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Selected Orders Summary */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-brand-forest tracking-wider flex items-center gap-1.5">
                <Truck size={14} className="text-brand-yellow" />
                Assigned Orders ({orders.length})
              </span>
              <Badge className="bg-brand-forest text-brand-yellow border-none text-[9px] font-black uppercase px-2 py-0.5">
                Batch Dispatch
              </Badge>
            </div>

            <div className="divide-y divide-gray-200/60 max-h-36 overflow-y-auto pr-1 space-y-2">
              {orders.map((ord, idx) => (
                <div key={ord.id || idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-brand-forest">{ord.order_number}</span>
                    <span className="text-gray-400 mx-1.5">•</span>
                    <span className="font-semibold text-gray-800">{ord.customer?.name || "Customer"}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-700 text-[11px]">
                    UGX {parseFloat(String(ord.total_amount || 0)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GENERATE STAGE */}
          {!passData ? (
            <div className="space-y-5 text-center py-2">
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                  <span>How Emergency QR Rider Dispatch Works:</span>
                </div>
                <ul className="text-[11px] text-amber-800 space-y-1 font-medium pl-6 list-disc">
                  <li>Generate a unique Delivery Pass QR Code for the selected {orders.length} order(s).</li>
                  <li>The boda rider scans the QR Code on their smartphone camera (no app/login required).</li>
                  <li>Rider enters Name & Phone, chooses Live Navigation or Take Stock Fulfillment.</li>
                  <li>Once marked delivered with signature & document photo, the QR Code automatically deactivates.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
                <span className="font-bold text-gray-700">QR Pass Expiration Duration:</span>
                <select 
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="bg-white border border-brand-sage rounded-xl px-3 py-1.5 font-bold text-brand-forest focus:outline-none text-xs"
                >
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours (Recommended)</option>
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                </select>
              </div>

              <Button
                onClick={handleGeneratePass}
                disabled={isGenerating}
                className="w-full bg-brand-forest hover:bg-emerald-900 text-white font-extrabold rounded-2xl h-12 text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Generating Delivery QR Pass...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} className="text-brand-yellow" />
                    <span>Generate Emergency Delivery QR Pass</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* DISPLAY GENERATED QR CODE STAGE */
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-200">
              
              {/* Human Code & Expiry Badge */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge className="bg-brand-forest text-brand-yellow text-xs font-black px-3 py-1 uppercase tracking-wider shadow-xs">
                  {passData.pass_number}
                </Badge>
                <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1">
                  <Clock size={12} className="inline mr-1" />
                  Expires: {(() => {
                    if (!passData.expires_at) return "N/A";
                    const expDate = new Date(passData.expires_at);
                    const now = new Date();
                    const diffMs = expDate.getTime() - now.getTime();
                    const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
                    const timeStr = expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const isToday = expDate.toDateString() === now.toDateString();
                    const tomorrow = new Date();
                    tomorrow.setDate(now.getDate() + 1);
                    const isTomorrow = expDate.toDateString() === tomorrow.toDateString();

                    let dayLabel = "";
                    if (isToday) dayLabel = "Today";
                    else if (isTomorrow) dayLabel = "Tomorrow";
                    else dayLabel = expDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                    return `${dayLabel} at ${timeStr} (${diffHours}h valid)`;
                  })()}
                </Badge>
              </div>

              {/* QR CODE CONTAINER */}
              <div className="bg-white p-6 rounded-3xl border-2 border-brand-sage/60 inline-block shadow-inner relative group">
                <QRCodeSVG
                  value={passData.qr_link}
                  size={210}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/icon.png",
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Scan with Smartphone Camera</p>
              </div>

              {/* Direct Share Link Box */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={passData.qr_link} 
                  className="w-full bg-transparent font-mono text-[11px] text-gray-700 font-bold focus:outline-none truncate"
                />
                <Button
                  onClick={handleCopyLink}
                  className="bg-brand-forest text-white hover:bg-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl border-none shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-brand-yellow" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handlePrintVoucher}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl h-11 text-xs border border-gray-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Print Delivery Voucher</span>
                </Button>

                <Button
                  onClick={handleRevokePass}
                  disabled={isRevoking}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-xl h-11 text-xs border border-red-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ban size={15} />
                  <span>{isRevoking ? "Revoking..." : "Revoke Pass"}</span>
                </Button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
