import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id: customId, name: customName, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = customId || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : generatedId);
    const inputName = customName || inputId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 font-body cursor-pointer">
            {label} {props.required && <span className="text-brand-amber">*</span>}
          </label>
        )}
        <input
          id={inputId}
          name={inputName}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
