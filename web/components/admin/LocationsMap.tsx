import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LocationPoint } from '../../lib/admin/types';

interface LocationsMapProps {
  riders: LocationPoint[];
  buyers: LocationPoint[];
  sellers: LocationPoint[];
  center?: [number, number];
}

const RIDER_COLOR = '#f97316';
const BUYER_COLOR = '#22d3ee';
const SELLER_COLOR = '#4ade80';

export default function LocationsMap({
  riders,
  buyers,
  sellers,
  center = [3.3792, 6.5244],
}: LocationsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [center[0], center[1]]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const createMarker = (point: LocationPoint, color: string) => {
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
      el.style.cursor = 'pointer';
      const title = point.label || `${point.role} ${point.userId.slice(0, 8)}`;
      el.title = title;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div class="p-2 text-sm"><strong>${point.role}</strong><br/>${title}${point.lastUpdated ? `<br/><span class="text-gray-500">Updated: ${new Date(point.lastUpdated).toLocaleString()}</span>` : ''}</div>`
          )
        )
        .addTo(map);
      markersRef.current.push(marker);
    };

    riders.forEach((p) => createMarker(p, RIDER_COLOR));
    buyers.forEach((p) => createMarker(p, BUYER_COLOR));
    sellers.forEach((p) => createMarker(p, SELLER_COLOR));
  }, [riders, buyers, sellers]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[500px] w-full"
      style={{ minHeight: '400px' }}
    />
  );
}
