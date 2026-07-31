"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Camera, 
  PenTool, 
  Navigation, 
  Loader2, 
  Package, 
  AlertTriangle,
  Radio,
  FileCheck,
  Zap,
  User,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";

interface PublicOrder {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  total_amount: number;
  items: {
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    subtotal: number;
  }[];
}

interface PublicPassData {
  pass_number: string;
  status: string;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_info: string | null;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  is_claimed: boolean;
  latest_location?: { latitude: number; longitude: number };
  orders: PublicOrder[];
}

export default function GuestEmergencyQRPassPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const rawToken = resolvedParams.token;
  const token = decodeURIComponent(rawToken).trim();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passData, setPassData] = useState<PublicPassData | null>(null);

  // Workflow view step: 'landing' | 'rider_form' | 'transit' | 'proof' | 'completed'
  const [viewStep, setViewStep] = useState<'landing' | 'rider_form' | 'transit' | 'proof' | 'completed'>('landing');
  const [isQuickLoadMode, setIsQuickLoadMode] = useState(false);

  // Rider Form State
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsTime, setLastGpsTime] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Fulfillment Proof Form State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmittingFulfill, setIsSubmittingFulfill] = useState(false);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1`;
    }
    return "https://178-104-85-160.sslip.io/api/v1";
  };

  const API_BASE = getApiBase();

  // Fetch Pass Data
  const fetchPassInfo = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API_BASE}/public/emergency-passes/${token}`);
      if (res.data && res.data.data) {
        const data: PublicPassData = res.data.data;
        setPassData(data);
        if (data.driver_name) setDriverName(data.driver_name);
        if (data.driver_phone) setDriverPhone(data.driver_phone);
        if (data.vehicle_info) setVehicleInfo(data.vehicle_info);

        if (data.status === "completed") {
          setViewStep('completed');
        } else if (data.status === "in_transit") {
          setViewStep('transit');
        } else if (data.is_claimed) {
          setViewStep('transit');
        } else {
          setViewStep('landing');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Invalid or deactivated emergency delivery pass token.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPassInfo();
  }, [token]);

  // Handle Geolocation Tracking in Transit
  useEffect(() => {
    if (viewStep === "transit" && passData?.is_claimed) {
      if ("geolocation" in navigator) {
        setIsGpsActive(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude, longitude, accuracy, speed, heading } = pos.coords;
            setLastGpsTime(new Date().toLocaleTimeString());
            try {
              await axios.post(`${API_BASE}/public/emergency-passes/${token}/track`, {
                latitude,
                longitude,
                accuracy,
                speed,
                heading
              });
            } catch (e) {
              console.error("GPS stream error:", e);
            }
          },
          (err) => {
            console.warn("GPS Geolocation warning:", err.message);
            setIsGpsActive(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsGpsActive(false);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [viewStep, passData?.is_claimed]);

  // Handle Rider Claim & Start Route
  const handleClaimAndStartRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone) {
      alert("Please enter your Full Name and Phone Contact.");
      return;
    }

    setIsSubmittingClaim(true);
    try {
      // 1. Claim Pass
      await axios.post(`${API_BASE}/public/emergency-passes/${token}/claim`, {
        driver_name: driverName,
        driver_phone: driverPhone,
        vehicle_info: vehicleInfo || "Emergency Boda"
      });

      // 2. Start Route if not quick load
      if (!isQuickLoadMode) {
        await axios.post(`${API_BASE}/public/emergency-passes/${token}/start-route`);
        setViewStep("transit");
      } else {
        setViewStep("proof");
      }
      await fetchPassInfo();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Claiming pass failed. It may have already been claimed.");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1A5C2A";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      setSignatureData(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const [proofImageData, setProofImageData] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setProofPreview(URL.createObjectURL(originalFile));

      // Compress photo to max 1280px width/height to keep upload payload under 500KB
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], originalFile.name || "voucher.jpg", { type: "image/jpeg" });
                setProofFile(compressedFile);
              } else {
                setProofFile(originalFile);
              }
            },
            "image/jpeg",
            0.75
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(originalFile);
    }
  };

  // Submit Final Proof
  const handleFulfillOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName) {
      alert("Please enter the Recipient Name.");
      return;
    }
    if (!proofFile) {
      alert("Please capture or upload a photo of the signed delivery document.");
      return;
    }
    if (!signatureData) {
      alert("Please collect the Recipient's Digital Signature.");
      return;
    }

    setIsSubmittingFulfill(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await submitProofApi(pos.coords.latitude, pos.coords.longitude);
      },
      async () => {
        await submitProofApi(0.3476, 32.5825);
      },
      { timeout: 5000 }
    );
  };

  const submitProofApi = async (lat: number, lng: number) => {
    try {
      const formData = new FormData();
      formData.append("recipient_name", recipientName.trim());
      if (recipientPhone && recipientPhone.trim()) {
        formData.append("recipient_phone", recipientPhone.trim());
      }
      formData.append("latitude", String(lat));
      formData.append("longitude", String(lng));
      if (notes && notes.trim()) {
        formData.append("notes", notes.trim());
      }
      if (proofFile) {
        formData.append("proof_image_file", proofFile);
      }
      if (signatureData) {
        formData.append("signature_data", signatureData);
      }

      await axios.post(`${API_BASE}/public/emergency-passes/${token}/complete`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setViewStep("completed");
      await fetchPassInfo();
    } catch (err: any) {
      const serverErr = err?.response?.data?.message || err?.response?.data?.error || "Delivery confirmation failed.";
      alert(serverErr);
    } finally {
      setIsSubmittingFulfill(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-brand-sage/40 text-center space-y-4 max-w-sm w-full">
          <Loader2 className="animate-spin text-brand-forest mx-auto" size={42} />
          <p className="text-sm font-extrabold text-brand-forest font-heading">Verifying Emergency Pass...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !passData) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-200 text-center space-y-4 max-w-md w-full">
          <AlertTriangle size={56} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-gray-900 font-heading">Pass Unavailable</h2>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">{errorMsg}</p>
          <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 font-mono">
            This QR delivery pass may have expired, been revoked, or completed.
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 5: FINAL THANK YOU & DEACTIVATED VOUCHER SCREEN
  if (viewStep === "completed" || passData.status === "completed") {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-emerald-300 text-center space-y-6 max-w-md w-full animate-in zoom-in-95 duration-200">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={44} />
          </div>
          <div>
            <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-3 py-1 uppercase tracking-wider mb-2">
              Pass Completed & Deactivated
            </Badge>
            <h2 className="text-2xl font-black text-brand-forest font-heading">Thank You for the Delivery!</h2>
            <p className="text-xs text-gray-600 font-semibold mt-1.5 leading-relaxed">
              The delivery run for pass <strong className="font-mono text-brand-forest">{passData.pass_number}</strong> was successfully completed.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase text-[9px]">Delivered By:</span>
              <span className="font-bold text-gray-900">{passData.driver_name || "Emergency Rider"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase text-[9px]">Orders Completed:</span>
              <span className="font-extrabold text-gray-900">{passData.orders.length} Order(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase text-[9px]">Timestamp:</span>
              <span className="font-mono text-emerald-800 font-bold">
                {passData.completed_at ? new Date(passData.completed_at).toLocaleTimeString() : "Just Now"}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Loko Harvest Logistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Top Mobile Bar */}
      <div className="bg-brand-forest text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand-yellow text-brand-forest flex items-center justify-center font-bold text-xs">
              LH
            </div>
            <div>
              <h1 className="text-sm font-black font-heading leading-none">Emergency Rider Pass</h1>
              <p className="text-[10px] text-white/70 font-mono mt-0.5">{passData.pass_number}</p>
            </div>
          </div>
          {isGpsActive && (
            <Badge className="bg-emerald-500 text-white text-[9px] font-extrabold uppercase animate-pulse border-none px-2 py-0.5 flex items-center gap-1">
              <Radio size={10} />
              GPS Active
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">

        {/* SCREEN 1: LANDING CHOICE SCREEN */}
        {viewStep === "landing" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Orders Summary Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-gray-50 py-3 px-4 border-b border-gray-200">
                <CardTitle className="text-xs font-bold text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} className="text-brand-yellow" />
                  Assigned Orders ({passData.orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-gray-100">
                {passData.orders.map((ord, idx) => (
                  <div key={ord.order_id || idx} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-black text-brand-forest text-xs">{ord.order_number}</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{ord.customer_name}</h4>
                      </div>
                      <a 
                        href={`tel:${ord.customer_phone}`}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 p-2 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-300 no-underline"
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-gray-600 font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                      <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{ord.delivery_address}</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-gray-700 font-medium pl-2 border-l-2 border-brand-sage/40 pt-1">
                      {ord.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex justify-between font-mono">
                          <span>• {item.product_name}</span>
                          <span className="font-bold text-brand-forest">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TWO MAIN ACTION BUTTONS */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-extrabold text-gray-800 text-center uppercase tracking-wider">Select Delivery Action:</p>

              {/* OPTION A: QUICK LOAD */}
              <Button
                onClick={() => {
                  setIsQuickLoadMode(true);
                  if (passData.is_claimed) {
                    setViewStep("proof");
                  } else {
                    setViewStep("rider_form");
                  }
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl h-14 text-sm shadow-md cursor-pointer flex items-center justify-between px-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                    <Zap size={22} />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-sm">⚡ Quick Load (Store Direct Drop)</span>
                    <span className="text-[10px] text-white/80 font-normal block">Instant Store Handover & Completion</span>
                  </div>
                </div>
              </Button>

              {/* OPTION B: START DELIVERY ROUTE */}
              <Button
                onClick={() => {
                  setIsQuickLoadMode(false);
                  if (passData.is_claimed) {
                    setViewStep("transit");
                  } else {
                    setViewStep("rider_form");
                  }
                }}
                className="w-full bg-brand-forest hover:bg-emerald-900 text-white font-black rounded-2xl h-14 text-sm shadow-md cursor-pointer flex items-center justify-between px-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center shrink-0">
                    <Navigation size={22} />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-sm">🟢 Start Delivery Route</span>
                    <span className="text-[10px] text-white/70 font-normal block">Register & Stream Live GPS Navigation</span>
                  </div>
                </div>
              </Button>
            </div>

          </div>
        )}

        {/* SCREEN 2: RIDER REGISTRATION FORM */}
        {viewStep === "rider_form" && (
          <Card className="border border-brand-sage/60 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in duration-200">
            <CardHeader className="bg-brand-forest text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={20} className="text-brand-yellow" />
                <div>
                  <CardTitle className="text-base font-black font-heading">Rider Registration</CardTitle>
                  <p className="text-xs text-white/70">Enter your rider details to claim this delivery run.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewStep("landing")}
                className="text-xs text-white/80 underline cursor-pointer"
              >
                Back
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleClaimAndStartRoute} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Your Full Name *</label>
                  <Input 
                    required 
                    value={driverName} 
                    onChange={(e) => setDriverName(e.target.value)} 
                    placeholder="E.g. Musisi John" 
                    className="h-11 rounded-xl font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Phone Contact Number *</label>
                  <Input 
                    required 
                    type="tel" 
                    value={driverPhone} 
                    onChange={(e) => setDriverPhone(e.target.value)} 
                    placeholder="E.g. 0781234567" 
                    className="h-11 rounded-xl font-mono text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Vehicle / Boda Registration Plate</label>
                  <Input 
                    value={vehicleInfo} 
                    onChange={(e) => setVehicleInfo(e.target.value)} 
                    placeholder="E.g. Boda UFG 482K" 
                    className="h-11 rounded-xl font-bold text-gray-900"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmittingClaim}
                  className="w-full bg-brand-forest hover:bg-emerald-900 text-white font-extrabold rounded-2xl h-13 text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmittingClaim ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Registering & Launching...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} className="text-brand-yellow" />
                      <span>{isQuickLoadMode ? "Confirm & Proceed to Handover" : "Confirm & Start Delivery Route"}</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* SCREEN 3: ACTIVE TRANSIT GPS SCREEN */}
        {viewStep === "transit" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Registered Rider Bar */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Active Rider:</span>
                <span className="text-sm font-black text-brand-forest">{passData.driver_name}</span>
                <span className="text-xs font-mono text-gray-600 block">{passData.driver_phone} • {passData.vehicle_info}</span>
              </div>
              <Badge className="bg-brand-forest text-brand-yellow border-none text-[9px] font-black uppercase">
                ON ROUTE
              </Badge>
            </div>

            {/* GPS Status Card */}
            <Card className="border border-brand-sage/60 bg-emerald-50/50 p-4 rounded-2xl text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-brand-forest font-extrabold text-sm">
                <Navigation size={18} className="animate-bounce text-brand-yellow" />
                <span>Delivery Route in Transit</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Live GPS tracking is streaming to Order Manager. Keep browser tab open.
              </p>
              {lastGpsTime && (
                <span className="text-[10px] text-emerald-800 font-mono font-bold block">
                  Last GPS Heartbeat: {lastGpsTime}
                </span>
              )}
            </Card>

            {/* Assigned Outlets List */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-gray-50 py-3 px-4 border-b border-gray-200">
                <CardTitle className="text-xs font-bold text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand-yellow" />
                  Destinations ({passData.orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-gray-100">
                {passData.orders.map((ord, idx) => (
                  <div key={ord.order_id || idx} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-black text-brand-forest text-xs">{ord.order_number}</span>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{ord.customer_name}</h4>
                      </div>
                      <a 
                        href={`tel:${ord.customer_phone}`}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 p-2 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-300 no-underline"
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-150 font-medium">
                      📍 {ord.delivery_address}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ACTION BUTTONS */}
            <Button
              onClick={() => setViewStep("proof")}
              className="w-full bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-black rounded-2xl h-13 text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>Arrived & Submit Delivery Proof</span>
            </Button>
          </div>
        )}

        {/* SCREEN 4: PROOF SUBMISSION SCREEN */}
        {viewStep === "proof" && (
          <Card className="border border-brand-sage/60 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in duration-200">
            <CardHeader className="bg-brand-forest text-white p-5 flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black font-heading">Complete Delivery Proof</CardTitle>
                <p className="text-xs text-white/70">Collect recipient signature and photo of signed delivery voucher.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewStep("landing")}
                className="text-xs text-white/80 underline cursor-pointer"
              >
                Back
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleFulfillOrder} className="space-y-5">
                
                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Recipient Name *</label>
                  <Input 
                    required 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    placeholder="Name of person receiving goods" 
                    className="h-11 rounded-xl font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Recipient Phone Number</label>
                  <Input 
                    type="tel" 
                    value={recipientPhone} 
                    onChange={(e) => setRecipientPhone(e.target.value)} 
                    placeholder="Recipient contact phone" 
                    className="h-11 rounded-xl font-mono text-gray-900 font-bold"
                  />
                </div>

                {/* PHOTO PROOF UPLOADER */}
                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1 flex items-center gap-1">
                    <Camera size={14} className="text-brand-forest" />
                    <span>Upload Signed Document Photo *</span>
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    id="document-photo-file"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {proofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-brand-sage/60 bg-gray-50 p-2 text-center">
                      <img src={proofPreview} alt="Proof preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                      <label 
                        htmlFor="document-photo-file"
                        className="mt-2 inline-block text-xs font-bold text-brand-forest underline cursor-pointer"
                      >
                        Retake Photo
                      </label>
                    </div>
                  ) : (
                    <label 
                      htmlFor="document-photo-file"
                      className="w-full border-2 border-dashed border-brand-sage/60 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center"
                    >
                      <Camera size={28} className="text-brand-forest mb-2" />
                      <span className="text-xs font-extrabold text-brand-forest">Tap to Take Photo of Signed Voucher</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 font-medium">Physical delivery note photo</span>
                    </label>
                  )}
                </div>

                {/* DIGITAL SIGNATURE CANVAS */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1">
                      <PenTool size={14} className="text-brand-forest" />
                      <span>Recipient Digital Signature *</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={clearCanvas} 
                      className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Signature
                    </button>
                  </div>
                  <div className="border-2 border-gray-300 rounded-2xl bg-white overflow-hidden touch-none shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 cursor-crosshair bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-gray-800 block mb-1">Delivery Notes / Comments</label>
                  <Input 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="E.g. Delivered all 500 trays cleanly" 
                    className="h-11 rounded-xl text-xs font-semibold text-gray-800"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmittingFulfill}
                  className="w-full bg-brand-forest hover:bg-emerald-900 text-white font-black rounded-2xl h-13 text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmittingFulfill ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Submitting Delivery Proof...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="text-brand-yellow" />
                      <span>Complete Order & Deactivate QR Pass</span>
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
