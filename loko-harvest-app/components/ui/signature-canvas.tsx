"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";

export function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1A5C2A";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    lastPosRef.current = coords;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = "#1A5C2A";
    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const currentCoords = getCoordinates(e);
    const lastCoords = lastPosRef.current;

    const midPoint = {
      x: (lastCoords.x + currentCoords.x) / 2,
      y: (lastCoords.y + currentCoords.y) / 2
    };

    ctx.beginPath();
    ctx.moveTo(lastCoords.x, lastCoords.y);
    ctx.quadraticCurveTo(lastCoords.x, lastCoords.y, midPoint.x, midPoint.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1A5C2A";
    ctx.stroke();

    lastPosRef.current = currentCoords;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      lastPosRef.current = null;
      onSave("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-white rounded-2xl border-2 border-brand-sage overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-full cursor-crosshair"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none font-body text-sm">
            Please sign here
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={clear} className="text-red-500 gap-2">
          <Trash2 size={16} />
          Clear Signature
        </Button>
        {!isEmpty && (
          <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-wider">
            <CheckCircle2 size={12} /> Captured
          </p>
        )}
      </div>
    </div>
  );
}
