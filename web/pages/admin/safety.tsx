import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR, { useSWRConfig } from 'swr';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  Pagination,
  StatusBadge,
} from '../../components/admin/ui';
import {
  acknowledgeSafetySos,
  addSafetyIncidentNote,
  fetchAssignableSafetyAdmins,
  fetchSafetyCheckInSettings,
  fetchSafetyCheckIns,
  fetchSafetyIncidents,
  fetchSafetySosList,
  fetchSafetySummary,
  resolveSafetySos,
  updateSafetyCheckInSettings,
  updateSafetyIncident,
  type AdminSosAlertRow,
  type SafetyIncidentRow,
} from '../../lib/admin/api';
import { formatDateTime, getApiBaseUrlWithoutSuffix } from '../../lib/api/utils';
import { tokenManager } from '../../lib/auth/token';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import {
  Bell,
  CheckCircle,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';

type Tab = 'overview' | 'sos' | 'checkins' | 'incidents';

const CHECK_INS_PAGE_SIZE = 25;

function osmEmbedUrl(lat: number, lng: number) {
  const d = 0.012;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

function playSosAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 220);
  } catch {
    /* ignore */
  }
}

function notifySos(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, silent: false });
  }
}

function notifySilent(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, silent: true });
  }
}

function notifyWarning(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, silent: true });
  }
}

