"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Fix default marker icon issue in Leaflet when bundled
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const defaultLat = lat || 0.3476; // Kampala Central
    const defaultLng = lng || 32.5825;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
    mapRef.current = map;

    // Add OSM Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add Marker
    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Set initial coordinates if not set
    if (lat === null || lng === null) {
      onChange(defaultLat, defaultLng);
    }

    // Handle Drag End to update coordinates
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChange(position.lat, position.lng);
    });

    // Handle Map Click to place marker and update coordinates
    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      onChange(clickLat, clickLng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current && lat && lng) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainerRef} 
        className="w-full h-64 rounded-xl border border-brand-sage overflow-hidden shadow-inner relative z-10" 
      />
      <div className="flex justify-between items-center text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono">
        <span>Lat: {lat ? lat.toFixed(6) : "Not Set"}</span>
        <span>Lng: {lng ? lng.toFixed(6) : "Not Set"}</span>
        <span className="text-brand-mid font-bold font-body">Click map or drag pin to locate</span>
      </div>
    </div>
  );
}
