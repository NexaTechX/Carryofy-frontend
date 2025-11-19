import { useEffect, useRef } from 'react';
import maplibregl, { GeoJSONSource, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type DriverStatus = 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface DeliveryTrip {
  id: string;
  driver: string;
  routeName: string;
  eta: string;
  status: DriverStatus;
  coordinates: [number, number][];
}

interface DeliveryMapProps {
  trips: DeliveryTrip[];
  center?: [number, number];
}

const STATUS_COLOR: Record<DriverStatus, string> = {
  IN_TRANSIT: '#ff6600',
  OUT_FOR_DELIVERY: '#76e4f7',
  DELIVERED: '#6ce7a2',
};

export default function DeliveryMap({ trips, center = [-122.4194, 37.7749] }: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const tripProgressRef = useRef<Record<string, number>>({});
  const animationRef = useRef<number | null>(null);
  const lastStepRef = useRef<number>(0);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const tripIds = new Set(trips.map((trip) => trip.id));

    Object.keys(markersRef.current).forEach((markerId) => {
      if (!tripIds.has(markerId)) {
        markersRef.current[markerId].remove();
        delete markersRef.current[markerId];
        delete tripProgressRef.current[markerId];
        if (map.getLayer(`route-${markerId}-line`)) {
          map.removeLayer(`route-${markerId}-line`);
        }
        if (map.getSource(`route-${markerId}`)) {
          map.removeSource(`route-${markerId}`);
        }
      }
    });

    trips.forEach((trip) => {
      if (trip.coordinates.length < 2) {
        return;
      }

      const sourceId = `route-${trip.id}`;
      const layerId = `route-${trip.id}-line`;
      const routeFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: trip.coordinates,
        },
        properties: {},
      };

      const setLayer = () => {
        const existingSource = map.getSource(sourceId) as GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData(routeFeature);
        } else {
          map.addSource(sourceId, { type: 'geojson', data: routeFeature });
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': STATUS_COLOR[trip.status],
              'line-width': 3,
              'line-opacity': 0.75,
            },
          });
        }
      };

      if (map.isStyleLoaded()) {
        setLayer();
      } else {
        map.once('load', setLayer);
      }

      if (!markersRef.current[trip.id]) {
        const markerEl = document.createElement('div');
        markerEl.className =
          'rounded-full border border-white/70 bg-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.45)]';
        markerEl.style.width = '18px';
        markerEl.style.height = '18px';

        const innerDot = document.createElement('span');
        innerDot.style.backgroundColor = STATUS_COLOR[trip.status];
        innerDot.style.borderRadius = '9999px';
        innerDot.style.display = 'block';
        innerDot.style.height = '10px';
        innerDot.style.margin = '4px auto';
        innerDot.style.width = '10px';
        markerEl.appendChild(innerDot);

        const popupContent = document.createElement('div');
        popupContent.className =
          'rounded-xl border border-white/10 bg-[#0f1729]/90 px-3 py-2 text-xs text-white';
        popupContent.innerHTML = `
          <div class="font-semibold text-sm">${trip.driver}</div>
          <div class="text-[11px] text-gray-300 uppercase tracking-[0.18em] mt-1">${trip.routeName}</div>
          <div class="mt-1 text-[11px] text-gray-400">ETA: ${trip.eta}</div>
        `;

        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat(trip.coordinates[0])
          .setPopup(
            new maplibregl.Popup({ closeButton: false, offset: 16 }).setDOMContent(popupContent)
          )
          .addTo(map);

        markersRef.current[trip.id] = marker;
        tripProgressRef.current[trip.id] =
          trip.status === 'DELIVERED' ? trip.coordinates.length - 1 : 0;
      } else if (trip.status === 'DELIVERED') {
        markersRef.current[trip.id].setLngLat(
          trip.coordinates[trip.coordinates.length - 1] as [number, number]
        );
        tripProgressRef.current[trip.id] = trip.coordinates.length - 1;
      }
    });

    if (trips.length) {
      let bounds: LngLatBounds | null = null;

      trips.forEach((trip) => {
        if (!trip.coordinates.length) {
          return;
        }

        if (!bounds) {
          bounds = new LngLatBounds(trip.coordinates[0], trip.coordinates[0]);
        }

        trip.coordinates.forEach((coord) => bounds!.extend(coord));
      });

      if (bounds) {
        map.fitBounds(bounds, { padding: 80, duration: 800 });
      }
    }
  }, [trips]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastStepRef.current > 1500) {
        trips.forEach((trip) => {
          const path = trip.coordinates;
          if (path.length < 2) {
            return;
          }

          const progress = tripProgressRef.current[trip.id] ?? 0;
          if (progress >= path.length - 1) {
            return;
          }

          const nextIndex = Math.min(progress + 1, path.length - 1);
          tripProgressRef.current[trip.id] = nextIndex;

          const marker = markersRef.current[trip.id];
          if (marker) {
            marker.setLngLat(path[nextIndex] as [number, number]);
          }
        });

        lastStepRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [trips]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[#0f1729] shadow-[0_30px_60px_-40px_rgba(255,102,0,0.45)]">
      <div
        ref={mapContainerRef}
        className="h-[320px] w-full sm:h-[360px] lg:h-[380px]"
        aria-label="Live delivery map"
      />
    </div>
  );
}

