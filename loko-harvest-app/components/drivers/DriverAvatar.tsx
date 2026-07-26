"use client";

import React, { useState } from "react";
import { User } from "lucide-react";

interface DriverAvatarProps {
  src: string | null;
  alt: string;
}

export default function DriverAvatar({ src, alt }: DriverAvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <User size={24} />;
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
