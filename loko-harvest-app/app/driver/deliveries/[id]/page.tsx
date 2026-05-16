"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Package, 
  Camera, 
  Edit3, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function DeliveryConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Details, 2: Proof
  const [isLoading, setIsLoading] = useState(false);
  const [proofType, setProofType] = useState<"signature" | "photo" | null>(null);

  const mockDelivery = {
    id: "1",
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

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3); // Success
      setTimeout(() => router.push("/driver"), 2500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Header */}
      <header className="bg-white border-b border-brand-sage p-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-brand-forest">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-brand-forest font-heading">Delivery Details</h1>
      </header>

      <main className="p-4 space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-brand-forest font-heading">{mockDelivery.customer}</h2>
                      <p className="text-sm text-gray-500 font-medium">{mockDelivery.order}</p>
                    </div>
                    <a href={`tel:${mockDelivery.phone}`} className="h-12 w-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-forest">
                      <Phone size={24} />
                    </a>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <MapPin className="text-brand-mid shrink-0" size={20} />
                    <p className="text-sm text-gray-600">{mockDelivery.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-brand-forest mb-4 flex items-center gap-2">
                    <Package size={18} />
                    Items to Deliver
                  </h3>
                  <div className="space-y-3">
                    {mockDelivery.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="text-lg font-bold text-brand-forest">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full h-14 text-lg font-bold gap-2" onClick={() => setStep(2)}>
                Continue to Proof
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-brand-forest font-heading px-2">Capture Delivery Proof</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setProofType("photo")}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    proofType === "photo" ? "bg-brand-sage/40 border-brand-forest" : "bg-white border-brand-sage"
                  }`}
                >
                  <Camera size={32} className="text-brand-forest" />
                  <span className="text-sm font-bold text-brand-forest">Take Photo</span>
                </button>
                <button 
                  onClick={() => setProofType("signature")}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    proofType === "signature" ? "bg-brand-sage/40 border-brand-forest" : "bg-white border-brand-sage"
                  }`}
                >
                  <Edit3 size={32} className="text-brand-forest" />
                  <span className="text-sm font-bold text-brand-forest">Signature</span>
                </button>
              </div>

              {proofType === "photo" && (
                <div className="aspect-video bg-gray-200 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera size={48} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Camera placeholder</p>
                </div>
              )}

              {proofType === "signature" && (
                <div className="aspect-video bg-white rounded-2xl border-2 border-brand-sage relative overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                      Sign here
                   </div>
                   <canvas className="w-full h-full cursor-crosshair" />
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-14 text-lg font-bold" 
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  disabled={!proofType}
                >
                  Complete Delivery
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
                  Back to Details
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle2 size={64} className="animate-bounce" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-brand-forest font-heading">Delivery Complete!</h2>
                <p className="text-sm text-gray-500 mt-1">Excellent work, Musa.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Offline Alert Placeholder */}
      <div className="fixed bottom-20 left-4 right-4 z-50">
         <div className="bg-brand-amber text-white p-3 rounded-xl flex items-center gap-3 shadow-lg border border-white/20">
            <AlertCircle size={20} />
            <p className="text-xs font-bold uppercase tracking-wider">Offline Mode: Syncing Enabled</p>
         </div>
      </div>
    </div>
  );
}
