"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DriverTransitMapProps {
  deliveryId: string;
  customerLat: number;
  customerLng: number;
  customerName: string;
  vehicleConsumption: number;
  vehicleFuelLevel: number;
  vehicleFuelTankCapacity: number;
  onRouteCalculated?: (distanceKm: number, durationMins: number) => void;
  onLiveFuelCalculated?: (liveFuelLiters: number, fuelConsumedLiters: number) => void;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function DriverTransitMap({
  deliveryId,
  customerLat,
  customerLng,
  customerName,
  vehicleConsumption,
  vehicleFuelLevel,
  vehicleFuelTankCapacity,
  onRouteCalculated,
  onLiveFuelCalculated,
}: DriverTransitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);

  const [isTracking, setIsTracking] = useState(true);
  const driverLocRef = useRef<[number, number] | null>(null);
  const lastLocationRef = useRef<[number, number] | null>(null);

  // Sync driver location reference for event listeners and track live distance/fuel
  useEffect(() => {
    driverLocRef.current = driverLocation;
    if (mapRef.current && driverLocation) {
      // Move marker only, no auto-follow
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(driverLocation);
      }
      // Re-evaluate centering
      const center = mapRef.current.getCenter();
      const diffLat = Math.abs(center.lat - driverLocation[0]);
      const diffLng = Math.abs(center.lng - driverLocation[1]);
      const isCentered = diffLat < 0.00015 && diffLng < 0.00015 && mapRef.current.getZoom() === 16;
      setIsTracking(isCentered);

      // Track distance traveled dynamically (actual live movements, even off-route)
      if (lastLocationRef.current) {
        const delta = getDistanceKm(
          lastLocationRef.current[0],
          lastLocationRef.current[1],
          driverLocation[0],
          driverLocation[1]
        );
        // Exclude minor jitter (e.g. less than 10 meters) to avoid false distance accumulation
        if (delta > 0.01) {
          const currentDistance = parseFloat(localStorage.getItem(`delivery_distance_${deliveryId}`) || "0");
          const newDistance = currentDistance + delta;
          localStorage.setItem(`delivery_distance_${deliveryId}`, newDistance.toString());
          lastLocationRef.current = driverLocation;
        }
      } else {
        // First location read, initialize lastLocationRef
        lastLocationRef.current = driverLocation;
      }

      // Calculate live fuel status based on actual distance traveled
      const startingFuelLiters = (vehicleFuelLevel / 100) * vehicleFuelTankCapacity;
      const totalDistance = parseFloat(localStorage.getItem(`delivery_distance_${deliveryId}`) || "0");
      const consumedLiters = totalDistance * vehicleConsumption;
      const liveLiters = Math.max(0, startingFuelLiters - consumedLiters);

      if (onLiveFuelCalculated) {
        onLiveFuelCalculated(liveLiters, consumedLiters);
      }
    }
  }, [driverLocation, deliveryId, vehicleFuelLevel, vehicleFuelTankCapacity, vehicleConsumption]);

  // Helper to check if map is centered on driver
  const checkCentering = () => {
    if (!mapRef.current || !driverLocRef.current) return;
    const center = mapRef.current.getCenter();
    const diffLat = Math.abs(center.lat - driverLocRef.current[0]);
    const diffLng = Math.abs(center.lng - driverLocRef.current[1]);
    const isCentered = diffLat < 0.00015 && diffLng < 0.00015 && mapRef.current.getZoom() === 16;
    setIsTracking(isCentered);
  };

  // 1. Setup Geolocation Watcher
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      setGeoWarning("GPS restricted on insecure HTTP connection. Centering map on Kampala Depot.");
      setDriverLocation([0.3476, 32.5825]);
      setLoading(false);
      return;
    }

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          console.warn("Geolocation watch failed:", error);
          let warningMsg = "Could not fetch GPS coordinates. Using Kampala Depot coordinates.";
          if (error.code === error.PERMISSION_DENIED) {
            warningMsg = "Location access denied. Please enable location permissions.";
          } else if (error.code === error.TIMEOUT) {
            warningMsg = "Location request timed out. Using default Kampala coordinates.";
          }
          setGeoWarning(warningMsg);
          setDriverLocation([0.3476, 32.5825]);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setGeoWarning("Geolocation not supported by browser. Using default Kampala coordinates.");
      setDriverLocation([0.3476, 32.5825]);
      setLoading(false);
    }
  }, []);

  // 2. Initialize Map once driverLocation is first acquired
  useEffect(() => {
    if (loading || !driverLocation || !mapContainerRef.current || mapRef.current) return;

    const loc = driverLocation;

    // Fix default marker icon issue in Leaflet when bundled
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Create Map at zoom level 16
    const map = L.map(mapContainerRef.current).setView(loc, 16);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Set tracking to false immediately when map movement starts
    map.on("movestart", () => {
      setIsTracking(false);
    });

    // Bind event listener to re-evaluate tracking whenever camera view changes
    map.on("moveend", () => {
      checkCentering();
    });

    // Create Driver Marker (Truck Icon) - Bigger size
    const driverIcon = L.divIcon({
      className: "driver-custom-marker",
      html: `<div class="h-10 w-10 rounded-full bg-brand-yellow border-2 border-white flex items-center justify-center shadow-lg text-[20px] animate-pulse">🚚</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const driverMarker = L.marker(loc, { icon: driverIcon })
      .addTo(map)
      .bindPopup("<strong>Your Position (Driver)</strong>");
    driverMarkerRef.current = driverMarker;

    // Create Customer Marker (Destination Flag Icon)
    const customerIcon = L.divIcon({
      className: "customer-custom-marker",
      html: `<div class="h-8 w-8 rounded-full bg-[#1B5E20] border-2 border-white flex items-center justify-center shadow-lg text-[14px]">🏁</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<strong>${customerName}</strong><br/>Destination`);
    customerMarkerRef.current = customerMarker;

    // Zoom into driver location initially
    map.setView(loc, 16);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("movestart");
        mapRef.current.off("moveend");
        mapRef.current.remove();
        mapRef.current = null;
      }
      driverMarkerRef.current = null;
      customerMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, [loading, driverLocation]);

  // 3. Update route path and calculations when driverLocation changes
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    let isMounted = true;

    async function updateRouting() {
      if (!mapRef.current || !driverLocation) return;
      const start = driverLocation;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${customerLng},${customerLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (!isMounted || !mapRef.current) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

          // Update or Create Polyline with thicker weight
          if (polylineRef.current) {
            polylineRef.current.setLatLngs(coordinates);
          } else {
            const polyline = L.polyline(coordinates, {
              color: "#3182CE",
              weight: 8,
              opacity: 0.85,
            }).addTo(mapRef.current);
            polylineRef.current = polyline;
          }

          // Calculate Telemetry metrics
          const distKmNum = route.distance / 1000;
          const durationMins = Math.round(route.duration / 60);

          if (onRouteCalculated) {
            onRouteCalculated(distKmNum, durationMins);
          }
        }
      } catch (err) {
        console.error("OSRM transit routing calculation failed:", err);
      }
    }

    updateRouting();

    return () => {
      isMounted = false;
    };
  }, [driverLocation]);

  if (loading) {
    return (
      <div className="h-56 bg-brand-sage/10 border border-brand-sage rounded-2xl flex flex-col items-center justify-center text-center p-4">
        <div className="h-8 w-8 border-4 border-brand-forest border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-brand-forest font-bold">Acquiring current GPS location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Relative wrapper for Map + Recenter button */}
      <div className="relative w-full h-56 rounded-2xl border border-brand-forest/20 overflow-hidden shadow-inner z-10">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full" 
        />

        {/* Floating Recenter Button */}
        {!isTracking && driverLocation && (
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView(driverLocation, 16);
              }
              setIsTracking(true);
            }}
            className="absolute bottom-4 right-4 z-[1010] bg-brand-yellow text-brand-forest text-[10px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg border border-[#C47B00]/30 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            🎯 Recenter
          </button>
        )}
      </div>

      {/* Geolocation warning banner */}
      {geoWarning && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9px] p-2 rounded-xl flex items-start gap-1.5 shrink-0">
          <span className="shrink-0">⚠️</span>
          <div className="flex-1 font-semibold">{geoWarning}</div>
        </div>
      )}
    </div>
  );
}
