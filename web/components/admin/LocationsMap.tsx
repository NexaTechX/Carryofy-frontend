import { useCallback, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LocationPoint } from '../../lib/admin/types';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const RIDER_COLOR = '#f97316';
const BUYER_COLOR = '#14b8a6';
const SELLER_COLOR = '#22c55e';

interface LocationsMapProps {
  riders: LocationPoint[];
  buyers: LocationPoint[];
  sellers: LocationPoint[];
  filter: 'all' | 'RIDER' | 'BUYER' | 'SELLER';
  center?: [number, number];
  onSelectEntity: (point: LocationPoint) => void;
  showCoverageZones?: boolean;
  isFullscreen?: boolean;
  onFullscreenChange?: (v: boolean) => void;
  onToggleCoverageZones?: (v: boolean) => void;
}

/** Sample Lagos coverage zones (GeoJSON) for overlay */
const LAGOS_COVERAGE_ZONES = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Ikeja' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [3.34, 6.58],
            [3.38, 6.58],
            [3.42, 6.55],
            [3.40, 6.50],
            [3.35, 6.50],
            [3.34, 6.58],
          ],
        ],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Victoria Island' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [3.41, 6.42],
            [3.44, 6.42],
            [3.44, 6.40],
            [3.41, 6.40],
            [3.41, 6.42],
          ],
        ],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Lekki' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [3.46, 6.43],
            [3.52, 6.43],
            [3.52, 6.38],
            [3.46, 6.38],
            [3.46, 6.43],
          ],
        ],
      },
    },
  ],
};

function getColor(role: LocationPoint['role']): string {
  switch (role) {
    case 'RIDER': return RIDER_COLOR;
    case 'BUYER': return BUYER_COLOR;
    case 'SELLER': return SELLER_COLOR;
    default: return '#888';
  }
}

function visibleByFilter(role: LocationPoint['role'], filter: LocationsMapProps['filter']): boolean {
  if (filter === 'all') return true;
  return role === filter;
}

export default function LocationsMap({
  riders,
  buyers,
  sellers,
  filter,
  center = [3.3792, 6.5244],
  onSelectEntity,
  showCoverageZones = false,
  isFullscreen = false,
  onFullscreenChange,
  onToggleCoverageZones,
}: LocationsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ marker: maplibregl.Marker; point: LocationPoint; role: LocationPoint['role'] }[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) map.resize();
  }, [isFullscreen]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_STYLE,
      center,
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      if (map.getSource('coverage-zones')) {
        map.removeLayer('coverage-zones-fill');
        map.removeLayer('coverage-zones-line');
        map.removeSource('coverage-zones');
      }
      map.remove();
      mapRef.current = null;
    };
  }, [center[0], center[1]]);

  const allPoints = useCallback(() => {
    const list: { point: LocationPoint; role: LocationPoint['role'] }[] = [];
    riders.forEach((p) => list.push({ point: p, role: 'RIDER' }));
    buyers.forEach((p) => list.push({ point: p, role: 'BUYER' }));
    sellers.forEach((p) => list.push({ point: p, role: 'SELLER' }));
    return list;
  }, [riders, buyers, sellers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    const list = allPoints();
    list.forEach(({ point, role }) => {
      const color = getColor(role);
      const visible = visibleByFilter(role, filter);
      const el = document.createElement('div');
      el.className = 'location-marker transition-all duration-300';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid rgba(255,255,255,0.9)';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.5)';
      el.style.cursor = 'pointer';
      el.style.opacity = visible ? '1' : '0.25';
      el.style.transform = visible ? 'scale(1)' : 'scale(0.85)';
      el.dataset.role = role;
      el.dataset.userId = point.userId;
      const title = point.label || `${role} ${point.userId.slice(0, 8)}`;
      el.title = title;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .addTo(map);

      el.addEventListener('click', () => onSelectEntity(point));

      markersRef.current.push({ marker, point, role });
    });
  }, [allPoints, filter, onSelectEntity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(({ marker, role }) => {
      const el = marker.getElement();
      const visible = visibleByFilter(role, filter);
      (el as HTMLElement).style.opacity = visible ? '1' : '0.25';
      (el as HTMLElement).style.transform = visible ? 'scale(1)' : 'scale(0.85)';
    });
  }, [filter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addCoverageZones = () => {
      if (map.getSource('coverage-zones')) return;
      map.addSource('coverage-zones', {
        type: 'geojson',
        data: LAGOS_COVERAGE_ZONES,
      });
      map.addLayer({
        id: 'coverage-zones-fill',
        type: 'fill',
        source: 'coverage-zones',
        paint: {
          'fill-color': 'rgba(59, 130, 246, 0.12)',
          'fill-outline-color': 'rgba(59, 130, 246, 0.4)',
        },
      });
      map.addLayer({
        id: 'coverage-zones-line',
        type: 'line',
        source: 'coverage-zones',
        paint: {
          'line-color': 'rgba(59, 130, 246, 0.5)',
          'line-width': 1.5,
        },
      });
    };

    const removeCoverageZones = () => {
      if (map.getLayer('coverage-zones-fill')) map.removeLayer('coverage-zones-fill');
      if (map.getLayer('coverage-zones-line')) map.removeLayer('coverage-zones-line');
      if (map.getSource('coverage-zones')) map.removeSource('coverage-zones');
    };

    const runWhenStyleLoaded = (fn: () => void) => {
      if (map.isStyleLoaded()) {
        fn();
      } else {
        map.once('load', fn);
      }
    };

    if (showCoverageZones) {
      runWhenStyleLoaded(addCoverageZones);
    } else {
      runWhenStyleLoaded(removeCoverageZones);
    }
  }, [showCoverageZones]);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    onFullscreenChange?.(next);
  };

  return (
    <div className="relative h-[500px] w-full" style={{ minHeight: '400px' }}>
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-[#2a2a2a] bg-[#111111]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Legend</div>
        <div className="mt-1.5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RIDER_COLOR }} />
            <span className="text-sm text-gray-300">Riders</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BUYER_COLOR }} />
            <span className="text-sm text-gray-300">Buyers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SELLER_COLOR }} />
            <span className="text-sm text-gray-300">Sellers</span>
          </div>
        </div>
      </div>

      {/* Map controls: fullscreen, route trails, coverage zones */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg border border-[#2a2a2a] bg-[#111111]/95 p-2 text-gray-400 shadow backdrop-blur-sm transition hover:bg-[#1f1f1f] hover:text-white"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
        {onToggleCoverageZones && (
          <button
            type="button"
            onClick={() => onToggleCoverageZones(!showCoverageZones)}
            className={`rounded-lg border p-2 shadow backdrop-blur-sm transition ${
              showCoverageZones
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-[#2a2a2a] bg-[#111111]/95 text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
            }`}
            title="Sample coverage areas (Ikeja, Victoria Island, Lekki)"
            aria-label="Toggle coverage zones"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
