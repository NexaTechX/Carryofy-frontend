import Link from 'next/link';
import { AdminDrawer } from './ui';
import type { LocationPoint } from '../../lib/admin/types';
import { Copy, MapPin, Truck, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RIDER_COLOR = '#f97316';
const BUYER_COLOR = '#14b8a6';
const SELLER_COLOR = '#22c55e';

function getColor(role: LocationPoint['role']): string {
  switch (role) {
    case 'RIDER': return RIDER_COLOR;
    case 'BUYER': return BUYER_COLOR;
    case 'SELLER': return SELLER_COLOR;
    default: return '#888';
  }
}

function getRoleLabel(role: LocationPoint['role']): string {
  switch (role) {
    case 'RIDER': return 'Rider';
    case 'BUYER': return 'Buyer';
    case 'SELLER': return 'Seller';
    default: return role;
  }
}

interface LocationEntityDrawerProps {
  entity: LocationPoint | null;
  open: boolean;
  onClose: () => void;
}

export function LocationEntityDrawer({ entity, open, onClose }: LocationEntityDrawerProps) {
  if (!entity) return null;

  const label = entity.label || `${getRoleLabel(entity.role)} — ${entity.userId.slice(0, 8)}`;
  const coords = `${entity.lat.toFixed(5)}, ${entity.lng.toFixed(5)}`;
  const mapsUrl = `https://www.google.com/maps?q=${entity.lat},${entity.lng}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(coords);
    toast.success('Coordinates copied to clipboard');
  };

  const showLastActive = entity.role === 'RIDER' || entity.role === 'SELLER';

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={label}
      description={getRoleLabel(entity.role)}
    >
      <div className="space-y-6">
        {/* Role badge */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Role</span>
          <p className="mt-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: getColor(entity.role) }}
            >
              {entity.role === 'RIDER' && <Truck className="h-3.5 w-3.5" />}
              {entity.role === 'SELLER' && <Store className="h-3.5 w-3.5" />}
              {getRoleLabel(entity.role)}
            </span>
          </p>
        </div>

        {/* Phone (when available) */}
        {entity.phone && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</span>
            <p className="mt-1.5 text-sm text-gray-300">
              <a href={`tel:${entity.phone}`} className="text-primary hover:underline">
                {entity.phone}
              </a>
            </p>
          </div>
        )}

        {/* Last active (riders & sellers only) */}
        {showLastActive && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Last active</span>
            <p className="mt-1.5 text-sm text-gray-300">
              {entity.lastUpdated
                ? new Date(entity.lastUpdated).toLocaleString()
                : '—'}
            </p>
          </div>
        )}

        {/* Current order (riders only) */}
        {entity.role === 'RIDER' && entity.currentOrder && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current order</span>
            <div className="mt-1.5 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-3 text-sm text-gray-300">
              <p>ID: {entity.currentOrder.id}</p>
              {entity.currentOrder.status && <p>Status: {entity.currentOrder.status}</p>}
              {entity.currentOrder.destination && <p>Destination: {entity.currentOrder.destination}</p>}
            </div>
          </div>
        )}

        {/* Position */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Position</span>
          <p className="mt-1.5 font-mono text-sm text-gray-400">{coords}</p>
        </div>

        {/* Quick actions */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quick actions</span>
          <div className="flex flex-wrap gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-primary/50 hover:bg-[#252525] hover:text-white"
            >
              <MapPin className="h-4 w-4" />
              View in Google Maps
            </a>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-primary/50 hover:bg-[#252525] hover:text-white"
            >
              <Copy className="h-4 w-4" />
              Copy coordinates
            </button>
            {entity.role === 'RIDER' && (
              <Link
                href="/admin/deliveries"
                className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-primary/50 hover:bg-[#252525] hover:text-white"
              >
                <Truck className="h-4 w-4" />
                View deliveries
              </Link>
            )}
            {entity.role === 'SELLER' && (
              <Link
                href="/admin/sellers"
                className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-primary/50 hover:bg-[#252525] hover:text-white"
              >
                <Store className="h-4 w-4" />
                View sellers
              </Link>
            )}
          </div>
        </div>
      </div>
    </AdminDrawer>
  );
}
