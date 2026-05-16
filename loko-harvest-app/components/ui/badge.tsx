import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pending" | "processing" | "ready" | "dispatched" | "delivered" | "urgent" | "critical" | "return";
}

const Badge = ({ className, variant = "pending", ...props }: BadgeProps) => {
  const variants = {
    pending: "bg-gray-100 text-gray-600",
    processing: "bg-blue-50 text-blue-700",
    ready: "bg-amber-50 text-amber-700",
    dispatched: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700",
    urgent: "bg-amber-50 text-amber-700",
    critical: "bg-red-50 text-red-700",
    return: "bg-rose-50 text-rose-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-heading transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
