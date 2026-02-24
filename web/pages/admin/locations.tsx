import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, LoadingState } from '../../components/admin/ui';
import { fetchAdminLocations } from '../../lib/admin/api';
import type { AdminLocationsResponse, LocationPoint } from '../../lib/admin/types';

const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];

const LocationsMap = dynamic(
  () => import('../../components/admin/LocationsMap'),
  { ssr: false }
);

type FilterValue = 'all' | 'RIDER' | 'BUYER' | 'SELLER';

function isActive(point: LocationPoint, windowMs = 15 * 60 * 1000): boolean {
  if (!point.lastUpdated) return false;
  const t = new Date(point.lastUpdated).getTime();
  return Date.now() - t <= windowMs;
}

export default function AdminLocationsPage() {
  const [data, setData] = useState<AdminLocationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<LocationPoint | null>(null);
  const [showRouteTrails, setShowRouteTrails] = useState(false);
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminLocations()
      .then((res) => {
        setData(res);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load locations');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    load();
    return () => { cancelled = true; };
  }, [load]);

  const riders = data?.riders ?? [];
  const buyers = data?.buyers ?? [];
  const sellers = data?.sellers ?? [];
  const ridersActive = riders.some((p) => isActive(p));
  const buyersActive = buyers.some((p) => isActive(p));
  const sellersActive = sellers.some((p) => isActive(p));

  return (
    <>
      <Head>
        <title>Locations - Admin | Carryofy</title>
      </Head>
      <AdminLayout>
        <div className="min-h-screen bg-[#090c11]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
            <AdminPageHeader
              title="Live locations"
              tag="Map"
              subtitle="Riders, buyers (delivery addresses), and sellers across Lagos. Filter by role below."
            />

            {/* Last updated + refresh */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </span>
              <button
                type="button"
                onClick={() => load()}
                disabled={loading}
                className="rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {/* Stat cards with accent borders and pulse */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-[#f97316] bg-[#111111] p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ borderColor: '#f97316', boxShadow: '0 0 0 1px rgba(249,115,22,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-white">{riders.length}</p>
                  {ridersActive && (
                    <span className="relative flex h-2 w-2" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f97316] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f97316]" />
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">Riders</h3>
                <p className="text-sm text-gray-400">Active riders with GPS</p>
              </div>
              <div
                className="relative overflow-hidden rounded-2xl border-2 bg-[#111111] p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ borderColor: '#14b8a6', boxShadow: '0 0 0 1px rgba(20,184,166,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-white">{buyers.length}</p>
                  {buyersActive && (
                    <span className="relative flex h-2 w-2" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14b8a6] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14b8a6]" />
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">Buyers</h3>
                <p className="text-sm text-gray-400">Latest delivery address per buyer</p>
              </div>
              <div
                className="relative overflow-hidden rounded-2xl border-2 bg-[#111111] p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ borderColor: '#22c55e', boxShadow: '0 0 0 1px rgba(34,197,94,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-white">{sellers.length}</p>
                  {sellersActive && (
                    <span className="relative flex h-2 w-2" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">Sellers</h3>
                <p className="text-sm text-gray-400">Business location set</p>
              </div>
            </section>

            {/* Filter tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(['all', 'RIDER', 'BUYER', 'SELLER'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    filter === f
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
                {error}
              </div>
            )}

            {loading && !data ? (
              <LoadingState label="Loading locations..." />
            ) : (
              <div
                className={`overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#111111] ${isMapFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : ''}`}
              >
                <LocationsMap
                  riders={riders}
                  buyers={buyers}
                  sellers={sellers}
                  filter={filter}
                  center={LAGOS_CENTER}
                  selectedEntity={selectedEntity}
                  onSelectEntity={setSelectedEntity}
                  showRouteTrails={showRouteTrails}
                  showCoverageZones={showCoverageZones}
                  isFullscreen={isMapFullscreen}
                  onFullscreenChange={setIsMapFullscreen}
                  onToggleRouteTrails={setShowRouteTrails}
                  onToggleCoverageZones={setShowCoverageZones}
                />
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
