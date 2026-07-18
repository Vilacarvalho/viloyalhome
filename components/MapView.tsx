"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coords } from "@/lib/types";

export default function MapView({ coords }: { coords: Coords }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([coords.lat, coords.lon], 18);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(mapRef.current);

        // DivIcon avoids Leaflet's broken default marker-image paths under bundlers.
        const pin = L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#3ba676;border:3px solid #fff;box-shadow:0 0 0 2px #3ba676"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        markerRef.current = L.marker([coords.lat, coords.lon], { icon: pin }).addTo(
          mapRef.current
        );
      } else {
        mapRef.current.setView([coords.lat, coords.lon], 18);
        markerRef.current?.setLatLng([coords.lat, coords.lon]);
      }

      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      if (coords.accuracy && coords.accuracy > 0) {
        circleRef.current = L.circle([coords.lat, coords.lon], {
          radius: coords.accuracy,
          color: "#3ba676",
          weight: 1,
          fillColor: "#3ba676",
          fillOpacity: 0.12,
        }).addTo(mapRef.current);
      }

      // The container starts hidden/animated in; nudge Leaflet to remeasure.
      setTimeout(() => mapRef.current?.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
    };
  }, [coords]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-xl border border-line"
      aria-label="Mapa da localização do imóvel"
    />
  );
}
