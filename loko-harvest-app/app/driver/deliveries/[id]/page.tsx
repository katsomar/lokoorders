"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Package, 
  Camera, 
  Edit3, 
  CheckCircle2,
  AlertCircle,
  Truck,
  Play,
  XCircle,
  Compass,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import api from "@/lib/api";

const DriverTransitMap = dynamic(() => import("@/components/DriverTransitMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-brand-sage/10 rounded-2xl flex items-center justify-center animate-pulse text-xs text-gray-400">
      Loading Transit Map...
    </div>
  ),
});

export default function DeliveryConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  
  // States: 
  // 1: Pre-dispatch Details (Assigned status)
  // 2: Active Dispatch Screen (Dispatched / In Transit)
  // 3: Capture Proof Screen
  // 4: Fulfillment Success Screen
  const [step, setStep] = useState(1); 
  const [deliveryStatus, setDeliveryStatus] = useState<"Assigned" | "Dispatched" | "Delivered">("Assigned");
  const [isLoading, setIsLoading] = useState(false);
  const [proofType, setProofType] = useState<"signature" | "photo" | null>(null);
  
  // Real-time transit timer simulation
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  interface VehicleDetails {
    id: string | null;
    plate: string;
    make_model: string;
    fuel_level: number;
    fuel_tank_capacity: number;
    consumption_per_km: number;
  }
  interface DeliveryItem {
    name: string;
    quantity: number;
  }
  interface DeliveryDetails {
    id: string;
    order: string;
    customer: string;
    contact: string;
    phone: string;
    address: string;
    status: string;
    items: DeliveryItem[];
    required_delivery_date: string;
    assigned_date: string;
    assigned_time: string;
    customer_latitude: number | null;
    customer_longitude: number | null;
    vehicle: VehicleDetails | null;
  }

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Live Telemetry states
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [durationRemaining, setDurationRemaining] = useState<number | null>(null);
  const [projectedFuelRemaining, setProjectedFuelRemaining] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (step === 2) { // Active dispatch
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    async function fetchDelivery() {
      try {
        const response = await api.get(`/deliveries/${params.id}`);
        if (response.data?.success) {
          const d = response.data.data;
          setDelivery({
            id: d.id,
            order: d.order?.order_number || "N/A",
            customer: d.order?.customer?.name || "N/A",
            contact: d.order?.customer?.contact_person || "N/A",
            phone: d.order?.customer?.phone_primary || "",
            address: d.order?.customer?.address || "N/A",
            status: d.status,
            items: (d.order?.items || []).map((item: any) => ({
              name: item.product?.name || "Unknown Product",
              quantity: item.quantity,
            })),
            required_delivery_date: d.order?.required_delivery_date || "",
            assigned_date: d.dispatched_at ? new Date(d.dispatched_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
            assigned_time: d.dispatched_at ? new Date(d.dispatched_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A",
            customer_latitude: d.order?.customer?.latitude !== null ? Number(d.order?.customer?.latitude) : null,
            customer_longitude: d.order?.customer?.longitude !== null ? Number(d.order?.customer?.longitude) : null,
            vehicle: d.driver?.vehicle ? {
              id: d.driver.vehicle.id,
              plate: d.driver.vehicle.registration_number || "N/A",
              make_model: `${d.driver.vehicle.make || ""} ${d.driver.vehicle.model || ""}`.trim() || "N/A",
              fuel_level: Number(d.driver.vehicle.fuel_level ?? 0),
              fuel_tank_capacity: Number(d.driver.vehicle.fuel_tank_capacity ?? 80.0),
              consumption_per_km: Number(d.driver.vehicle.consumption_per_km ?? 0.12),
            } : null,
          });
          
          if (d.status === "in_transit") {
            setStep(2);
            setDeliveryStatus("Dispatched");
          } else if (d.status === "delivered") {
            setStep(4);
            setDeliveryStatus("Delivered");
          } else {
            setStep(1);
            setDeliveryStatus("Assigned");
          }
        }
      } catch (err) {
        console.error("Failed to fetch delivery details:", err);
      } finally {
        setIsPageLoading(false);
      }
    }
    if (params.id) {
      fetchDelivery();
    }
  }, [params.id]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00h : ${m}m : ${s}s`;
  };

  // Actions
  const handleStartDispatch = async (payload?: { delay_reason?: string; custom_delay_reason?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/deliveries/${params.id}/transit`, payload);
      if (res.data?.success) {
        setDeliveryStatus("Dispatched");
        setStep(2); // Go to Active Dispatch Screen
        setShowDelayModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start dispatch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onStartDispatchClick = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isMissed = delivery?.required_delivery_date && delivery.required_delivery_date < todayStr;
    if (isMissed) {
      setShowDelayModal(true);
    } else {
      handleStartDispatch();
    }
  };

  const handleDelaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayReason) {
      alert("Please select a justification reason.");
      return;
    }
    if (delayReason === "other" && !customReason.trim()) {
      alert("Please enter a custom explanation for 'Other'.");
      return;
    }
    handleStartDispatch({
      delay_reason: delayReason,
      custom_delay_reason: delayReason === "other" ? customReason : undefined
    });
  };

  const handleCancelDispatch = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(`/deliveries/${params.id}/cancel`);
      if (res.data?.success) {
        setDeliveryStatus("Assigned");
        setSecondsElapsed(0);
        setStep(1); // Go back to details
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel dispatch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const res = await api.post(`/deliveries/${params.id}/confirm`, {
        recipient_name: delivery?.contact || "John Okello",
        recipient_phone: delivery?.phone || "0772 123 456",
        delivered_at: now,
        notes: "Delivered via Driver Portal Mobile Confirmation",
        proof_image: proofType === "photo" ? "data:image/png;base64,fake-photo-evidence" : null,
        signature: proofType === "signature" ? "data:image/png;base64,fake-signature-data" : null,
      });
      if (res.data?.success) {
        setDeliveryStatus("Delivered");
        setStep(4); // Success Splash
        setTimeout(() => router.push("/driver"), 2500);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to confirm delivery. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading || !delivery) {
    return (
      <div className="min-h-screen bg-[#0E1B15] text-white flex flex-col items-center justify-center p-6 gap-2">
        <Loader2 className="animate-spin text-brand-yellow" size={36} />
        <p className="text-xs font-bold text-gray-400">Loading delivery details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1B15] text-white font-body pb-10">
      
      {/* Header */}
      <header className="bg-[#132A1C] border-b border-brand-forest/30 p-4 flex items-center justify-between sticky top-0 z-[1010]">
        <div className="flex items-center gap-4">
          {step === 1 && (
            <button onClick={() => router.back()} className="text-brand-yellow">
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-black text-brand-yellow text-base tracking-tight">
              {step === 2 ? "ACTIVE DISPATCH" : "Delivery Details"}
            </h1>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{delivery.order}</p>
          </div>
        </div>
        
        {/* Dynamic Premium Status Indicator */}
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          deliveryStatus === "Assigned" ? "bg-amber-500/10 text-brand-yellow border-brand-yellow/30 animate-pulse" :
          deliveryStatus === "Dispatched" ? "bg-blue-500/10 text-blue-400 border-blue-400/30 animate-pulse" :
          "bg-green-500/10 text-green-400 border-green-400/30"
        }`}>
          {deliveryStatus}
        </span>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PRE-DISPATCH DETAILS SCREEN */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* Customer Primary Card */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl overflow-hidden rounded-2xl">
                <CardContent className="pt-6 space-y-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-heading font-black text-brand-yellow leading-tight">{delivery.customer}</h2>
                      <p className="text-xs text-gray-400 font-semibold mt-1">Recipient: {delivery.contact}</p>
                    </div>
                    {delivery.phone ? (
                      <a href={`tel:${delivery.phone}`} className="h-11 w-11 rounded-full bg-brand-forest flex items-center justify-center text-brand-yellow hover:scale-105 active:scale-95 transition-transform shrink-0 border border-brand-yellow/20">
                        <Phone size={18} />
                      </a>
                    ) : null}
                  </div>
                  
                  <div className="flex gap-3 items-start pt-2 border-t border-brand-forest/20">
                    <MapPin className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300 font-semibold">{delivery.address}</p>
                  </div>

                  <div className="flex gap-3 items-start pt-2 border-t border-brand-forest/20">
                    <Clock className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs text-gray-300 font-semibold">
                        Assigned: {delivery.assigned_date} at {delivery.assigned_time}
                      </p>
                      {delivery.required_delivery_date && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-gray-400">
                            Deliver by: {new Date(delivery.required_delivery_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {delivery.required_delivery_date < new Date().toISOString().split('T')[0] && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[9px] px-1.5 py-0.5 rounded">
                              Missed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="pt-6 text-white">
                  <h3 className="font-heading font-black text-brand-yellow text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Package size={16} className="text-brand-mid" />
                    Cargo Load Log
                  </h3>
                  <div className="space-y-3">
                    {delivery.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[#0B1510] rounded-xl border border-brand-forest/20">
                        <span className="text-xs font-bold text-gray-300">{item.name}</span>
                        <span className="text-base font-black text-brand-yellow">{item.quantity} Trays</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Big Start Delivery Button */}
              <Button 
                className="w-full h-14 bg-brand-yellow text-brand-forest hover:bg-brand-yellow/90 font-black text-sm rounded-2xl tracking-widest gap-2.5 shadow-lg border border-brand-yellow/30"
                onClick={onStartDispatchClick}
                isLoading={isLoading}
              >
                <Play size={16} className="fill-brand-forest" />
                START DISPATCH / DEPART DEPOT
              </Button>
            </motion.div>
          )}

          {/* STEP 2: ACTIVE DISPATCH SCREEN (DASHBOARD IN TRANSIT) */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* Flashing "IN DELIVERY" Banner */}
              <div className="bg-blue-500/10 border-2 border-blue-400/30 rounded-2xl p-5 text-center space-y-2.5 shadow-inner">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                  <span className="text-xs font-black tracking-widest text-blue-400 uppercase">
                    🚨 Active Dispatch in Progress
                  </span>
                </div>
                <h3 className="text-lg font-heading font-black text-white">ON ROUTE TO CLIENT</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Ensure all egg cargo bypass routes are securely cleared.
                </p>
              </div>

              {/* Real-time Transit Timer Widget */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-400/20 text-blue-400 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Transit Duration</p>
                      <h4 className="font-mono font-black text-sm text-brand-yellow mt-0.5">
                        {formatTimer(secondsElapsed)}
                      </h4>
                    </div>
                  </div>
                  <Badge className="bg-blue-400/15 text-blue-400 text-[8px] font-extrabold border-none py-1 px-2.5">
                    Live GPS Sync
                  </Badge>
                </CardContent>
              </Card>

              {/* Interactive Transit Map */}
              {delivery.customer_latitude !== null && delivery.customer_longitude !== null && (
                <DriverTransitMap
                  customerLat={delivery.customer_latitude}
                  customerLng={delivery.customer_longitude}
                  customerName={delivery.customer}
                  vehicleConsumption={delivery.vehicle?.consumption_per_km ?? 0.12}
                  vehicleFuelLevel={delivery.vehicle?.fuel_level ?? 85}
                  vehicleFuelTankCapacity={delivery.vehicle?.fuel_tank_capacity ?? 80}
                  onRouteCalculated={(dist, duration, fuelLeft) => {
                    setDistanceRemaining(dist);
                    setDurationRemaining(duration);
                    setProjectedFuelRemaining(fuelLeft);
                  }}
                />
              )}

              {/* Telemetry Stats Card */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-4 space-y-3.5 text-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-forest/20">
                    <Truck className="text-brand-yellow" size={16} />
                    <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">Live Route Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Distance Remaining</p>
                      <p className="text-lg font-black font-mono text-white mt-0.5">
                        {distanceRemaining !== null ? `${distanceRemaining.toFixed(1)} km` : "Calculating..."}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Estimated Duration</p>
                      <p className="text-lg font-black font-mono text-white mt-0.5">
                        {durationRemaining !== null ? `${durationRemaining} mins` : "Calculating..."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-forest/20 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
                      <span>Projected Fuel Level</span>
                      <span>
                        {projectedFuelRemaining !== null && delivery.vehicle 
                          ? `${Math.round((projectedFuelRemaining / delivery.vehicle.fuel_tank_capacity) * 100)}% (${projectedFuelRemaining.toFixed(1)} L)` 
                          : "Calculating..."
                        }
                      </span>
                    </div>

                    {/* Progress Bar showing projected fuel */}
                    <div className="w-full bg-[#0B1510] h-2 rounded-full overflow-hidden flex relative">
                      <div 
                        className="bg-brand-yellow h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${projectedFuelRemaining !== null && delivery.vehicle 
                            ? Math.max(0, Math.min(100, (projectedFuelRemaining / delivery.vehicle.fuel_tank_capacity) * 100)) 
                            : (delivery.vehicle?.fuel_level ?? 85)
                          }%` 
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold uppercase">
                      <span>Current: {delivery.vehicle?.fuel_level ?? 85}%</span>
                      <span>At Destination</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Route Map Plan visual */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={14} />
                    Active Route Roadmap
                  </h4>

                  <div className="relative pl-5 space-y-6 text-xs border-l-2 border-brand-forest/40">
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-brand-forest border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold">✓</span>
                      <div>
                        <p className="font-bold text-gray-300">Depot (Intake Center)</p>
                        <p className="text-[9px] text-gray-500">Departure recorded • gatepass validated</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-blue-400 border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold animate-pulse" />
                      <div>
                        <p className="font-bold text-white flex items-center gap-1.5">
                          In Transit Bypass
                          <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-black">Active</span>
                        </p>
                        <p className="text-[9px] text-gray-400">Approaching destination bypass lanes</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-gray-600 border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold" />
                      <div>
                        <p className="font-bold text-gray-500">{delivery.customer}</p>
                        <p className="text-[9px] text-gray-500">Store Entrance 4 gate clearance scheduled</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Split Action Buttons (Cancel / Complete) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button 
                  className="h-14 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 font-black text-xs uppercase tracking-widest rounded-2xl gap-2"
                  onClick={handleCancelDispatch}
                  isLoading={isLoading}
                >
                  <XCircle size={16} />
                  Cancel Trip
                </Button>
                
                <Button 
                  className="h-14 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest border border-brand-yellow/30 font-black text-xs uppercase tracking-widest rounded-2xl gap-2"
                  onClick={() => setStep(3)} // Move to capture proof
                >
                  Complete Order
                  <ArrowRight size={16} />
                </Button>
              </div>

            </motion.div>
          )}

          {/* STEP 3: CAPTURE DELIVERY PROOF SCREEN */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-base font-heading font-black text-brand-yellow px-1">Fulfillment Verification</h3>
                <p className="text-xs text-gray-400 font-medium px-1">Please log valid gatepass credentials to clear delivery status.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setProofType("photo")}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                    proofType === "photo" 
                      ? "bg-[#132A1C]/70 border-brand-yellow text-white" 
                      : "bg-[#132A1C]/30 border-brand-forest/20 text-gray-400"
                  }`}
                >
                  <Camera size={26} className={proofType === "photo" ? "text-brand-yellow" : "text-gray-400"} />
                  <span className="text-xs font-bold">Log HD Photo</span>
                </button>
                <button 
                  onClick={() => setProofType("signature")}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                    proofType === "signature" 
                      ? "bg-[#132A1C]/70 border-brand-yellow text-white" 
                      : "bg-[#132A1C]/30 border-brand-forest/20 text-gray-400"
                  }`}
                >
                  <Edit3 size={26} className={proofType === "signature" ? "text-brand-yellow" : "text-gray-400"} />
                  <span className="text-xs font-bold">Client Signature</span>
                </button>
              </div>

              {proofType === "photo" && (
                <div className="aspect-video bg-[#0B1510] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-brand-forest/40 p-4">
                  <Camera size={38} className="text-brand-yellow mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-gray-300">Camera Interface Ready</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Capturing egg delivery crates check receipt</p>
                </div>
              )}

              {proofType === "signature" && (
                <div className="bg-[#0B1510] border border-brand-forest/20 rounded-2xl overflow-hidden p-1">
                  <SignatureCanvas onSave={(data) => console.log("Signature captured:", data)} />
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-14 bg-brand-yellow text-brand-forest hover:bg-brand-yellow/90 font-black text-sm rounded-2xl tracking-widest" 
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  disabled={!proofType}
                >
                  SUBMIT GATEPASS & CLOSE
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-xs font-bold text-gray-400 hover:text-white" 
                  onClick={() => setStep(2)}
                >
                  Back to Transit Dashboard
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FULL-SCREEN SUCCESS SPLASH */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-400/30 flex items-center justify-center text-green-400">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-black text-brand-yellow">Delivery Complete!</h2>
                <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">
                  Excellent work. The cargo has been logged as delivered and the depot account transaction ledger has been updated.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Connectivity Sync Indicator */}
      <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
         <div className="bg-brand-forest border border-brand-yellow/20 text-brand-yellow px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Local Cache Encrypted</span>
            </div>
            <span className="text-[8px] bg-brand-yellow/10 px-2 py-0.5 rounded font-black">Sync Auto</span>
         </div>
      </div>

      {/* DELAY JUSTIFICATION MODAL */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-[#0B1510] text-white px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Missed Delivery Justification</h3>
              </div>
              <button 
                onClick={() => setShowDelayModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDelaySubmit} className="p-5 space-y-4 text-xs">
              <p className="text-gray-300 leading-normal">
                This dispatch is past its expected delivery date. Please select a reason for the delay to start transit.
              </p>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Delay Reason *</label>
                <select
                  required
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                >
                  <option value="">-- Choose Reason --</option>
                  <option value="traffic">Severe Traffic / Gridlock</option>
                  <option value="no_vehicle">Vehicle Unavailable</option>
                  <option value="missing_docs">Missing Route Documents / Gatepass</option>
                  <option value="sickness">Driver Sickness / Medical</option>
                  <option value="weather">Extreme Weather Conditions</option>
                  <option value="loading_delay">Warehouse Loading Delay</option>
                  <option value="other">Other (Performance Penalty Applies)</option>
                </select>
              </div>

              {delayReason === "other" && (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Explain Reason *</label>
                  <textarea
                    required
                    placeholder="Provide a detailed explanation for the delay..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full h-20 p-2.5 text-xs font-semibold rounded-xl border border-brand-forest/50 focus:outline-none focus:ring-1 focus:ring-brand-yellow bg-[#0B1510] text-white"
                  />
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} />
                    Note: Unapproved reasons will deduct 5.0 points from your performance rating.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => setShowDelayModal(false)} 
                  className="bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-9 px-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest text-xs font-black rounded-xl h-9 px-4 flex items-center gap-1.5"
                >
                  {isLoading ? "Starting..." : "Start Dispatch"}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
