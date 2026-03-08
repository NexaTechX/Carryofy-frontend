import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/admin/AdminLayout';
import { LocationEntityDrawer } from '../../components/admin/LocationEntityDrawer';
import LocationsTable from '../../components/admin/LocationsTable';
import { AdminEmptyState, AdminPageHeader, LoadingState } from '../../components/admin/ui';
import { fetchAdminLocations } from '../../lib/admin/api';
import type { AdminLocationsResponse, LocationPoint } from '../../lib/admin/types';
import { Map, List, Search } from 'lucide-react';

const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];

const LocationsMap = dynamic(
  () => import('../../components/admin/LocationsMap'),
  { ssr: false }
);

type FilterValue = 'all' | 'RIDER' | 'BUYER' | 'SELLER';
type ViewMode = 'map' | 'table';

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
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<LocationPoint | null>(null);
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminLocations()
      .then((res) => {
        setData(res);
        setLastFetched(new Date());
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load locations');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const riders = data?.riders ?? [];
  const buyers = data?.buyers ?? [];
  const sellers = data?.sellers ?? [];
  const ridersActive = riders.some((p) => isActive(p));
  const sellersActive = sellers.some((p) => isActive(p));

  return (
    <>
      <Head>
        <title>Location Intelligence - Admin | Carryofy</title>
      </Head>
      <AdminLayout>
        <div className="min-h-screen bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
            <AdminPageHeader
              title="Location Intelligence"
              tag="Operations Map"
              subtitle="Real-time rider positions, seller stores, and buyer delivery addresses across Lagos. Filter by role, click a marker for details."
              meta={
                <span className="text-sm text-gray-500">
                  Last updated: {lastFetched ? lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                </span>
              }
              actions={
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-border-custom bg-card text-primary focus:ring-primary"
                    />
                    <span>Auto-refresh (45s)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => load()}
                    disabled={loading}
                    className="rounded-lg border border-border-custom bg-card px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
                  >
                    {loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              }
            />

            {/* Stat cards: riders and sellers show active pulse; buyers do not (no lastUpdated) */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-[#f97316] bg-card p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ boxShadow: '0 0 0 1px rgba(249,115,22,0.2)' }}
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
                className="relative overflow-hidden rounded-2xl border-2 border-[#14b8a6] bg-card p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ boxShadow: '0 0 0 1px rgba(20,184,166,0.2)' }}
              >
                <p className="text-2xl font-semibold text-white">{buyers.length}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Buyers</h3>
                <p className="text-sm text-gray-400">Latest delivery address per buyer</p>
              </div>
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-[#22c55e] bg-card p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]"
                style={{ boxShadow: '0 0 0 1px rgba(34,197,94,0.2)' }}
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

            {/* View toggle + filter tabs + search */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">View</span>
                <div className="flex rounded-lg border border-border-custom p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      viewMode === 'map'
                        ? 'bg-primary text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Map className="h-4 w-4" />
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      viewMode === 'table'
                        ? 'bg-primary text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    Table
                  </button>
                </div>
                <span className="mx-2 h-4 w-px bg-border-custom" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Filter</span>
                {(['all', 'RIDER', 'BUYER', 'SELLER'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      filter === f
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-card text-gray-300 hover:bg-[#2a2a2a] border border-border-custom'
                    }`}
                  >
                    {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
                  </button>
                ))}
              </div>
              {viewMode === 'table' && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full rounded-lg border border-border-custom bg-card pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
                {error}
              </div>
            )}

            {loading && !data ? (
              <LoadingState label="Loading locations..." />
            ) : riders.length === 0 && buyers.length === 0 && sellers.length === 0 ? (
              <AdminEmptyState
                title="No location data yet"
                description="Riders, buyers (from delivery addresses), and sellers will appear here once they have location data."
                action={
                  <button
                    type="button"
                    onClick={() => load()}
                    className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                  >
                    Refresh
                  </button>
                }
              />
            ) : viewMode === 'map' ? (
              <div
                className={`overflow-hidden rounded-2xl border border-border-custom bg-card ${isMapFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : ''}`}
              >
                <LocationsMap
                  riders={riders}
                  buyers={buyers}
                  sellers={sellers}
                  filter={filter}
                  center={LAGOS_CENTER}
                  onSelectEntity={(point) => setSelectedEntity(point)}
                  showCoverageZones={showCoverageZones}
                  isFullscreen={isMapFullscreen}
                  onFullscreenChange={setIsMapFullscreen}
                  onToggleCoverageZones={setShowCoverageZones}
                />
              </div>
            ) : (
              <LocationsTable
                riders={riders}
                buyers={buyers}
                sellers={sellers}
                filter={filter}
                searchQuery={searchQuery}
                onSelectEntity={(point) => setSelectedEntity(point)}
              />
            )}
          </div>
        </div>

        <LocationEntityDrawer
          entity={selectedEntity}
          open={selectedEntity !== null}
          onClose={() => setSelectedEntity(null)}
        />
      </AdminLayout>
    </>
  );
}
