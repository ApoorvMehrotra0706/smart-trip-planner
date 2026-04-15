"use client";
import { useEffect, useRef } from "react";
import { Place } from "../lib/types";

interface Props {
  places: Place[];
}

export default function TripMap({ places }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current!, {
          center: [20, 0],
          zoom: 2,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }).addTo(leafletMap.current);
      }

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      if (places.length === 0) return;

      // Add markers
      places.forEach((place, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;background:#7c3aed;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([place.lat, place.lon], { icon })
          .addTo(leafletMap.current!)
          .bindPopup(`<b>${place.name}</b>`);
        markersRef.current.push(marker);
      });

      // Draw route line between places
      if (places.length > 1) {
        const latlngs = places.map(p => [p.lat, p.lon] as [number, number]);
        L.polyline(latlngs, { color: "#7c3aed", weight: 2.5, dashArray: "6,6", opacity: 0.8 }).addTo(leafletMap.current!);
      }

      // Fit bounds
      const bounds = L.latLngBounds(places.map(p => [p.lat, p.lon] as [number, number]));
      leafletMap.current!.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    });
  }, [places]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: "#0d0d12" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" style={{ background: "#0d0d12" }} />
      {places.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-slate-500 text-sm">Add places to see them on the map</p>
        </div>
      )}
    </div>
  );
}
