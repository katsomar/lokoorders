"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    try {
      // Query OpenStreetMap Nominatim search biased to Uganda (countrycodes=ug)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ug`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
        setSearchError("No results found in Uganda. Try different keywords.");
      }
    } catch (err) {
      console.error("OSM Geocoding failed:", err);
      setSearchError("Location search service unavailable. Please locate manually.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);

    setSearchQuery(item.display_name.split(',')[0]); // set query to display name (short version)
    setSuggestions([]); // clear suggestions list

    if (mapRef.current && markerRef.current) {
      mapRef.current.invalidateSize();
      mapRef.current.setView([newLat, newLng], 15); // zoom in closer
      markerRef.current.setLatLng([newLat, newLng]);
      onChange(newLat, newLng);
    }
  };

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

    // Observe container size to resolve Leaflet tile misalignment issue inside modals/transitions
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Fallback: Trigger map invalidation check after the transition animation finishes
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

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

    // Handle Drag Events to update coordinates
    marker.on("dragstart", () => {
      setSuggestions([]); // Clear autocomplete suggestions on pin drag
    });

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChange(position.lat, position.lng);
    });

    // Handle Map Click to place marker and update coordinates
    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      onChange(clickLat, clickLng);
      setSuggestions([]); // Clear suggestions on map interaction
    });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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
        mapRef.current.invalidateSize();
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      {/* Search Bar & Autocomplete suggestions container */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search location (e.g. Acacia Mall, Lugogo Shoprite...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            className="flex-1 h-9 px-3 text-xs rounded-xl border border-brand-sage/50 bg-white placeholder:text-gray-300 font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="h-9 px-3.5 bg-brand-forest text-white font-extrabold hover:bg-brand-mid rounded-xl text-xs flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            Search
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-sage/50 rounded-xl shadow-lg z-50 divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item.place_id}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-brand-sage/10 text-xs font-semibold text-gray-800 block leading-tight transition-colors cursor-pointer"
              >
                <div className="font-extrabold text-brand-forest">{item.display_name.split(',')[0]}</div>
                <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{item.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && (
        <p className="text-[10px] text-amber-600 font-semibold px-1">{searchError}</p>
      )}

      {/* Map display */}
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
