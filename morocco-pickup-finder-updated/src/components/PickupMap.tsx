import { useEffect, useRef, useState } from "react";
import type { Station } from "@/data/stations";

const PROVIDER_COLORS: Record<string, string> = {
  jumia: "f97316",
  pickup: "2563eb",
  amana: "166534",
};

function makePin(color: string, active: boolean) {
  const size = active ? [40, 60] : [32, 48];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36' width='${size[0]}' height='${size[1]}'>
    <path d='M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z' fill='%23${color}' stroke='white' stroke-width='1.5'/>
    <circle cx='12' cy='12' r='4.5' fill='white'/>
  </svg>`;
  return { url: `data:image/svg+xml;utf8,${svg.replace(/\n/g, "")}`, size };
}

type Props = {
  stations: Station[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

export function PickupMap({ stations, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  // Client-only Leaflet bootstrap
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(
        [31.7917, -7.0926],
        6,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !ready) return;

    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    stations.forEach((s) => {
      const color = PROVIDER_COLORS[s.provider] || "c2410c";
      const isActive = s.id === activeId;
      const pin = makePin(isActive ? "166534" : color, isActive);
      const icon = L.icon({
        iconUrl: pin.url,
        iconSize: pin.size,
        iconAnchor: [pin.size[0] / 2, pin.size[1]],
        popupAnchor: [0, -pin.size[1] + 4],
      });
      const marker = L.marker([s.lat, s.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:inherit;min-width:200px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#9a3412;font-weight:600">${s.providerLabel}</div>
            <div style="font-weight:600;margin:2px 0 4px">${s.name}</div>
            <div style="font-size:12px;color:#57534e">${s.address}</div>
            <div style="font-size:12px;color:#57534e;margin-top:2px">${s.city}</div>
            ${s.hours ? `<div style="font-size:12px;margin-top:4px">⏰ ${s.hours}</div>` : ""}
            ${s.phone ? `<div style="font-size:12px">📞 ${s.phone}</div>` : ""}
            ${s.mapLink ? `<div style="font-size:12px;margin-top:6px"><a href="${s.mapLink}" target="_blank" rel="noopener" style="color:#c2410c;font-weight:500">↗ Voir sur Google Maps</a></div>` : ""}
          </div>`,
        );
      marker.on("click", () => onSelect?.(s.id));
      markersRef.current[s.id] = marker;
    });

    if (stations.length > 0 && !activeId) {
      const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [stations, activeId, ready, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId || !ready) return;
    const s = stations.find((s) => s.id === activeId);
    if (!s) return;
    map.flyTo([s.lat, s.lng], 14, { duration: 0.8 });
    markersRef.current[activeId]?.openPopup();
  }, [activeId, stations, ready]);

  return <div ref={containerRef} className="h-full w-full rounded-2xl overflow-hidden border border-border shadow-sm bg-secondary" />;
}
