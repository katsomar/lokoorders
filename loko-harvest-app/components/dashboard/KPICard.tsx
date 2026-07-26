"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, LucideIcon, FileText } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/tooltip";


interface KPICardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  subtitle?: string;
  tooltipText?: string;
  rightIcon?: LucideIcon;
  subMetrics?: {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string;
    tooltipText?: string;
  }[];
  breakdownTitle?: string;
  breakdown?: {
    name: string;
    value: string | number;
    color?: string;
    tooltipText?: string;
  }[];
  trend?: {
    value: number;
    isUp: boolean;
  };
  iconBg?: string;
  iconColor?: string;
}

export function KPICard({ 
  label, 
  value, 
  prefix = "", 
  suffix = "", 
  icon: Icon, 
  subtitle,
  tooltipText,
  rightIcon: RightIcon = FileText,
  subMetrics,
  breakdownTitle,
  breakdown,
  trend,
  iconBg = "bg-brand-sage/20",
  iconColor = "text-brand-forest"
}: KPICardProps) {
  const isNumeric = typeof value === "number";
  const animatedValue = useCountUp(isNumeric ? (value as number) : 0);
  const displayValue = isNumeric ? animatedValue.toLocaleString() : value;

  return (
    <Card className="p-6 border border-brand-sage/40 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between">
      <div>
        
        {/* Top Header Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-forest text-white font-heading shadow-sm">
              <Icon size={13} className="text-brand-yellow" />
              {label}
            </span>
            {tooltipText && (
              <InfoTooltip text={tooltipText} title={label} side="bottom" className="text-gray-400 hover:text-brand-forest" />
            )}

          </div>

          
          {/* Trend Tag */}
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-bold rounded-lg px-2 py-1 ${
              trend.isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Large Stat Section */}
        <div className="flex justify-between items-center mt-2">
          <div>
            <h3 className="text-3xl font-black text-brand-forest font-heading tracking-tight">
              {prefix}{displayValue}{suffix}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1 font-body font-medium">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Secondary circular icon badge */}
          <div className={`p-3 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shadow-sm`}>
            <RightIcon size={20} />
          </div>
        </div>

        {/* Key-Value Sub-metrics (Optional) */}
        {subMetrics && subMetrics.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-dashed border-brand-sage/50 pt-3">
            {subMetrics.map((sm, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  {sm.icon && <sm.icon size={13} className="text-gray-400" />}
                  {sm.label}
                </span>
                <span className={`font-bold ${sm.color || 'text-gray-800'}`}>{sm.value}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Separator and Breakdown items (Optional) */}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 border-t border-brand-sage/60 pt-4">
          {breakdownTitle && (
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold mb-2.5 font-heading">
              {breakdownTitle}
            </p>
          )}
          <div className="space-y-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-medium flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color || "#1A5C2A" }} 
                  />
                  {item.name}
                </span>
                <span className="font-extrabold text-brand-forest font-heading">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </Card>
  );
}
