"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SignatureCanvas } from "@/components/ui/signature-canvas";

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

  useEffect(() => {
    let interval: any;
    if (step === 2) { // Active dispatch
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00h : ${m}m : ${s}s`;
  };

  const mockDelivery = {
    id: params.id || "1",
    order: "LHO-0042",
    customer: "Shoprite Lugogo",
    contact: "John Okello",
    phone: "0772 123 456",
    address: "Lugogo Bypass, Kampala (Store Entrance 4)",
    items: [
      { name: "White Eggs (Trays)", quantity: 150 },
      { name: "Brown Eggs (Trays)", quantity: 100 },
    ]
  };

  // Actions
  const handleStartDispatch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setDeliveryStatus("Dispatched");
      setStep(2); // Go to Active Dispatch Screen
    }, 800);
  };

  const handleCancelDispatch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setDeliveryStatus("Assigned");
      setSecondsElapsed(0);
      setStep(1); // Go back to details
    }, 600);
  };

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setDeliveryStatus("Delivered");
      setStep(4); // Success Splash
      setTimeout(() => router.push("/driver"), 2500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0E1B15] text-white font-body pb-10">
      
      {/* Header */}
      <header className="bg-[#132A1C] border-b border-brand-forest/30 p-4 flex items-center justify-between sticky top-0 z-10">
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
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{mockDelivery.order}</p>
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
                      <h2 className="text-xl font-heading font-black text-brand-yellow leading-tight">{mockDelivery.customer}</h2>
                      <p className="text-xs text-gray-400 font-semibold mt-1">Recipient: {mockDelivery.contact}</p>
                    </div>
                    <a href={`tel:${mockDelivery.phone}`} className="h-11 w-11 rounded-full bg-brand-forest flex items-center justify-center text-brand-yellow hover:scale-105 active:scale-95 transition-transform shrink-0 border border-brand-yellow/20">
                      <Phone size={18} />
                    </a>
                  </div>
                  
                  <div className="flex gap-3 items-start pt-2 border-t border-brand-forest/20">
                    <MapPin className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300 font-semibold">{mockDelivery.address}</p>
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
                    {mockDelivery.items.map((item, i) => (
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
                onClick={handleStartDispatch}
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
                        <p className="font-bold text-gray-500">{mockDelivery.customer}</p>
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

    </div>
  );
}
