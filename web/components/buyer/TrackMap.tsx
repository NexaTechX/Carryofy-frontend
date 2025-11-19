import { useEffect, useRef } from 'react';
import maplibregl, { GeoJSONSource, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Coordinate = {
  lat: number;
  lng: number;
};

interface TrackMapProps {
  routeCoords: Coordinate[];
  currentCoord: Coordinate | null;
}

export default function TrackMap({ routeCoords, currentCoord }: TrackMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: routeCoords.length ? [routeCoords[0].lng, routeCoords[0].lat] : [3.3792, 6.5244],
      zoom: 12,
      attributionControl: false,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [routeCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeCoords.length) {
      return;
    }

    const coords = routeCoords.map((coord) => [coord.lng, coord.lat]);
    const routeGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {},
    } as const;

    map.once('load', () => {
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: routeGeoJSON,
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#ff6600',
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });
      }
    });

    if (map.isStyleLoaded()) {
      const source = map.getSource('route') as GeoJSONSource | undefined;
      if (source) {
        source.setData(routeGeoJSON);
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: routeGeoJSON,
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#ff6600',
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });
      }
    }

    if (coords.length >= 2) {
      const bounds = coords.reduce((acc, coord) => acc.extend(coord as [number, number]), new LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]));
      map.fitBounds(bounds, { padding: 60, duration: 1000 });
    }
  }, [routeCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentCoord) {
      return;
    }

    const lngLat: [number, number] = [currentCoord.lng, currentCoord.lat];

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLngLat(lngLat);
    } else {
      vehicleMarkerRef.current = new maplibregl.Marker({ color: '#ff6600' })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [currentCoord]);

  if (!routeCoords.length) {
    return (
      <div className="w-full h-64 sm:h-72 lg:h-80 rounded-2xl bg-[#0d0d0d] border border-[#ff6600]/30 flex items-center justify-center text-[#ffcc99]/70">
        No map data available yet.
      </div>
    );
  }

  return <div ref={mapContainerRef} className="w-full h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden" />;
}

