'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X } from 'lucide-react';

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

const DEFAULT_CENTER: [number, number] = [3.3792, 6.5244]; // Lagos

interface DeliveryMapModalProps {
  open: boolean;
  onClose: () => void;
  pickup?: MapPoint | null;
  dropoff?: MapPoint | null;
  title?: string;
}

export function DeliveryMapModal({
  open,
  onClose,
  pickup,
  dropoff,
  title = 'View on Map',
}: DeliveryMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    }

    const pickupCoord = pickup ? [pickup.lng, pickup.lat] as [number, number] : null;
    const dropoffCoord = dropoff ? [dropoff.lng, dropoff.lat] as [number, number] : null;
    const center: [number, number] =
      pickupCoord ?? dropoffCoord ?? DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom: 12,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    const addMarker = (lngLat: [number, number], label: string, isPickup: boolean) => {
      const el = document.createElement('div');
      el.className = 'rounded-full border-2 border-white shadow-lg';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = isPickup ? '#ff6600' : '#6ce7a2';
      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
        `<div class="text-sm font-medium text-gray-900">${label}</div>`
      );
      const marker = new maplibregl.Marker({ element: el }).setLngLat(lngLat).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    };

    if (pickupCoord) {
      addMarker(pickupCoord, pickup?.label ?? 'Pickup', true);
    } else if (!dropoffCoord) {
      addMarker(center, 'Pickup (warehouse)', true);
    }

    if (dropoffCoord) {
      addMarker(dropoffCoord, dropoff?.label ?? 'Drop-off', false);
    } else if (!pickupCoord) {
      const offset: [number, number] = [center[0] + 0.01, center[1] + 0.01];
      addMarker(offset, 'Drop-off', false);
    }

    const bounds = new LngLatBounds();
    if (pickupCoord) bounds.extend(pickupCoord);
    if (dropoffCoord) bounds.extend(dropoffCoord);
    if (!pickupCoord && !dropoffCoord) {
      bounds.extend(center);
      bounds.extend([center[0] + 0.02, center[1] + 0.02]);
    }
    if (bounds.getNorth() - bounds.getSouth() > 0.001 || bounds.getWest() !== bounds.getEast()) {
      map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 14 });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [open, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0f1729] shadow-xl">
        <header className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div ref={mapContainerRef} className="h-[320px] w-full" aria-label="Delivery map" />
        <div className="flex gap-4 border-t border-[#1f1f1f] px-4 py-3 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" /> Pickup
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#6ce7a2]" /> Drop-off
          </span>
        </div>
      </div>
    </div>
  );
}
