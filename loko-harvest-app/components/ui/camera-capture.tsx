"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  title?: string;
}

export function CameraCapture({ onCapture, onClose, title = "Capture Photo" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check cameras
  useEffect(() => {
    async function initCamera() {
      setIsLoading(true);
      setError("");

      if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Camera access is blocked by the browser. For security, mobile devices require a secure HTTPS context to use the camera. Please access the application using HTTPS (https://...) or localhost to enable camera features."
        );
        setIsLoading(false);
        return;
      }

      try {
        // First ask permission to get user media
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        
        // Stop temporary stream so we can enumerate correctly
        tempStream.getTracks().forEach((track) => track.stop());

        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);

        if (videoDevices.length > 0) {
          // Default to back/environment camera if available
          const environmentDevice = videoDevices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment") ||
              device.label.toLowerCase().includes("rear")
          );
          const initialId = environmentDevice?.deviceId || videoDevices[0].deviceId;
          setActiveDeviceId(initialId);
          await startStream(initialId);
        } else {
          setError("No video input devices found on this device.");
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError("Camera permission denied or camera is in use. Please allow camera access in your browser settings.");
      } finally {
        setIsLoading(false);
      }
    }

    initCamera();

    return () => {
      stopStream();
    };
  }, []);

  // Start video stream with selected device
  async function startStream(deviceId: string) {
    stopStream();
    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is blocked by the browser in this context.");
      return;
    }
    try {
      setIsLoading(true);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Failed to start stream with device:", err);
      // Fallback without deviceId
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (fallbackErr) {
        setError("Could not launch camera stream.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Stop active stream tracks
  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  // Toggle between available cameras
  const handleToggleCamera = async () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    setActiveDeviceId(nextDeviceId);
    await startStream(nextDeviceId);
  };

  // Capture image frame
  const handleCapture = () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Use the actual native resolution of the video stream
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File([blob], `camera_capture_${Date.now()}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            stopStream();
            onCapture(capturedFile);
          }
        },
        "image/jpeg",
        0.95
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F2115] border border-brand-forest/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-forest/20 bg-[#132A1C]/50">
          <h3 className="text-sm font-black text-brand-yellow font-heading uppercase tracking-wider flex items-center gap-2">
            <Camera size={16} />
            {title}
          </h3>
          <button 
            onClick={() => {
              stopStream();
              onClose();
            }} 
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Feed Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white bg-black/60 z-20">
              <RefreshCw className="animate-spin text-brand-yellow" size={28} />
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Opening Camera stream...</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center text-red-400 max-w-sm flex flex-col items-center gap-3">
              <AlertTriangle className="text-brand-amber animate-bounce" size={40} />
              <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{error}</p>
              <Button 
                onClick={() => onClose()} 
                className="mt-2 bg-brand-forest hover:bg-brand-mid text-white font-bold rounded-xl text-xs px-4 py-2 cursor-pointer"
              >
                Close Camera
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[60vh]"
            />
          )}
        </div>

        {/* Action Controls */}
        <div className="px-6 py-5 border-t border-brand-forest/20 bg-[#132A1C]/50 flex items-center justify-between gap-4">
          {/* Toggle Camera Switcher */}
          {devices.length > 1 && !error && (
            <Button
              type="button"
              onClick={handleToggleCamera}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-brand-forest/20 cursor-pointer flex items-center justify-center"
              title="Switch Camera"
            >
              <RefreshCw size={18} />
            </Button>
          )}

          {/* Capture Trigger */}
          {!error && (
            <button
              type="button"
              onClick={handleCapture}
              disabled={isLoading}
              className="mx-auto w-14 h-14 rounded-full border-4 border-white bg-brand-yellow hover:bg-brand-yellow/80 active:scale-95 transition-transform flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Capture Photo"
            >
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
                <Camera className="text-[#0F2115]" size={20} />
              </div>
            </button>
          )}

          {/* Placeholder/Alignment block */}
          {devices.length > 1 && !error && <div className="w-12" />}
        </div>
      </div>
    </div>
  );
}
