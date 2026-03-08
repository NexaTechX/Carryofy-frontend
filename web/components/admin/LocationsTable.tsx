import { useMemo, useState } from 'react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  AdminEmptyState,
} from './ui';
import type { LocationPoint } from '../../lib/admin/types';
import { MapPin, Truck, Store, User } from 'lucide-react';

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

function getRoleIcon(role: LocationPoint['role']) {
  switch (role) {
    case 'RIDER': return Truck;
    case 'BUYER': return User;
    case 'SELLER': return Store;
    default: return MapPin;
  }
}

export interface LocationsTableProps {
  riders: LocationPoint[];
  buyers: LocationPoint[];
  sellers: LocationPoint[];
  filter: 'all' | 'RIDER' | 'BUYER' | 'SELLER';
  searchQuery: string;
  onSelectEntity: (point: LocationPoint) => void;
}

export default function LocationsTable({
  riders,
  buyers,
  sellers,
  filter,
  searchQuery,
  onSelectEntity,
}: LocationsTableProps) {
  const [sortBy, setSortBy] = useState<'label' | 'lastActive'>('label');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const allPoints = useMemo(() => {
    const list: { point: LocationPoint; role: LocationPoint['role'] }[] = [];
    riders.forEach((p) => list.push({ point: p, role: 'RIDER' }));
    buyers.forEach((p) => list.push({ point: p, role: 'BUYER' }));
    sellers.forEach((p) => list.push({ point: p, role: 'SELLER' }));
    return list;
  }, [riders, buyers, sellers]);

  const filteredPoints = useMemo(() => {
    let list = allPoints;
    if (filter !== 'all') {
      list = list.filter(({ role }) => role === filter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(({ point }) => {
        const label = (point.label ?? '').toLowerCase();
        const userId = point.userId.toLowerCase();
        return label.includes(q) || userId.includes(q);
      });
    }
    return list;
  }, [allPoints, filter, searchQuery]);

  const sortedPoints = useMemo(() => {
    const arr = [...filteredPoints];
    arr.sort((a, b) => {
      const pa = a.point;
      const pb = b.point;
      if (sortBy === 'label') {
        const la = (pa.label ?? pa.userId).toLowerCase();
        const lb = (pb.label ?? pb.userId).toLowerCase();
        const cmp = la.localeCompare(lb);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'lastActive') {
        const ta = pa.lastUpdated ? new Date(pa.lastUpdated).getTime() : 0;
        const tb = pb.lastUpdated ? new Date(pb.lastUpdated).getTime() : 0;
        const cmp = ta - tb;
        return sortDir === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
    return arr;
  }, [filteredPoints, sortBy, sortDir]);

  const handleSort = (col: 'label' | 'lastActive') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  if (filteredPoints.length === 0) {
    return (
      <AdminEmptyState
        title="No locations match your filters"
        description={
          searchQuery.trim()
            ? 'Try a different search or clear the search box.'
            : filter !== 'all'
              ? `No ${getRoleLabel(filter).toLowerCase()}s with locations.`
              : 'No riders, buyers, or sellers with location data.'
        }
      />
    );
  }

  return (
    <DataTableContainer>
      <DataTable>
        <DataTableHead>
          <tr>
            <th
              className="cursor-pointer px-6 py-4 text-left text-white hover:text-primary"
              onClick={() => handleSort('label')}
            >
              <span className="flex items-center gap-1">
                Name / Label
                {sortBy === 'label' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </span>
            </th>
            <th className="px-6 py-4 text-left text-white">Role</th>
            <th
              className="cursor-pointer px-6 py-4 text-left text-white hover:text-primary"
              onClick={() => handleSort('lastActive')}
            >
              <span className="flex items-center gap-1">
                Last Active
                {sortBy === 'lastActive' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </span>
            </th>
            <th className="px-6 py-4 text-left text-white">Coordinates</th>
            <th className="px-6 py-4 text-right text-gray-500">Actions</th>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {sortedPoints.map(({ point, role }) => {
            const Icon = getRoleIcon(role);
            const label = point.label || `${getRoleLabel(role)} — ${point.userId.slice(0, 8)}`;
            const coords = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
            const lastActive =
              role === 'RIDER' || role === 'SELLER'
                ? point.lastUpdated
                  ? new Date(point.lastUpdated).toLocaleString()
                  : '—'
                : '—';

            return (
              <tr
                key={`${role}-${point.userId}`}
                className="cursor-pointer transition hover:bg-[#1a1a1a]"
                onClick={() => onSelectEntity(point)}
              >
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: getColor(role) }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-white">{label}</span>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: getColor(role) }}
                  >
                    {getRoleLabel(role)}
                  </span>
                </DataTableCell>
                <DataTableCell className="text-gray-400">{lastActive}</DataTableCell>
                <DataTableCell className="font-mono text-xs text-gray-500">{coords}</DataTableCell>
                <DataTableCell className="text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity(point);
                    }}
                    className="rounded border border-border-custom px-2 py-1 text-xs font-medium text-gray-400 transition hover:border-primary hover:text-primary"
                  >
                    View details
                  </button>
                </DataTableCell>
              </tr>
            );
          })}
        </DataTableBody>
      </DataTable>
    </DataTableContainer>
  );
}