export default function AdminSafetyPage() {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const tab = (router.query.tab as Tab) || 'overview';
  const statusSos = (router.query.status as string) || '';
  const checkStatus = (router.query.checkStatus as string) || 'all';
  const checkFrom = (router.query.checkFrom as string) || '';
  const checkTo = (router.query.checkTo as string) || '';
  const checkPageRaw = parseInt(String(router.query.checkPage || '1'), 10);
  const checkPage = Number.isFinite(checkPageRaw) && checkPageRaw >= 1 ? checkPageRaw : 1;
  const incidentQ = (router.query.q as string) || '';
  const incidentType = (router.query.incidentType as string) || '';
  const incidentStatus = (router.query.incidentStatus as string) || '';
  const highlight = (router.query.highlight as string) || '';

  const [resolveOpen, setResolveOpen] = useState<AdminSosAlertRow | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [incidentDrawer, setIncidentDrawer] = useState<SafetyIncidentRow | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);
  const [intervalInput, setIntervalInput] = useState(120);

  const { data: summary, mutate: mutateSummary } = useSWR('safety-summary', fetchSafetySummary, {
    refreshInterval: 15000,
  });

  const sosKey = useMemo(
    () => ['safety-sos', statusSos, router.query.search || ''],
    [statusSos, router.query.search],
  );
  const { data: sosData, mutate: mutateSos } = useSWR(
    tab === 'sos' ? sosKey : null,
    () =>
      fetchSafetySosList({
        status: statusSos || undefined,
        search: (router.query.search as string) || undefined,
        take: 80,
      }),
    { refreshInterval: tab === 'sos' ? 10000 : 0 },
  );

  const checkKey = useMemo(
    () => [
      'safety-checkins',
      checkStatus,
      router.query.riderName || '',
      checkFrom,
      checkTo,
      String(checkPage),
    ],
    [checkStatus, router.query.riderName, checkFrom, checkTo, checkPage],
  );
  const { data: checkData, mutate: mutateCheckins } = useSWR(
    tab === 'checkins' ? checkKey : null,
    () =>
      fetchSafetyCheckIns({
        status: checkStatus === 'all' ? 'all' : (checkStatus as 'on_time' | 'missed'),
        riderName: (router.query.riderName as string)?.trim() || undefined,
        from: checkFrom.trim() || undefined,
        to: checkTo.trim() || undefined,
        skip: (checkPage - 1) * CHECK_INS_PAGE_SIZE,
        take: CHECK_INS_PAGE_SIZE,
      }),
  );

  const { data: settings } = useSWR(
    tab === 'checkins' ? 'safety-checkin-settings' : null,
    fetchSafetyCheckInSettings,
  );

  const incidentKey = useMemo(
    () => ['safety-incidents', incidentQ, incidentType, incidentStatus],
    [incidentQ, incidentType, incidentStatus],
  );
  const { data: incidentData, mutate: mutateIncidents } = useSWR(
    tab === 'incidents' ? incidentKey : null,
    () =>
      fetchSafetyIncidents({
        q: incidentQ || undefined,
        type: incidentType || undefined,
        status: incidentStatus || undefined,
        take: 80,
      }),
  );

  const { data: admins } = useSWR(
    incidentDrawer ? ['safety-admins', incidentDrawer.id] : null,
    fetchAssignableSafetyAdmins,
  );

  useEffect(() => {
    if (settings) setIntervalInput(settings.checkInIntervalMinutes);
  }, [settings]);

  useEffect(() => {
    if (!highlight) return;
    requestAnimationFrame(() => {
      document.getElementById('safety-highlight')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [highlight, tab, sosData, incidentData]);

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (!token) return;
    const origin = getApiBaseUrlWithoutSuffix();
    const s = io(`${origin}/location`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('sos:new', () => {
      playSosAlertSound();
      notifySos('New SOS alert', 'A rider triggered SOS. Open Safety Center.');
      void globalMutate('safety-summary');
      void globalMutate('safety-sos-badge');
      void globalMutate(
        (k: unknown) => Array.isArray(k) && k[0] === 'safety-sos',
        undefined,
        { revalidate: true },
      );
    });

    s.on('incident:new', () => {
      notifySilent('New incident report', 'A rider submitted an incident report.');
      void globalMutate('safety-summary');
      void globalMutate(
        (k: unknown) => Array.isArray(k) && k[0] === 'safety-incidents',
        undefined,
        { revalidate: true },
      );
    });

    s.on('checkin:new', () => {
      notifyWarning('Rider check-in', 'A rider completed a safety check-in.');
      void globalMutate(
        (k: unknown) => Array.isArray(k) && k[0] === 'safety-checkins',
        undefined,
        { revalidate: true },
      );
    });

    return () => {
      s.disconnect();
    };
  }, [globalMutate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const setQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = { ...router.query, ...patch };
      Object.keys(next).forEach((k) => {
        if (next[k] === '' || next[k] === undefined) delete next[k];
      });
      void router.push({ pathname: '/admin/safety', query: next }, undefined, { shallow: true });
    },
    [router],
  );

  useEffect(() => {
    if (!checkData || tab !== 'checkins') return;
    const totalPages = Math.max(1, Math.ceil(checkData.total / CHECK_INS_PAGE_SIZE));
    if (checkData.total > 0 && checkPage > totalPages) {
      void setQuery({ checkPage: String(totalPages) });
    }
  }, [checkData, checkPage, tab, setQuery]);

  const onAck = async (row: AdminSosAlertRow) => {
    try {
      await acknowledgeSafetySos(row.id, row.source);
      toast.success('SOS acknowledged');
      mutateSos();
      mutateSummary();
      globalMutate('safety-sos-badge');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed';
      toast.error(msg);
    }
  };

  const onResolveSubmit = async () => {
    if (!resolveOpen) return;
    const note = resolveNote.trim();
    if (!note) {
      toast.error('Resolution note is required');
      return;
    }
    try {
      await resolveSafetySos(resolveOpen.id, note, resolveOpen.source);
      toast.success('SOS resolved');
      setResolveOpen(null);
      setResolveNote('');
      mutateSos();
      mutateSummary();
      globalMutate('safety-sos-badge');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed';
      toast.error(msg);
    }
  };

  const saveInterval = async () => {
    try {
      await updateSafetyCheckInSettings(intervalInput);
      toast.success('Check-in policy updated');
      globalMutate('safety-checkin-settings');
    } catch {
      toast.error('Could not save settings');
    }
  };

  const incidentTypeTone: Record<string, 'neutral' | 'warning' | 'danger'> = {
    ACCIDENT: 'danger',
    THEFT: 'danger',
    HARASSMENT: 'warning',
    VEHICLE_BREAKDOWN: 'warning',
    OTHER: 'neutral',
  };

  const incidentStatusTone: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
    OPEN: 'warning',
    UNDER_REVIEW: 'neutral',
    RESOLVED: 'success',
    CLOSED: 'neutral',
  };

  return (
    <AdminLayout>
      <div className="space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <AdminPageHeader
          title="Safety Center"
          subtitle="Monitor SOS alerts, rider check-ins, and incident reports in real time."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setQuery({ tab: 'sos', status: 'ACTIVE' })}
            className="text-left"
          >
            <AdminCard className="border border-zinc-800 transition hover:border-primary/40">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Active SOS</p>
              <p className="mt-2 text-3xl font-semibold text-red-400">{summary?.activeSosCount ?? '—'}</p>
              <p className="mt-1 text-xs text-zinc-500">Live</p>
            </AdminCard>
          </button>
          <button type="button" onClick={() => setQuery({ tab: 'incidents', incidentStatus: 'OPEN' })} className="text-left">
            <AdminCard className="border border-zinc-800 transition hover:border-primary/40">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Open incidents</p>
              <p className="mt-2 text-3xl font-semibold text-amber-400">
                {summary?.openIncidentReportsCount ?? '—'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Needs review</p>
            </AdminCard>
          </button>
          <button type="button" onClick={() => setQuery({ tab: 'checkins', checkStatus: 'missed' })} className="text-left">
            <AdminCard className="border border-zinc-800 transition hover:border-primary/40">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Missed check-ins</p>
              <p className="mt-2 text-3xl font-semibold text-orange-400">
                {summary?.missedCheckInsTodayCount ?? '—'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Today</p>
            </AdminCard>
          </button>
          <button type="button" onClick={() => setQuery({ tab: 'checkins' })} className="text-left">
            <AdminCard className="border border-zinc-800 transition hover:border-primary/40">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Riders on shift</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-400">
                {summary?.ridersOnShiftCount ?? '—'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Available</p>
            </AdminCard>
          </button>
        </div>

        <AdminToolbar className="flex flex-wrap items-center gap-2">
          {(
            [
              ['overview', 'Overview'],
              ['sos', 'SOS alerts'],
              ['checkins', 'Check-ins'],
              ['incidents', 'Incidents'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setQuery({ tab: id })}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                tab === id
                  ? 'bg-primary text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              mutateSummary();
              mutateSos();
              mutateCheckins();
              mutateIncidents();
            }}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </AdminToolbar>

        {tab === 'overview' && (
          <AdminCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">How it works</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
                  <li>SOS alerts refresh every 10s and push in real time over WebSocket.</li>
                  <li>Enable browser notifications to hear a sound on new SOS.</li>
                  <li>Check-in policy sets how often riders should confirm they are safe while available.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
                <Bell className="mb-2 h-5 w-5 text-primary" />
                Notifications use the browser Notification API when permission is granted.
              </div>
            </div>
          </AdminCard>
        )}

        {tab === 'sos' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((s) => (
                <button
                  key={s || 'all'}
                  type="button"
                  onClick={() => setQuery({ status: s || undefined })}
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    (statusSos || '') === s
                      ? 'bg-zinc-100 text-black'
                      : 'bg-zinc-900 text-zinc-500 hover:text-white',
                  )}
                >
                  {s === '' ? 'All' : s}
                </button>
              ))}
            </div>
            {!sosData ? (
              <LoadingState label="Loading SOS alerts…" />
            ) : sosData.items.length === 0 ? (
              <AdminEmptyState title="No SOS alerts" description="No alerts match your filters." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sosData.items.map((row) => (
                  <div
                    key={`${row.source}-${row.id}`}
                    id={highlight === row.id ? 'safety-highlight' : undefined}
                    className={clsx(
                      'rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4',
                      highlight === row.id && 'ring-2 ring-primary',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                        {row.riderName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{row.riderName}</p>
                          <StatusBadge
                            tone={
                              row.status === 'ACTIVE'
                                ? 'danger'
                                : row.status === 'ACKNOWLEDGED'
                                  ? 'warning'
                                  : 'success'
                            }
                            label={row.status}
                          />
                          {row.source === 'LEGACY_SAFETY_INCIDENT' && (
                            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                              Legacy
                            </span>
                          )}
                        </div>
                        <a
                          href={`tel:${row.riderPhone}`}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {row.riderPhone || '—'}
                        </a>
                        <p className="mt-2 text-xs text-zinc-500">
                          {formatDateTime(row.triggeredAt)}
                          {row.orderId && (
                            <span className="ml-2 text-zinc-400">Order {row.orderId.slice(0, 8)}…</span>
                          )}
                        </p>
                        {row.reason && <p className="mt-2 text-sm text-zinc-300">{row.reason}</p>}
                      </div>
                    </div>
                    {row.lat != null && row.lng != null && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
                        <iframe
                          title="Map"
                          src={osmEmbedUrl(row.lat, row.lng)}
                          className="h-40 w-full border-0 bg-zinc-900"
                          loading="lazy"
                        />
                        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Google Maps
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => onAck(row)}
                          className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      {row.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => setResolveOpen(row)}
                          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'checkins' && (
          <div className="space-y-6">
            <AdminCard>
              <h3 className="text-sm font-semibold text-white">Check-in interval policy</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Riders should check in at least this often while marked available (on shift).
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-sm text-zinc-400">
                  Minutes
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(Number(e.target.value))}
                    className="ml-2 w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveInterval()}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-black"
                >
                  Save policy
                </button>
              </div>
            </AdminCard>
            <div>
              <h2 className="text-lg font-semibold text-white">Rider check-in log</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Every safety check-in from the rider app, with optional filters. Use <span className="text-zinc-400">All</span>{' '}
                for the full paginated history.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'on_time', 'missed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery({ checkStatus: s, checkPage: '1' })}
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      checkStatus === s ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-white',
                    )}
                  >
                    {s === 'all' ? 'All' : s === 'on_time' ? 'On time' : 'Missed'}
                  </button>
                ))}
              </div>
              <label className="text-xs text-zinc-500">
                From
                <input
                  type="date"
                  value={checkFrom}
                  onChange={(e) =>
                    setQuery({
                      checkFrom: e.target.value || undefined,
                      checkPage: '1',
                    })
                  }
                  className="ml-1 block rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
              </label>
              <label className="text-xs text-zinc-500">
                To
                <input
                  type="date"
                  value={checkTo}
                  onChange={(e) =>
                    setQuery({
                      checkTo: e.target.value || undefined,
                      checkPage: '1',
                    })
                  }
                  className="ml-1 block rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
              </label>
              <input
                type="search"
                placeholder="Rider name (press Enter)"
                defaultValue={(router.query.riderName as string) || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setQuery({
                      riderName: (e.target as HTMLInputElement).value.trim() || undefined,
                      checkPage: '1',
                    });
                  }
                }}
                className="min-w-[200px] rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white"
              />
            </div>
            {checkStatus !== 'all' && (
              <p className="text-xs text-zinc-600">
                On time / Missed evaluates the latest check-in per rider against your policy and scans up to 15,000 recent
                rows for the current filters.
              </p>
            )}
            {!checkData ? (
              <LoadingState label="Loading check-ins…" />
            ) : checkData.total === 0 ? (
              <AdminEmptyState title="No check-ins" description="No check-ins match your filters." />
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  Showing{' '}
                  <span className="font-medium text-white">
                    {(checkPage - 1) * CHECK_INS_PAGE_SIZE + 1}
                  </span>
                  –
                  <span className="font-medium text-white">
                    {Math.min(checkPage * CHECK_INS_PAGE_SIZE, checkData.total)}
                  </span>{' '}
                  of <span className="font-medium text-white">{checkData.total}</span>
                </p>
                <DataTableContainer>
                  <DataTable>
                    <DataTableHead>
                      <tr>
                        <DataTableCell>Rider</DataTableCell>
                        <DataTableCell>Time</DataTableCell>
                        <DataTableCell>Delivery</DataTableCell>
                        <DataTableCell>Location</DataTableCell>
                        <DataTableCell />
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {checkData.items.map((c) => (
                        <tr key={c.id}>
                          <DataTableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{c.riderName}</span>
                              {c.missedCheckInBadge && (
                                <StatusBadge tone="danger" className="mt-1 w-fit" label="MISSED CHECK-IN" />
                              )}
                            </div>
                          </DataTableCell>
                          <DataTableCell className="whitespace-nowrap text-zinc-400">
                            {formatDateTime(c.createdAt)}
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-zinc-300">{c.deliveryStatus}</span>
                            {c.helpRequested && (
                              <span className="ml-2 text-xs text-red-400">Help requested</span>
                            )}
                          </DataTableCell>
                          <DataTableCell className="text-xs text-zinc-500">
                            {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                          </DataTableCell>
                          <DataTableCell>
                            <a
                              href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Map
                            </a>
                          </DataTableCell>
                        </tr>
                      ))}
                    </DataTableBody>
                  </DataTable>
                </DataTableContainer>
                <Pagination
                  currentPage={checkPage}
                  totalPages={Math.max(1, Math.ceil(checkData.total / CHECK_INS_PAGE_SIZE))}
                  totalItems={checkData.total}
                  itemsPerPage={CHECK_INS_PAGE_SIZE}
                  onPageChange={(page) => setQuery({ checkPage: String(page) })}
                />
              </>
            )}
          </div>
        )}

        {tab === 'incidents' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                placeholder="Search rider or report #"
                defaultValue={incidentQ}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setQuery({ q: (e.target as HTMLInputElement).value });
                  }
                }}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white"
              />
              <select
                value={incidentType}
                onChange={(e) => setQuery({ incidentType: e.target.value || undefined })}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="">All types</option>
                <option value="ACCIDENT">Accident</option>
                <option value="THEFT">Theft</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="VEHICLE_BREAKDOWN">Vehicle breakdown</option>
                <option value="OTHER">Other</option>
              </select>
              <select
                value={incidentStatus}
                onChange={(e) => setQuery({ incidentStatus: e.target.value || undefined })}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            {!incidentData ? (
              <LoadingState label="Loading incidents…" />
            ) : incidentData.items.length === 0 ? (
              <AdminEmptyState title="No incident reports" description="None match your filters." />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <DataTableCell>ID</DataTableCell>
                      <DataTableCell>Rider</DataTableCell>
                      <DataTableCell>Type</DataTableCell>
                      <DataTableCell>Status</DataTableCell>
                      <DataTableCell>Created</DataTableCell>
                      <DataTableCell />
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {incidentData.items.map((r) => (
                      <tr
                        key={r.id}
                        id={highlight === r.id ? 'safety-highlight' : undefined}
                        className={highlight === r.id ? 'bg-primary/5' : undefined}
                      >
                        <DataTableCell className="font-mono text-xs text-primary">#{r.reportNumber}</DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-white">{r.riderName}</span>
                            <a href={`tel:${r.riderPhone}`} className="text-xs text-primary hover:underline">
                              {r.riderPhone}
                            </a>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={incidentTypeTone[r.type] ?? 'neutral'}
                            label={r.type.replace(/_/g, ' ')}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={incidentStatusTone[r.status] ?? 'neutral'}
                            label={r.status.replace(/_/g, ' ')}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-xs text-zinc-500">{formatDateTime(r.createdAt)}</DataTableCell>
                        <DataTableCell>
                          <button
                            type="button"
                            onClick={() => setIncidentDrawer(r)}
                            className="text-sm text-primary hover:underline"
                          >
                            Manage
                          </button>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            )}
          </div>
        )}
      </div>

      <AdminDrawer open={!!resolveOpen} onClose={() => setResolveOpen(null)} title="Resolve SOS">
        {resolveOpen && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Describe how this SOS was closed. This is required.</p>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm text-white"
              placeholder="Resolution details…"
            />
            <button
              type="button"
              onClick={() => void onResolveSubmit()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-black"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm resolve
            </button>
          </div>
        )}
      </AdminDrawer>

      <AdminDrawer
        open={!!incidentDrawer}
        onClose={() => {
          setIncidentDrawer(null);
          setInternalNote('');
        }}
        title={incidentDrawer ? `Report #${incidentDrawer.reportNumber}` : 'Incident'}
      >
        {incidentDrawer && (
          <div className="space-y-4 text-sm">
            <p className="text-zinc-400">{incidentDrawer.description}</p>
            <div className="flex flex-wrap gap-3">
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <select
                  value={incidentDrawer.status}
                  onChange={async (e) => {
                    const v = e.target.value;
                    try {
                      await updateSafetyIncident(incidentDrawer.id, { status: v });
                      toast.success('Updated');
                      setIncidentDrawer({ ...incidentDrawer, status: v });
                      mutateIncidents();
                    } catch {
                      toast.error('Update failed');
                    }
                  }}
                  className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Assign</p>
                <select
                  value={incidentDrawer.assignedTo?.id ?? ''}
                  onChange={async (e) => {
                    const v = e.target.value || null;
                    try {
                      await updateSafetyIncident(incidentDrawer.id, { assignedToId: v });
                      const ad = admins?.find((a) => a.id === v);
                      setIncidentDrawer({
                        ...incidentDrawer,
                        assignedTo: ad
                          ? { id: ad.id, name: ad.name, email: ad.email }
                          : null,
                      });
                      toast.success('Assignee updated');
                      mutateIncidents();
                    } catch {
                      toast.error('Update failed');
                    }
                  }}
                  className="mt-1 max-w-[220px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
                >
                  <option value="">Unassigned</option>
                  {admins?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {incidentDrawer.lat != null && incidentDrawer.lng != null && (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <iframe
                  title="Incident map"
                  src={osmEmbedUrl(incidentDrawer.lat, incidentDrawer.lng)}
                  className="h-48 w-full border-0"
                  loading="lazy"
                />
              </div>
            )}
            {incidentDrawer.photos?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-500">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Photos
                </p>
                <div className="flex flex-wrap gap-2">
                  {incidentDrawer.photos.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoZoom(url)}
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-700"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-zinc-500">Internal notes (admin only)</p>
              <ul className="mt-2 space-y-2">
                {incidentDrawer.notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">
                    <span className="text-zinc-500">
                      {n.author.name} · {formatDateTime(n.createdAt)}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
                placeholder="Add internal note…"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!internalNote.trim()) return;
                  try {
                    await addSafetyIncidentNote(incidentDrawer.id, internalNote.trim());
                    toast.success('Note added');
                    setInternalNote('');
                    mutateIncidents();
                    const fresh = await fetchSafetyIncidents({
                      q: String(incidentDrawer.reportNumber),
                      take: 10,
                    });
                    const upd = fresh.items.find((i) => i.id === incidentDrawer.id);
                    if (upd) setIncidentDrawer(upd);
                  } catch {
                    toast.error('Could not add note');
                  }
                }}
                className="mt-2 rounded-full bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
              >
                Add note
              </button>
            </div>
          </div>
        )}
      </AdminDrawer>

      {photoZoom && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPhotoZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoZoom} alt="" className="max-h-[90vh] max-w-full object-contain" />
        </button>
      )}
    </AdminLayout>
  );
}
