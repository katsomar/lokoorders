"use client";

import React, { useState } from "react";
import { Truck } from "lucide-react";

interface VehicleImageProps {
  src: string | null;
  alt: string;
}

export default function VehicleImage({ src, alt }: VehicleImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <Truck size={48} className="text-brand-sage/60" />;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setHasError(true)} 
      className="h-full w-full object-cover" 
    />
  );
}
