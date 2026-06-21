"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface AdminTrackingMapProps {
  customerLat: number;
  customerLng: number;
  customerName: string;
  currentLat: number | null;
  currentLng: number | null;
  locationHistory: Array<[number, number]> | null;
  status: string;
}

export default function AdminTrackingMap({
  customerLat,
  customerLng,
  customerName,
  currentLat,
  currentLng,
  locationHistory,
  status,
}: AdminTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const pathTakenPolylineRef = useRef<L.Polyline | null>(null);
  const pathRemainingPolylineRef = useRef<L.Polyline | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for client-side mounting
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    // Fix default marker icon issue in Leaflet when bundled
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Initialize Map at Kampala area initially
    const initialCenter: [number, number] = currentLat !== null && currentLng !== null 
      ? [currentLat, currentLng] 
      : [customerLat, customerLng];

    const map = L.map(mapContainerRef.current).setView(initialCenter, 14);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Customer Marker (🏁 Flag Icon)
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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      driverMarkerRef.current = null;
      customerMarkerRef.current = null;
      pathTakenPolylineRef.current = null;
      pathRemainingPolylineRef.current = null;
    };
  }, [loading]);

  // Update Map layers (Driver Marker, Path Taken, Path Remaining) when props change
  useEffect(() => {
    if (!mapRef.current || loading) return;

    const map = mapRef.current;
    let isMounted = true;

    async function updateRoutesAndBounds() {
      const bounds = L.latLngBounds([[customerLat, customerLng]]);

      // 1. Driver Marker
      if ((status === "in_transit" || status === "assigned") && (currentLat !== null || status === "assigned")) {
        const driverPos: [number, number] = status === "assigned"
          ? [0.3476, 32.5825]
          : [currentLat!, currentLng!];
        bounds.extend(driverPos);

        const driverIcon = L.divIcon({
          className: "driver-custom-marker",
          html: `<div class="h-10 w-10 rounded-full bg-[#F59E0B] border-2 border-white flex items-center justify-center shadow-lg text-[20px] animate-pulse">🚚</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng(driverPos);
        } else {
          const marker = L.marker(driverPos, { icon: driverIcon })
            .addTo(map)
            .bindPopup(status === "assigned" ? "<strong>Driver at Depot (Assigned)</strong>" : "<strong>Driver Position</strong>");
          driverMarkerRef.current = marker;
        }
      } else {
        // Remove driver marker if completed or no active transit
        if (driverMarkerRef.current) {
          driverMarkerRef.current.remove();
          driverMarkerRef.current = null;
        }
      }

      // 2. Draw Polyline for Path Taken (Dark Blue) - If we have custom location history
      const hasCustomHistory = locationHistory && locationHistory.length >= 2;
      if (hasCustomHistory) {
        const pathCoordinates = locationHistory!.map(pt => [pt[0], pt[1]] as [number, number]);
        pathCoordinates.forEach(pt => bounds.extend(pt));

        if (pathTakenPolylineRef.current) {
          pathTakenPolylineRef.current.setLatLngs(pathCoordinates);
        } else {
          const polyline = L.polyline(pathCoordinates, {
            color: "#1E3A8A", // Dark Blue
            weight: 6,
            opacity: 0.95,
          }).addTo(map);
          pathTakenPolylineRef.current = polyline;
        }
      }

      // 3. Handle OSRM Route Fetches for Remaining Path (light blue) and Fallback Path Taken (dark blue)
      const needRemainingRoute = (status === "in_transit" && currentLat !== null && currentLng !== null) || (status === "assigned");
      const needFallbackDeliveredRoute = (status === "delivered" && !hasCustomHistory);

      const remainingStartLat = status === "in_transit" ? currentLat : 0.3476;
      const remainingStartLng = status === "in_transit" ? currentLng : 32.5825;

      // Clear remaining path if not en route or assigned
      if (!needRemainingRoute) {
        if (pathRemainingPolylineRef.current) {
          pathRemainingPolylineRef.current.remove();
          pathRemainingPolylineRef.current = null;
        }
      }

      // Clear path taken fallback if we have actual history
      if (hasCustomHistory) {
        // Already drawn above, no fallback needed
      } else if (!needFallbackDeliveredRoute) {
        // Clear path taken if not completed (since it has no history yet)
        if (pathTakenPolylineRef.current) {
          pathTakenPolylineRef.current.remove();
          pathTakenPolylineRef.current = null;
        }
      }

      try {
        // Fetch OSRM route for remaining path (light blue dashed)
        if (needRemainingRoute && remainingStartLat !== null && remainingStartLng !== null) {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${remainingStartLng},${remainingStartLat};${customerLng},${customerLat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (!isMounted || !mapRef.current) return;

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            coordinates.forEach((pt: [number, number]) => bounds.extend(pt));

            if (pathRemainingPolylineRef.current) {
              pathRemainingPolylineRef.current.setLatLngs(coordinates);
            } else {
              const polyline = L.polyline(coordinates, {
                color: "#60A5FA", // Lighter Blue
                weight: 6,
                opacity: 0.75,
                dashArray: "10, 10",
              }).addTo(map);
              pathRemainingPolylineRef.current = polyline;
            }
          }
        }

        // Fetch OSRM route for completed fallback path taken (dark blue solid)
        if (needFallbackDeliveredRoute) {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/32.5825,0.3476;${customerLng},${customerLat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (!isMounted || !mapRef.current) return;

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            coordinates.forEach((pt: [number, number]) => bounds.extend(pt));

            if (pathTakenPolylineRef.current) {
              pathTakenPolylineRef.current.setLatLngs(coordinates);
            } else {
              const polyline = L.polyline(coordinates, {
                color: "#1E3A8A", // Dark Blue (representing path taken)
                weight: 6,
                opacity: 0.95,
              }).addTo(map);
              pathTakenPolylineRef.current = polyline;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch OSRM route:", err);
      }

      if (isMounted) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    updateRoutesAndBounds();

    return () => {
      isMounted = false;
    };
  }, [customerLat, customerLng, currentLat, currentLng, locationHistory, status, loading]);

  if (loading) {
    return (
      <div className="h-64 bg-brand-sage/10 border border-brand-sage rounded-2xl flex flex-col items-center justify-center text-center p-4">
        <div className="h-8 w-8 border-4 border-brand-forest border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-brand-forest font-bold">Loading Tracking Map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-2xl border border-brand-forest/20 overflow-hidden shadow-inner z-10 relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
      />
    </div>
  );
}
