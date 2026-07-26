"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Info, Sparkles } from "lucide-react";

export type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  delayMs?: number;
  className?: string;
  title?: string;
}

export function Tooltip({
  content,
  children,
  side = "bottom",
  delayMs = 100,
  className = "",
  title,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    effectiveSide: TooltipSide;
    arrowStyle: React.CSSProperties;
  }>({
    top: 0,
    left: 0,
    effectiveSide: side,
    arrowStyle: {},
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12;
    const offset = 8;

    // Estimate or measure tooltip dimensions
    const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 260;
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 100;

    let targetSide = side;

    // Smart Auto-Flip logic
    if (side === "top" && rect.top - tooltipHeight - offset < padding) {
      targetSide = "bottom";
    } else if (side === "bottom" && rect.bottom + tooltipHeight + offset > viewportHeight - padding) {
      targetSide = "top";
    } else if (side === "right" && rect.right + tooltipWidth + offset > viewportWidth - padding) {
      targetSide = "left";
      if (rect.left - tooltipWidth - offset < padding) {
        targetSide = "bottom";
      }
    } else if (side === "left" && rect.left - tooltipWidth - offset < padding) {
      targetSide = "right";
      if (rect.right + tooltipWidth + offset > viewportWidth - padding) {
        targetSide = "bottom";
      }
    }

    const triggerCenterY = rect.top + rect.height / 2;
    const triggerCenterX = rect.left + rect.width / 2;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    if (targetSide === "top") {
      tooltipTop = rect.top - tooltipHeight - offset;
      tooltipLeft = triggerCenterX - tooltipWidth / 2;
    } else if (targetSide === "bottom") {
      tooltipTop = rect.bottom + offset;
      tooltipLeft = triggerCenterX - tooltipWidth / 2;
    } else if (targetSide === "right") {
      tooltipTop = triggerCenterY - tooltipHeight / 2;
      tooltipLeft = rect.right + offset;
    } else if (targetSide === "left") {
      tooltipTop = triggerCenterY - tooltipHeight / 2;
      tooltipLeft = rect.left - tooltipWidth - offset;
    }

    // CLAMPING TO VIEWPORT BOUNDARIES (Left/Right)
    if (tooltipLeft < padding) {
      tooltipLeft = padding;
    } else if (tooltipLeft + tooltipWidth > viewportWidth - padding) {
      tooltipLeft = viewportWidth - padding - tooltipWidth;
    }

    // CLAMPING TO VIEWPORT BOUNDARIES (Top/Bottom)
    if (tooltipTop < padding) {
      tooltipTop = padding;
    } else if (tooltipTop + tooltipHeight > viewportHeight - padding) {
      tooltipTop = viewportHeight - padding - tooltipHeight;
    }

    // Arrow positioning calculations relative to the tooltip box
    let arrowStyle: React.CSSProperties = {};
    const arrowMargin = 16;

    if (targetSide === "top" || targetSide === "bottom") {
      let arrowX = triggerCenterX - tooltipLeft;
      arrowX = Math.max(arrowMargin, Math.min(arrowX, tooltipWidth - arrowMargin));
      arrowStyle = {
        left: `${arrowX}px`,
        transform: "translateX(-50%)",
      };
    } else {
      let arrowY = triggerCenterY - tooltipTop;
      arrowY = Math.max(arrowMargin, Math.min(arrowY, tooltipHeight - arrowMargin));
      arrowStyle = {
        top: `${arrowY}px`,
        transform: "translateY(-50%)",
      };
    }

    setCoords({
      top: tooltipTop,
      left: tooltipLeft,
      effectiveSide: targetSide,
      arrowStyle,
    });
  };

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isVisible, side]);

  const arrowClasses = {
    top: "top-full -mt-1.5 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom: "bottom-full -mb-1.5 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "left-full -ml-1.5 border-l-slate-900 border-y-transparent border-r-transparent",
    right: "right-full -mr-1.5 border-r-slate-900 border-y-transparent border-l-transparent",
  };

  const motionVariants = {
    top: { initial: { opacity: 0, y: 6, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 } },
    bottom: { initial: { opacity: 0, y: -6, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 } },
    left: { initial: { opacity: 0, x: 6, scale: 0.94 }, animate: { opacity: 1, x: 0, scale: 1 } },
    right: { initial: { opacity: 0, x: -6, scale: 0.94 }, animate: { opacity: 1, x: 0, scale: 1 } },
  };

  const tooltipPortalContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={motionVariants[coords.effectiveSide].initial}
          animate={motionVariants[coords.effectiveSide].animate}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className={`pointer-events-none ${className}`}
        >
          <div className="relative w-max min-w-[200px] max-w-[280px] sm:max-w-[320px] rounded-2xl bg-gradient-to-br from-slate-900 via-brand-forest/95 to-slate-950 backdrop-blur-xl p-3.5 text-xs text-white shadow-2xl border border-white/20 leading-relaxed font-body">
            {title && (
              <div className="flex items-center gap-1.5 font-bold text-brand-yellow text-xs mb-1 font-heading tracking-wide border-b border-white/10 pb-1">
                <Sparkles size={13} className="text-brand-yellow shrink-0" />
                {title}
              </div>
            )}

            <div className="text-white/90 font-medium whitespace-normal leading-normal text-left">
              {content}
            </div>

            {/* Dynamic Arrow Beak */}
            <div 
              style={coords.arrowStyle}
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[coords.effectiveSide]}`} 
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {mounted && typeof document !== "undefined" && createPortal(tooltipPortalContent, document.body)}
    </div>
  );
}

interface InfoTooltipProps {
  text: React.ReactNode;
  title?: string;
  side?: TooltipSide;
  size?: number;
  icon?: "help" | "info";
  className?: string;
}

export function InfoTooltip({
  text,
  title,
  side = "bottom",
  size = 15,
  icon = "help",
  className = "",
}: InfoTooltipProps) {
  const IconComponent = icon === "info" ? Info : HelpCircle;

  return (
    <Tooltip content={text} title={title} side={side}>
      <button
        type="button"
        tabIndex={-1}
        className={`inline-flex items-center justify-center text-gray-400 hover:text-brand-yellow hover:scale-110 transition-all p-1 rounded-full hover:bg-brand-forest/20 focus:outline-none cursor-help shrink-0 ${className}`}
        aria-label="More information"
      >
        <IconComponent size={size} />
      </button>
    </Tooltip>
  );
}

export { Tooltip as UITooltip };
