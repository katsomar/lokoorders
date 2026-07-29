"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id: customId, name: customName, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = customId || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : generatedId);
    const selectName = customName || selectId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700 font-body cursor-pointer">
            {label} {props.required && <span className="text-brand-amber">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            name={selectName}
            className={cn(
              "flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow pr-10",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            ref={ref}
            {...props}
          >
            <option value="" disabled>Select an option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
