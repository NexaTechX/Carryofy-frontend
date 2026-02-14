import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, AdminCard, LoadingState } from '../../components/admin/ui';
import { fetchAdminLocations } from '../../lib/admin/api';
import type { AdminLocationsResponse, LocationPoint } from '../../lib/admin/types';

const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];

const LocationsMap = dynamic(
  () => import('../../components/admin/LocationsMap'),
  { ssr: false }
);

export default function AdminLocationsPage() {
  const [data, setData] = useState<AdminLocationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'RIDER' | 'BUYER' | 'SELLER'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminLocations()
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? err.message ?? 'Failed to load locations');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const riders = data?.riders ?? [];
  const buyers = data?.buyers ?? [];
  const sellers = data?.sellers ?? [];
  const filteredRiders = filter === 'all' || filter === 'RIDER' ? riders : [];
  const filteredBuyers = filter === 'all' || filter === 'BUYER' ? buyers : [];
  const filteredSellers = filter === 'all' || filter === 'SELLER' ? sellers : [];

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
              subtitle="Riders, buyers (delivery addresses), and sellers. Filter by role below."
            />

            <section className="mb-6 flex flex-wrap gap-4">
              <AdminCard title="Riders" description="Active riders with GPS">
                <p className="text-2xl font-semibold text-primary">{riders.length}</p>
              </AdminCard>
              <AdminCard title="Buyers" description="Latest delivery address per buyer">
                <p className="text-2xl font-semibold text-[#76e4f7]">{buyers.length}</p>
              </AdminCard>
              <AdminCard title="Sellers" description="Business location set">
                <p className="text-2xl font-semibold text-[#6ce7a2]">{sellers.length}</p>
              </AdminCard>
            </section>

            <div className="mb-4 flex flex-wrap gap-2">
              {(['all', 'RIDER', 'BUYER', 'SELLER'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    filter === f
                      ? 'bg-primary text-white'
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

            {loading ? (
              <LoadingState label="Loading locations..." />
            ) : (
              <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
                <LocationsMap
                  riders={filteredRiders}
                  buyers={filteredBuyers}
                  sellers={filteredSellers}
                  center={LAGOS_CENTER}
                />
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
