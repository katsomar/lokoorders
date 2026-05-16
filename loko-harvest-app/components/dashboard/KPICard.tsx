"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
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
  trend,
  iconBg = "bg-brand-sage",
  iconColor = "text-brand-forest"
}: KPICardProps) {
  const animatedValue = useCountUp(value);

  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 font-body">{label}</p>
          <h3 className="text-3xl font-bold text-brand-forest font-heading">
            {prefix}{animatedValue.toLocaleString()}{suffix}
          </h3>
          
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>{trend.value}%</span>
              <span className="text-gray-400 font-normal ml-1">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-2xl ${iconBg} ${iconColor}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}
