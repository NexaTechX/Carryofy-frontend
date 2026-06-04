import { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Percent } from 'lucide-react';
import {
  useCommissionRates,
  useCommissionHistory,
  useSetCommissionRate,
} from '../../lib/admin/hooks/useSettings';
import type { CommissionPartyType } from '../../lib/admin/api';

const PARTIES: { key: CommissionPartyType; label: string; blurb: string }[] = [
  {
    key: 'PARTNER_FLEET',
    label: 'Partner Fleet',
    blurb: 'Carryofy cut on deliveries by fleet-owned riders; remainder goes to the fleet manager wallet.',
  },
  {
    key: 'OWNED_RIDER',
    label: 'Owned Rider',
    blurb: 'Carryofy cut on deliveries by independent riders; remainder goes to the rider wallet.',
  },
];

const MIN_PCT = 1;
const MAX_PCT = 50;

function bpsToPct(bps: number): string {
  return (bps / 100).toFixed(2).replace(/\.00$/, '');
}

function PartyCard({ party }: { party: { key: CommissionPartyType; label: string; blurb: string } }) {
  const { data: rates } = useCommissionRates();
  const { data: history } = useCommissionHistory(party.key);
  const setRate = useSetCommissionRate();

  const currentBps = rates?.[party.key];
  const [pct, setPct] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const value = Number(pct);
    if (!Number.isFinite(value) || value < MIN_PCT || value > MAX_PCT) {
      toast.error(`Rate must be between ${MIN_PCT}% and ${MAX_PCT}%`);
      return;
    }
    const rateBps = Math.round(value * 100);
    setRate.mutate(
      {
        partyType: party.key,
        rateBps,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${party.label} rate set to ${value}%`);
          setPct('');
          setEffectiveFrom('');
          setNote('');
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || err?.message || 'Failed to set rate',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#1f1f1f] bg-black/20 p-6">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-white">{party.label}</h4>
          <span className="rounded-lg bg-primary/10 px-3 py-1 text-lg font-bold text-primary">
            {currentBps != null ? `${bpsToPct(currentBps)}%` : '—'}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{party.blurb}</p>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-400">New rate (%)</span>
          <input
            type="number"
            min={MIN_PCT}
            max={MAX_PCT}
            step="0.5"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder={`${MIN_PCT}–${MAX_PCT}`}
            className="w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-400">Effective from (optional)</span>
          <input
            type="datetime-local"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-400">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for the change"
            className="w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={setRate.isPending}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#cc5200] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {setRate.isPending ? 'Saving…' : 'Set rate'}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">History</p>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-[#1f1f1f]">
          <table className="min-w-full text-sm">
            <thead className="bg-black/40 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Rate</th>
                <th className="px-3 py-2 text-left font-medium">Effective</th>
                <th className="px-3 py-2 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {history && history.length > 0 ? (
                history.map((row) => (
                  <tr key={row.id} className="text-gray-300">
                    <td className="px-3 py-2 font-semibold text-white">{bpsToPct(row.rateBps)}%</td>
                    <td className="px-3 py-2">{new Date(row.effectiveFrom).toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-500">{row.note || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-600">
                    No history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CommissionSplitSettings() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-xl overflow-hidden backdrop-blur-md bg-opacity-80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-8 py-6 text-left transition hover:bg-[#181818]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,102,0,0.15)]">
          <Percent className="h-6 w-6" />
        </div>
        <div>
          <span className="text-xl font-bold text-white tracking-tight">Delivery Commission Split</span>
          <p className="text-sm text-gray-500">Carryofy&apos;s cut on delivery fees, per party type (1–50%)</p>
        </div>
        {open ? (
          <ChevronDown className="ml-auto h-6 w-6 text-gray-600" />
        ) : (
          <ChevronRight className="ml-auto h-6 w-6 text-gray-600" />
        )}
      </button>
      {open && (
        <div className="border-t border-[#1f1f1f] p-8">
          <p className="mb-6 text-sm text-gray-500">
            The rate is taken off each delivery fee first; the remainder is paid out. Changes apply
            to future deliveries only — the rate in force at delivery time is snapshotted onto each
            payout and never recalculated.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {PARTIES.map((p) => (
              <PartyCard key={p.key} party={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
