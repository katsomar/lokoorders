"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RouteItem {
  id: string;
  order: string;
  customer: string;
  zone: string;
  status: string;
  time: string;
  crates: number;
  latitude: number | null;
  longitude: number | null;
}

interface DriverRouteMapProps {
  assignedRoute: RouteItem[];
  vehicleConsumption: number;
}

export default function DriverRouteMap({ assignedRoute, vehicleConsumption }: DriverRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);

  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [routeDetails, setRouteDetails] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);

  // Harmonious premium colors to distinguish routes
  const colors = ["#3182CE", "#319795", "#805AD5", "#DD6B20", "#E53E3E"];

  useEffect(() => {
    // 1. Check for insecure context (HTTP on IP Address)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoWarning("GPS restricted on insecure HTTP connection. Centering map on Kampala Depot.");
      setDriverLocation([0.3476, 32.5825]);
      setLoading(false);
      return;
    }

    // 2. Get Driver Location using Geolocation API
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          console.warn("Geolocation API request failed:", error);
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
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setGeoWarning("Geolocation not supported by browser. Using default Kampala coordinates.");
      setDriverLocation([0.3476, 32.5825]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !driverLocation || typeof window === "undefined" || !mapContainerRef.current) return;

    const loc = driverLocation;

    // Fix default marker icon issue in Leaflet when bundled
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Initialize Map centered on Driver
    const map = L.map(mapContainerRef.current).setView(loc, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create a Custom DivIcon for Driver Location (Truck / Car element)
    const driverIcon = L.divIcon({
      className: "driver-custom-marker",
      html: `<div class="h-6 w-6 rounded-full bg-brand-yellow border-2 border-white flex items-center justify-center shadow-lg text-brand-forest font-bold text-[12px] animate-pulse">🚚</div>`,
      iconSize: [24, 24],
    });

    // Add Driver Location Marker
    const driverMarker = L.marker(loc, { icon: driverIcon })
      .addTo(map)
      .bindPopup("<strong>Your Position (Driver)</strong>")
      .openPopup();
    markersRef.current.push(driverMarker);

    const bounds = L.latLngBounds([loc]);

    // Fetch routing geometries and draw paths
    async function calculateRoutes() {
      const detailsList: any[] = [];
      const validDestinations = assignedRoute.filter(d => d.latitude !== null && d.longitude !== null);

      for (let i = 0; i < validDestinations.length; i++) {
        const dest = validDestinations[i];
        const destLat = dest.latitude!;
        const destLng = dest.longitude!;
        const routeColor = colors[i % colors.length];

        bounds.extend([destLat, destLng]);

        // Place Destination Marker
        const destMarker = L.marker([destLat, destLng])
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; color: #1f2937;">
              <strong style="color: #1B5E20; font-size: 12px; display: block; margin-bottom: 4px;">${dest.customer}</strong>
              <strong>Order:</strong> ${dest.order}<br/>
              <strong>Zone:</strong> ${dest.zone}<br/>
              <strong>Crates:</strong> ${dest.crates}
            </div>
          `);
        markersRef.current.push(destMarker);

        try {
          // Fetch route from OSRM demo routing server
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${loc[1]},${loc[0]};${destLng},${destLat}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

            // Draw Polyline path
            const polyline = L.polyline(coordinates, {
              color: routeColor,
              weight: 4,
              opacity: 0.6,
            }).addTo(map);

            polylinesRef.current.push(polyline);

            const distKmNum = route.distance / 1000;
            const distanceKm = distKmNum.toFixed(1);
            const durationMins = Math.round(route.duration / 60);

            const fuelNeededLiters = distKmNum * vehicleConsumption;
            const fuelCostUgx = fuelNeededLiters * 5500;
            const formattedCost = "UGX " + Math.round(fuelCostUgx).toLocaleString("en-US");

            detailsList.push({
              deliveryId: dest.id,
              customer: dest.customer,
              order: dest.order,
              distance: `${distanceKm} km`,
              duration: `${durationMins} mins`,
              fuelNeeded: fuelNeededLiters,
              fuelCost: formattedCost,
              color: routeColor,
              polyline: polyline,
            });

            // Bind click to Polyline to highlight it
            polyline.on("click", () => {
              setSelectedRouteId(dest.id);
            });
          }
        } catch (err) {
          console.error("OSRM Routing failed for destination:", dest.customer, err);
        }
      }

      setRouteDetails(detailsList);

      // Fit map views to fit driver and all active destinations cleanly
      if (validDestinations.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    calculateRoutes();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      polylinesRef.current = [];
      markersRef.current = [];
    };
  }, [loading, driverLocation, assignedRoute]);

  // Handle polyline selection/highlighting
  useEffect(() => {
    routeDetails.forEach((route) => {
      if (route.polyline) {
        if (route.deliveryId === selectedRouteId) {
          route.polyline.setStyle({ weight: 7, opacity: 1.0, color: "#1B5E20" }); // highlight in brand green
          route.polyline.bringToFront();
        } else {
          route.polyline.setStyle({ weight: 4, opacity: 0.6, color: route.color });
        }
      }
    });
  }, [selectedRouteId, routeDetails]);

  if (loading) {
    return (
      <div className="h-64 bg-brand-sage/10 border border-brand-sage rounded-2xl flex flex-col items-center justify-center text-center p-4">
        <div className="h-8 w-8 border-4 border-brand-forest border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-brand-forest font-bold">Acquiring current GPS location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Map Render Node */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-56 rounded-2xl border border-brand-sage overflow-hidden shadow-inner relative z-10" 
      />

      {/* Geolocation warning banner */}
      {geoWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-3 rounded-xl flex items-start gap-2 animate-fadeIn shrink-0">
          <span className="text-amber-500 font-bold shrink-0">⚠️</span>
          <div className="flex-1 font-medium">{geoWarning}</div>
        </div>
      )}

      {/* Interactive Stop Visual Comparison Timeline */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">Compare Destination Routes</h4>
        {routeDetails.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic px-1">No coordinates saved for these delivery destinations. Please update client addresses with coordinate mapping pins.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {routeDetails.map((route) => {
              const isSelected = selectedRouteId === route.deliveryId;
              return (
                <button
                  type="button"
                  key={route.deliveryId}
                  onClick={() => setSelectedRouteId(route.deliveryId)}
                  className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-brand-sage/15 border-brand-mid shadow-sm scale-[1.01]" 
                      : "bg-white border-brand-sage/40 hover:border-brand-mid/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="h-3 w-3 rounded-full shrink-0 border border-white shadow-sm" 
                      style={{ backgroundColor: isSelected ? "#1B5E20" : route.color }}
                    />
                    <div>
                      <h5 className="font-extrabold text-xs text-brand-forest leading-tight">{route.customer}</h5>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="bg-brand-yellow/15 text-[#C47B00] font-mono text-[8px] font-bold px-1 py-0.2 rounded">{route.order}</span>
                        {route.fuelNeeded !== undefined && (
                          <span className="text-[9px] text-brand-forest/70 font-semibold bg-brand-sage/20 px-1.5 py-0.5 rounded border border-brand-sage/35">
                            Est. Fuel: {route.fuelNeeded.toFixed(1)} L ({route.fuelCost})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs text-brand-forest">{route.duration}</p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{route.distance}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
