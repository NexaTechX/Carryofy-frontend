import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Building2, Store, User, MapPin, Crosshair, Upload, CheckCircle2, Check,
  Clock, Loader2, ArrowLeft, ArrowRight, ShieldCheck, ShieldX, Package, Landmark,
} from 'lucide-react';
import { kycRejectionReasonLabel } from '../../lib/kyc/rejection-reasons';
import apiClient, { refreshAccessTokenBeforeRedirect } from '../../lib/api/client';
import { unwrapAxiosBody } from '../../lib/api/normalizeResponse';
import { useAuth } from '../../lib/auth';
import { NIGERIA_STATES, NIGERIA_LGAS, NIGERIAN_BANKS } from '../../lib/data/nigeria-onboarding-data';
import styles from '../../styles/seller-onboarding.module.css';
import { KYC_REVIEW_ETA } from '../../lib/seller/kyc-copy';

/* ----------------------------- constants ----------------------------- */
/** KYC only — stock/photos belong in the product wizard after approval. */
const STEP_DEFS = [
  { key: 'business', t: 'Business details' },
  { key: 'location', t: 'Location' },
  { key: 'identity', t: 'Identity' },
  { key: 'documents', t: 'Documents' },
  { key: 'bank', t: 'Bank account' },
  { key: 'review', t: 'Review & submit' },
] as const;
const TOTAL = STEP_DEFS.length;

const SELLER_TYPES: [string, string, string][] = [
  ['Individual', 'Individual', 'Sole trader'],
  ['Business Name', 'Business Name', 'Registered business'],
  ['Company', 'Company', 'Limited company'],
];
const LEGAL_FROM_TYPE: Record<string, string> = {
  Individual: 'SOLE_PROPRIETORSHIP',
  'Business Name': 'ENTERPRISE',
  Company: 'LIMITED_LIABILITY',
};
const TYPE_FROM_LEGAL: Record<string, string> = {
  SOLE_PROPRIETORSHIP: 'Individual',
  PARTNERSHIP: 'Business Name',
  ENTERPRISE: 'Business Name',
  LIMITED_LIABILITY: 'Company',
};
const SELLING_MODES: [string, string, string][] = [
  ['B2C_ONLY', 'Retail', 'To individual shoppers'],
  ['B2B_ONLY', 'Wholesale', 'Bulk to businesses'],
  ['B2C_AND_B2B', 'Both', 'Retail & wholesale'],
];
const YEARS_BANDS: [string, string][] = [
  ['UNDER_1', 'Under 1 year'],
  ['1_3', '1 – 3 years'],
  ['3_5', '3 – 5 years'],
  ['5_PLUS', '5+ years'],
];
const YEARS_TO_INT: Record<string, number> = { UNDER_1: 0, '1_3': 2, '3_5': 4, '5_PLUS': 6 };
function intToYearsBand(n: number | null | undefined): string {
  if (n == null) return '';
  if (n < 1) return 'UNDER_1';
  if (n <= 3) return '1_3';
  if (n <= 5) return '3_5';
  return '5_PLUS';
}
const OPERATES_FROM: [string, string][] = [
  ['FIXED_ADDRESS', 'Fixed address'],
  ['MARKET_STALL', 'Market stall'],
  ['MULTIPLE_LOCATIONS', 'Multiple locations'],
  ['MOBILE', 'Mobile / no fixed base'],
];
const INVENTORY_BANDS: [string, string][] = [
  ['UNDER_100K', 'Under ₦100k'],
  ['FROM_100K_TO_500K', '₦100k – ₦500k'],
  ['FROM_500K_TO_2M', '₦500k – ₦2M'],
  ['ABOVE_2M', '₦2M+'],
];
const STOCK_LOCATIONS: [string, string][] = [
  ['HOME', 'Home'],
  ['PERSONAL_STORE', 'Personal store'],
  ['MARKET_STALL', 'Market stall'],
  ['RENTED_WAREHOUSE', 'Rented warehouse'],
];
const SOURCING: [string, string][] = [
  ['MANUFACTURER', 'I manufacture it'],
  ['DISTRIBUTOR', 'Buy from a distributor'],
  ['TRADE_FAIR', 'Trade Fair / Alaba'],
  ['IMPORTER', 'I import it'],
  ['OTHER', 'Other'],
];
const ID_TYPES = ['NIN', 'Passport', 'Drivers License', 'Voters Card'];

/* ----------------------------- helpers ----------------------------- */
function slugify(s: string): string {
  return (
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'store'
  );
}
function normalizePhone(p: string): string {
  let c = p.replace(/[\s\-().]/g, '');
  if (/^0\d{10}$/.test(c)) c = '+234' + c.slice(1);
  if (/^\d{10}$/.test(c)) c = '+234' + c;
  return c;
}
function fmtSize(b: number): string {
  return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}
function mask(s: string): string {
  s = String(s || '');
  return s.length <= 4 ? s : '•'.repeat(Math.max(0, s.length - 4)) + s.slice(-4);
}
function apiErr(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string | string[] } } };
  const m = ax?.response?.data?.message;
  if (Array.isArray(m)) return m[0];
  return m || 'Something went wrong. Please try again.';
}
function isPdfUrl(u: string): boolean {
  return /\.pdf($|\?)|\/raw\/upload\//i.test(u);
}

interface DocFile { url: string; name: string; pdf: boolean; }
interface Photo { url: string; }

interface WizardData {
  // business
  businessName: string; sellerType: string; sellingMode: string;
  businessDescription: string; primaryCategoryId: string; additionalCategoryIds: string[];
  whatsappSame: boolean; whatsappNumber: string; yearsBand: string;
  phone: string; phoneVerified: boolean;
  // location
  operatesFrom: string; marketName: string; stallNumber: string;
  address: string; state: string; lga: string; landmark: string; instructions: string;
  lat: number; lng: number; gps: boolean; openTime: string; closeTime: string;
  // stock
  hasStock: boolean | null; inventoryValue: string; stockLocation: string; sourcing: string;
  minOrderNaira: string; sameDay: boolean | null; productPhotos: Photo[]; storePhotos: Photo[];
  // identity
  idType: string; idNumber: string; bvn: string; regNumber: string; taxId: string;
  // documents
  idImage: DocFile | null; idImageBack: DocFile | null; cacDoc: DocFile | null; addressProof: DocFile | null;
  // bank
  bankCode: string; bankName: string; accountNumber: string; accountName: string; accountType: string;
  // review
  consent: boolean;
}

const EMPTY: WizardData = {
  businessName: '', sellerType: '', sellingMode: '', businessDescription: '',
  primaryCategoryId: '', additionalCategoryIds: [], whatsappSame: true, whatsappNumber: '',
  yearsBand: '', phone: '', phoneVerified: false,
  operatesFrom: '', marketName: '', stallNumber: '', address: '', state: '', lga: '',
  landmark: '', instructions: '', lat: 6.5244, lng: 3.3792, gps: false, openTime: '09:00', closeTime: '18:00',
  hasStock: null, inventoryValue: '', stockLocation: '', sourcing: '', minOrderNaira: '',
  sameDay: null, productPhotos: [], storePhotos: [],
  idType: 'NIN', idNumber: '', bvn: '', regNumber: '', taxId: '',
  idImage: null, idImageBack: null, cacDoc: null, addressProof: null,
  bankCode: '', bankName: '', accountNumber: '', accountName: '', accountType: '',
  consent: false,
};

export default function SellerOnboardingWizard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [advancing, setAdvancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [resolving, setResolving] = useState(false);
  const [locked, setLocked] = useState(false); // approved/pending -> read-only-ish
  // Set when the seller's previous submission was rejected: why + what to fix.
  const [rejection, setRejection] = useState<{ reason: string | null; code: string | null } | null>(null);
  /** When KYC is PENDING after submit — show status surface instead of bouncing to dashboard. */
  const [pendingView, setPendingView] = useState<{
    businessName: string;
    submittedAt: string | null;
  } | null>(null);

  const sellerIdRef = useRef<string>('');
  const submittedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<WizardData>(data);
  dataRef.current = data;

  const set = useCallback((patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch })), []);
  const clearErr = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));

  /* ----------------------------- auth + load ----------------------------- */
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) { router.replace('/auth/login?redirect=/seller/onboarding'); return; }
    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') { router.replace('/'); return; }

    let cancelled = false;
    (async () => {
      // categories (public)
      try {
        const c = await apiClient.get('/categories');
        const body: unknown = unwrapAxiosBody(c.data);
        const list = Array.isArray(body)
          ? body
          : (body as { categories?: unknown[] })?.categories ?? [];
        if (!cancelled) {
          setCategories(
            (list as { id: string; name: string }[])
              .filter((x) => x && x.id && x.name)
              .map((x) => ({ id: x.id, name: x.name })),
          );
        }
      } catch { /* dropdown will be empty; non-fatal */ }

      try {
        const resp = await apiClient.get('/sellers/me/onboarding');
        const state = unwrapAxiosBody<OnboardingState>(resp.data);
        if (!state || cancelled) { setReady(true); return; }
        const p = state.profile;
        const k = state.kyc;
        const b = state.bankAccount;
        sellerIdRef.current = p?.id || '';

        const completed = !!state.onboardingCompletedAt;
        const kyc = (p?.kycStatus || 'NOT_SUBMITTED') as string;
        if (completed && kyc === 'APPROVED') {
          router.replace('/seller');
          return;
        }
        // PENDING: stay here and show a real status surface (do not bounce to dashboard).
        if (completed && kyc === 'PENDING') {
          setPendingView({
            businessName: p?.businessName || '',
            submittedAt: state.onboardingCompletedAt || k?.submittedAt || null,
          });
          setReady(true);
          return;
        }
        setLocked(false);
        setRejection(
          kyc === 'REJECTED'
            ? {
                reason: k?.rejectionReason ?? null,
                code: k?.rejectionReasonCode ?? null,
              }
            : null,
        );

        const phone = (user as { phone?: string })?.phone || '';
        const sellerType = k?.businessType || TYPE_FROM_LEGAL[p?.legalEntityType || ''] || '';
        const sched = (p?.operatingSchedule || {}) as { open?: string; close?: string };
        const next: WizardData = {
          ...EMPTY,
          businessName: p?.businessName || '',
          sellerType,
          sellingMode: p?.sellingMode || '',
          businessDescription: p?.businessDescription || '',
          primaryCategoryId: p?.primaryCategoryId || '',
          additionalCategoryIds: p?.additionalCategoryIds || [],
          whatsappNumber: p?.whatsappNumber || '',
          whatsappSame: !p?.whatsappNumber || normalizePhone(p.whatsappNumber) === normalizePhone(phone),
          yearsBand: intToYearsBand(p?.yearsInOperation),
          phone: phone ? phone.replace(/^\+234/, '') : '',
          // No SMS-OTP backend exists; never mark a phone as "verified".
          phoneVerified: false,
          operatesFrom: p?.businessOperatesFrom || '',
          marketName: p?.marketName || '',
          stallNumber: p?.stallNumber || '',
          address: p?.businessAddress || '',
          state: p?.state || '',
          lga: p?.lga || '',
          landmark: p?.nearestLandmark || '',
          instructions: p?.pickupInstructions || '',
          lat: p?.latitude ?? EMPTY.lat,
          lng: p?.longitude ?? EMPTY.lng,
          gps: p?.latitude != null,
          openTime: sched.open || '09:00',
          closeTime: sched.close || '18:00',
          hasStock: p?.hasPhysicalStock ?? null,
          inventoryValue: p?.estimatedInventoryValue || '',
          stockLocation: p?.stockLocation || '',
          sourcing: p?.sourcingType || '',
          minOrderNaira: p?.minimumOrderValueKobo != null ? String(Math.round(p.minimumOrderValueKobo / 100)) : '',
          sameDay: p?.offersSameDayFulfillment ?? null,
          productPhotos: (p?.productPhotoUrls || []).map((u) => ({ url: u })),
          storePhotos: (p?.storePhotoUrls || []).map((u) => ({ url: u })),
          idType: k?.idType || 'NIN',
          idNumber: k?.idNumber || '',
          bvn: k?.bvn || '',
          regNumber: k?.registrationNumber || '',
          taxId: k?.taxId || '',
          idImage: k?.idImage ? { url: k.idImage, name: 'ID (front)', pdf: isPdfUrl(k.idImage) } : null,
          idImageBack: k?.idImageBack ? { url: k.idImageBack, name: 'ID (back)', pdf: isPdfUrl(k.idImageBack) } : null,
          cacDoc: k?.cacDocumentUrl ? { url: k.cacDocumentUrl, name: 'CAC certificate', pdf: isPdfUrl(k.cacDocumentUrl) } : null,
          addressProof: k?.addressProofImage ? { url: k.addressProofImage, name: 'Proof of address', pdf: isPdfUrl(k.addressProofImage) } : null,
          bankCode: b?.bankCode || '',
          bankName: b?.bankName || '',
          accountNumber: b?.accountNumber || '',
          accountName: b?.accountName || '',
          accountType: b?.accountType || '',
          consent: false,
        };
        setData(next);
        const resume = computeResume(next);
        setStep(resume);
        setMaxReached(resume);
      } catch {
        // profile may not exist yet (shouldn't happen post-registration) — start fresh
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user]);

  /* ----------------------------- nav guard ----------------------------- */
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    const allow = (url: string) =>
      submittedRef.current ||
      url.startsWith('/seller/onboarding') ||
      url.startsWith('/auth/login') ||
      window.confirm('Leave onboarding? Your progress is saved as a draft and you can return any time.');
    router.beforePopState(({ as }) => allow(as));
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      router.beforePopState(() => true);
    };
  }, [router]);

  /* ----------------------------- persistence ----------------------------- */
  const phoneIntl = () => normalizePhone(dataRef.current.phone);

  const patchStep = async (n: number, payload: Record<string, unknown>) => {
    const clean: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(payload)) {
      if (v === undefined || v === null || v === '') continue;
      clean[key] = v;
    }
    await apiClient.patch(`/sellers/me/onboarding/step/${n}`, clean);
  };

  const persistStep = useCallback(async (uiIdx: number) => {
    const d = dataRef.current;
    switch (uiIdx) {
      case 0: {
        await patchStep(1, {
          businessName: d.businessName,
          sellingMode: d.sellingMode,
          legalEntityType: LEGAL_FROM_TYPE[d.sellerType],
          businessDescription: d.businessDescription,
          primaryCategoryId: d.primaryCategoryId,
          additionalCategoryIds: d.additionalCategoryIds,
          whatsappNumber: d.whatsappSame ? phoneIntl() : d.whatsappNumber,
          yearsInOperation: d.yearsBand ? YEARS_TO_INT[d.yearsBand] : undefined,
        });
        // Derived storefront fields so finalize passes (no separate store step in this flow).
        if (d.businessName && sellerIdRef.current) {
          await patchStep(5, {
            storeName: d.businessName,
            storeSlug: `${slugify(d.businessName)}-${sellerIdRef.current.slice(0, 5)}`,
            storeDeliveryOption: 'CARRYOFY_LOGISTICS',
          });
        }
        if (d.phone) {
          await apiClient.put('/users/me', { phone: phoneIntl() }).catch(() => {});
        }
        break;
      }
      case 1: {
        await patchStep(3, {
          state: d.state,
          lga: d.lga,
          businessAddress: d.address,
          nearestLandmark: d.landmark,
          businessOperatesFrom: d.operatesFrom,
          marketName: d.operatesFrom === 'MARKET_STALL' ? d.marketName : undefined,
          stallNumber: d.operatesFrom === 'MARKET_STALL' ? d.stallNumber : undefined,
          latitude: d.gps ? d.lat : undefined,
          longitude: d.gps ? d.lng : undefined,
          allowsBuyerPickup: false,
          pickupInstructions: d.instructions,
        });
        if (d.openTime && d.closeTime) {
          await patchStep(5, {
            operatingSchedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], open: d.openTime, close: d.closeTime },
          });
        }
        break;
      }
      case 2: {
        await patchStep(2, {
          businessType: d.sellerType,
          idType: d.idType,
          idNumber: d.idNumber,
          bvn: d.bvn,
          registrationNumber: d.sellerType !== 'Individual' ? d.regNumber : undefined,
          taxId: d.sellerType === 'Company' ? d.taxId : undefined,
        });
        break;
      }
      case 3: {
        await patchStep(2, {
          idImage: d.idImage?.url,
          idImageBack: d.idImageBack?.url,
          cacDocumentUrl: d.cacDoc?.url,
          addressProofImage: d.addressProof?.url,
        });
        break;
      }
      case 4: {
        await patchStep(4, {
          accountName: d.accountName,
          accountNumber: d.accountNumber,
          bankCode: d.bankCode,
          bankName: d.bankName,
          accountType: d.accountType || undefined,
        });
        break;
      }
    }
  }, []);

  /** Catalogue fields belong to listing — set safe defaults so KYC finalize never fails. */
  const persistCatalogueDefaults = useCallback(async () => {
    const d = dataRef.current;
    await patchStep(6, {
      hasPhysicalStock: false,
      sourcingType: 'OTHER',
      productPhotosReady: 'NO',
      productPhotoUrls: [],
      storePhotoUrls: [],
      offersBulkPricing: d.sellingMode !== 'B2C_ONLY',
    });
  }, []);

  const doSave = useCallback(async () => {
    if (submittedRef.current) return;
    setSaveState('saving');
    try { await persistStep(step); setSaveState('saved'); }
    catch { setSaveState('idle'); }
  }, [persistStep, step]);

  const clearPendingSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void doSave(); }, 800);
  }, [doSave]);

  const persistSubmissionDraft = useCallback(async () => {
    clearPendingSave();
    setSaveState('saving');
    for (let i = 0; i <= 4; i += 1) {
      await persistStep(i);
    }
    await persistCatalogueDefaults();
    setSaveState('saved');
  }, [clearPendingSave, persistCatalogueDefaults, persistStep]);

  /* ----------------------------- validation ----------------------------- */
  function validate(uiIdx: number): boolean {
    const d = dataRef.current;
    const e: Record<string, string> = {};
    if (uiIdx === 0) {
      if (!d.businessName.trim()) e.businessName = 'Enter your business name.';
      if (!d.sellerType) e.sellerType = 'Select a seller type — it decides which documents you need.';
      if (!d.sellingMode) e.sellingMode = 'Tell us how you sell.';
      if (!d.primaryCategoryId) e.primaryCategoryId = 'Pick your primary category.';
      if (normalizePhone(d.phone).replace('+234', '').length < 10) e.phone = 'Enter a valid phone number.';
      if (!d.whatsappSame && d.whatsappNumber && normalizePhone(d.whatsappNumber).replace('+234', '').length < 10)
        e.whatsappNumber = 'Enter a valid WhatsApp number.';
    } else if (uiIdx === 1) {
      if (!d.operatesFrom) e.operatesFrom = 'Where do you operate from?';
      if (d.operatesFrom === 'MARKET_STALL' && !d.marketName.trim()) e.marketName = 'Enter the market name.';
      if (!d.address.trim()) e.address = 'Enter your pickup address.';
      if (!d.state) e.state = 'Select a state.';
      if (!d.lga) e.lga = 'Select an LGA.';
    } else if (uiIdx === 2) {
      if (!d.idType) e.idType = 'Select an ID type.';
      if (!d.idNumber.trim()) e.idNumber = 'Enter your ID number.';
      if (d.bvn && d.bvn.length !== 11) e.bvn = 'A BVN must be exactly 11 digits.';
      if (d.sellerType !== 'Individual' && !d.regNumber.trim()) e.regNumber = `Required for ${d.sellerType} sellers.`;
      if (d.sellerType === 'Company' && !d.taxId.trim()) e.taxId = 'Required for limited companies.';
    } else if (uiIdx === 3) {
      if (!d.idImage) e.idImage = 'Upload the front of your ID.';
      if (d.sellerType !== 'Individual' && !d.cacDoc) e.cacDoc = 'Upload your CAC certificate.';
    } else if (uiIdx === 4) {
      if (!/^\d{10}$/.test(d.accountNumber)) e.accountNumber = 'Account number must be 10 digits.';
      if (!d.bankCode) e.bankCode = 'Select your bank.';
      if (!d.accountName.trim()) e.accountName = 'Resolve your account to confirm the name.';
      if (!d.accountType) e.accountType = 'Select an account type.';
    } else if (uiIdx === 5) {
      if (!d.consent) e.consent = 'Please confirm to submit.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ----------------------------- nav ----------------------------- */
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  async function next() {
    if (locked) { scrollTop(); return; }
    if (!validate(step)) return;
    if (step === TOTAL - 1) return submit();
    setAdvancing(true);
    try { await persistStep(step); setSaveState('saved'); }
    catch (err) { toast.error(apiErr(err)); setAdvancing(false); return; }
    setAdvancing(false);
    const n = step + 1;
    setStep(n); setMaxReached((m) => Math.max(m, n)); scrollTop();
  }
  function back() { if (step > 0) { setStep(step - 1); scrollTop(); } }
  function goto(i: number) { if (i <= maxReached) { setStep(i); scrollTop(); } }

  async function submit() {
    if (!validate(5)) return;
    setSubmitting(true);
    try {
      await persistSubmissionDraft();
      const resp = await apiClient.patch('/sellers/me/onboarding/step/7', {});
      const body = unwrapAxiosBody<{ onboardingCompletedAt?: string }>(resp.data);
      submittedRef.current = true;
      sessionStorage.setItem(
        'cof_onboarding_done',
        JSON.stringify({
          businessName: dataRef.current.businessName,
          completedAt: body?.onboardingCompletedAt || new Date().toISOString(),
        }),
      );
      await refreshAccessTokenBeforeRedirect().catch(() => {});
      window.location.assign('/seller/onboarding/submitted');
    } catch (err) {
      setSubmitting(false);
      setSaveState('idle');
      toast.error(apiErr(err));
    }
  }

  /* ----------------------------- uploads ----------------------------- */
  const ACCEPT = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  async function uploadFile(file: File, documentType: string): Promise<string> {
    if (!ACCEPT.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or PDF.');
    if (file.size > 5 * 1024 * 1024) throw new Error('File is over 5MB.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', documentType);
    const resp = await apiClient.post('/sellers/kyc/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    const body = unwrapAxiosBody<{ url: string }>(resp.data);
    if (!body?.url) throw new Error('Upload failed.');
    return body.url;
  }

  async function handleSingle(file: File | undefined, key: 'idImage' | 'idImageBack' | 'cacDoc' | 'addressProof') {
    if (!file) return;
    const typeMap = { idImage: 'id', idImageBack: 'id_back', cacDoc: 'cac', addressProof: 'address_proof' } as const;
    try {
      const url = await uploadFile(file, typeMap[key]);
      set({ [key]: { url, name: file.name, pdf: file.type === 'application/pdf' } } as Partial<WizardData>);
      clearErr(key);
      scheduleSave();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed.'); }
  }

  async function handlePhotos(files: FileList | null, key: 'productPhotos' | 'storePhotos', max: number) {
    if (!files?.length) return;
    const current = dataRef.current[key];
    const room = max - current.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (!chosen.length) { toast.error(`You can upload up to ${max}.`); return; }
    const docType = key === 'productPhotos' ? 'product_photo' : 'store_photo';
    const added: Photo[] = [];
    for (const f of chosen) {
      try { added.push({ url: await uploadFile(f, docType) }); }
      catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed.'); }
    }
    if (added.length) {
      set({ [key]: [...current, ...added] } as Partial<WizardData>);
      clearErr(key);
      scheduleSave();
    }
  }

  /* ----------------------------- bank resolve ----------------------------- */
  async function resolveAccount(accountNumber: string, bankCode: string) {
    if (!/^\d{10}$/.test(accountNumber) || !bankCode) return;
    setResolving(true);
    set({ accountName: '' });
    try {
      const resp = await apiClient.get('/payments/resolve-account', { params: { accountNumber, bankCode } });
      const body = unwrapAxiosBody<{ accountName: string }>(resp.data);
      if (body?.accountName) { set({ accountName: body.accountName }); clearErr('accountName'); scheduleSave(); }
      else setErrors((e) => ({ ...e, accountNumber: 'Could not resolve this account.' }));
    } catch (err) {
      setErrors((e) => ({ ...e, accountNumber: apiErr(err) }));
    } finally { setResolving(false); }
  }

  /* ----------------------------- render ----------------------------- */
  if (authLoading || !ready) {
    return (
      <div className={styles.loaderWrap}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.loaderSpin} style={{ margin: '0 auto 14px' }} />
          <p>Loading your application…</p>
        </div>
      </div>
    );
  }

  if (pendingView) {
    const submittedLabel = pendingView.submittedAt
      ? new Date(pendingView.submittedAt).toLocaleString('en-NG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Recently';
    return (
      <>
        <Head>
          <title>Verification status · Carryofy Seller</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className={styles.doneWrap}>
          <div className={styles.done}>
            <div className={styles.ring}><Clock size={46} strokeWidth={2.4} /></div>
            <h1 className={styles.doneTitle}>Verification under review</h1>
            <p className={styles.doneP}>
              Thanks{pendingView.businessName ? `, ${pendingView.businessName}` : ''} — your application is with our team.
            </p>
            <p className={styles.doneP}>
              Submitted {submittedLabel}. Approval {KYC_REVIEW_ETA}. We&apos;ll email you when you can list products.
            </p>
            <div className={styles.timeline}>
              <h4>What happens next</h4>
              <div className={`${styles.tl} ${styles.tlDone}`}>
                <span className={styles.ti}><Check size={14} strokeWidth={3} /></span>
                <div><div className={styles.tt}>Submitted</div><div className={styles.td}>Business, ID, documents &amp; bank on file</div></div>
              </div>
              <div className={`${styles.tl} ${styles.tlCur}`}>
                <span className={styles.ti}><Clock size={14} /></span>
                <div><div className={styles.tt}>Under review</div><div className={styles.td}>Team verifies your details — {KYC_REVIEW_ETA}</div></div>
              </div>
              <div className={`${styles.tl} ${styles.tlUp}`}>
                <span className={styles.ti}>3</span>
                <div><div className={styles.tt}>List your first product</div><div className={styles.td}>Once approved, add photos, price &amp; stock — then go live after a quick listing check</div></div>
              </div>
            </div>
            <a href="/seller" className={styles.doneBtn}>Back to dashboard</a>
          </div>
        </div>
      </>
    );
  }

  const pct = ((step + 1) / TOTAL) * 100;

  return (
    <>
      <Head>
        <title>Get verified · Carryofy Seller</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.shell}>
        {/* RAIL */}
        <aside className={styles.rail}>
          <div className={styles.brand}>
            <div className={styles.mark}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className={styles.brandName}>Carry<span>ofy</span></div>
              <div className={styles.brandTag}>Seller Hub</div>
            </div>
          </div>
          <div className={styles.railTitle}>Get verified</div>
          <ul className={styles.steps}>
            {STEP_DEFS.map((s, i) => {
              const done = i < step;
              const cls = [styles.step];
              if (i === step) cls.push(styles.stepActive);
              if (done) cls.push(styles.stepDone);
              if (i > maxReached) cls.push(styles.stepLocked);
              return (
                <li key={s.key}>
                  <button type="button" className={cls.join(' ')} onClick={() => goto(i)} disabled={i > maxReached}>
                    <span className={styles.dot}>{done ? <Check size={14} strokeWidth={3} /> : String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.stepMeta}>
                      <span className={styles.stepK}>Step {i + 1}</span>
                      <span className={styles.stepT}>{s.t}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.railFoot}>
            <div className={`${styles.savechip} ${saveState === 'saving' ? styles.saving : ''}`}>
              <span className={styles.pulse} />
              <span>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Draft saved' : 'Auto-saves as you go'}</span>
            </div>
            {locked && (
              <div className={styles.lockNote}><Clock size={13} /> Under review — read only</div>
            )}
            <p className={styles.help}>Your progress is saved automatically. Need a hand? <a href="/seller/help">Contact support</a>.</p>
          </div>
        </aside>

        {/* MAIN */}
        <main className={styles.main}>
          <div className={styles.mtop}>
            <div className={styles.mtopRow}>
              <div className={styles.mtopName}>Carry<span>ofy</span></div>
              <div className={styles.mtopCount}>Step {step + 1}/{TOTAL}</div>
            </div>
            <div className={styles.mbar}><i style={{ width: `${pct}%` }} /></div>
            <div className={styles.mstep}>{STEP_DEFS[step].t}</div>
          </div>

          <div className={styles.mcontent}>
            {rejection && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Your last submission was rejected — fix the details below and resubmit
                  </p>
                  {kycRejectionReasonLabel(rejection.code) &&
                    kycRejectionReasonLabel(rejection.code) !== 'Other' && (
                    <span className="mt-1.5 inline-flex rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-300">
                      {kycRejectionReasonLabel(rejection.code)}
                    </span>
                  )}
                  {rejection.reason && (
                    <p className="mt-1.5 text-xs text-red-200/80">{rejection.reason}</p>
                  )}
                </div>
              </div>
            )}
            <div className={styles.stage} key={step}>
              {renderStep()}
              <div className={styles.nav}>
                {step > 0 ? (
                  <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={back}>
                    <ArrowLeft size={18} /> Back
                  </button>
                ) : <span />}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={next}
                  disabled={advancing || submitting || (locked && step !== TOTAL - 1)}
                >
                  {advancing || submitting ? (
                    <span className={styles.spinner} />
                  ) : step === TOTAL - 1 ? (
                    <>Submit for verification</>
                  ) : (
                    <>Continue <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );

  /* ----------------------------- step renderers ----------------------------- */
  function field(label: React.ReactNode, key: string, node: React.ReactNode, hint?: string) {
    return (
      <div className={styles.field}>
        <label className={styles.lab}>{label}</label>
        {node}
        {errors[key] ? <p className={styles.errmsg}>⚠ {errors[key]}</p> : hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
    );
  }
  function choiceCards(
    options: [string, string, string?][],
    selected: string,
    onPick: (v: string) => void,
    cols: 2 | 3,
    icons?: Record<string, React.ReactNode>,
  ) {
    return (
      <div className={`${styles.choices} ${cols === 3 ? styles.c3 : styles.c2}`}>
        {options.map(([val, title, desc]) => {
          const on = selected === val;
          return (
            <button type="button" key={val} className={`${styles.choice} ${on ? styles.choiceOn : ''}`} onClick={() => onPick(val)}>
              {icons?.[val] && <span className={styles.ci}>{icons[val]}</span>}
              <span className={styles.ct}>{title}</span>
              {desc && <span className={styles.cd}>{desc}</span>}
              {on && <span className={styles.choiceCheck}>✓</span>}
            </button>
          );
        })}
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 0: return stepBusiness();
      case 1: return stepLocation();
      case 2: return stepIdentity();
      case 3: return stepDocuments();
      case 4: return stepBank();
      default: return stepReview();
    }
  }

  function stepBusiness() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Tell us about your store</span>
        <h1 className={styles.head}>Business details</h1>
        <p className={styles.sub}>This is how buyers find and recognise you on Carryofy. You can refine your storefront later.</p>

        {field(<><span>Business name</span> <span className={styles.req}>*</span></>, 'businessName',
          <input className={`${styles.inp} ${errors.businessName ? styles.errInput : ''}`} maxLength={60}
            placeholder="e.g. Bright Electronics" value={d.businessName}
            onChange={(e) => { set({ businessName: e.target.value }); clearErr('businessName'); }} onBlur={scheduleSave} />,
          'Shown publicly on your storefront and receipts.')}

        {field(<><span>What type of seller are you?</span> <span className={styles.req}>*</span></>, 'sellerType',
          choiceCards(SELLER_TYPES, d.sellerType, (v) => { set({ sellerType: v }); clearErr('sellerType'); scheduleSave(); }, 3,
            { Individual: <User size={18} />, 'Business Name': <Store size={18} />, Company: <Building2 size={18} /> }))}

        {field(<><span>How do you sell?</span> <span className={styles.req}>*</span></>, 'sellingMode',
          choiceCards(SELLING_MODES, d.sellingMode, (v) => { set({ sellingMode: v }); clearErr('sellingMode'); scheduleSave(); }, 3))}

        <div className={styles.grid2}>
          {field(<><span>Primary category</span> <span className={styles.req}>*</span></>, 'primaryCategoryId',
            <select className={`${styles.sel} ${errors.primaryCategoryId ? styles.errInput : ''}`} value={d.primaryCategoryId}
              onChange={(e) => { set({ primaryCategoryId: e.target.value }); clearErr('primaryCategoryId'); scheduleSave(); }}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>)}
          {field(<><span>Years in business</span> <span className={styles.opt}>— optional</span></>, 'yearsBand',
            <select className={styles.sel} value={d.yearsBand} onChange={(e) => { set({ yearsBand: e.target.value }); scheduleSave(); }}>
              <option value="">Select…</option>
              {YEARS_BANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>)}
        </div>

        {field(<><span>Additional categories</span> <span className={styles.opt}>— optional, up to 3</span><span className={styles.counter}>{d.additionalCategoryIds.length}/3</span></>, 'additionalCategoryIds',
          <div className={`${styles.choices} ${styles.c3}`}>
            {categories.filter((c) => c.id !== d.primaryCategoryId).slice(0, 12).map((c) => {
              const on = d.additionalCategoryIds.includes(c.id);
              return (
                <button type="button" key={c.id} className={`${styles.choice} ${on ? styles.choiceOn : ''}`}
                  onClick={() => {
                    const cur = d.additionalCategoryIds;
                    if (on) set({ additionalCategoryIds: cur.filter((x) => x !== c.id) });
                    else if (cur.length < 3) set({ additionalCategoryIds: [...cur, c.id] });
                    scheduleSave();
                  }}>
                  <span className={styles.ct} style={{ fontSize: 13.5 }}>{c.name}</span>
                  {on && <span className={styles.choiceCheck}>✓</span>}
                </button>
              );
            })}
          </div>,
          'Help buyers discover more of what you sell.')}

        {field(<><span>Business description</span> <span className={styles.opt}>— optional</span><span className={styles.counter}>{d.businessDescription.length}/200</span></>, 'businessDescription',
          <textarea className={styles.ta} maxLength={200} placeholder="What do you sell, and what makes your store stand out?"
            value={d.businessDescription} onChange={(e) => set({ businessDescription: e.target.value })} onBlur={scheduleSave} />)}

        {field(<><span>Business phone</span> <span className={styles.req}>*</span></>, 'phone',
          <div className={`${styles.inwrap} ${styles.hasPre}`}>
            <span className={styles.pre}>+234</span>
            <input className={`${styles.inp} ${styles.mono} ${errors.phone ? styles.errInput : ''}`} inputMode="numeric"
              placeholder="801 234 5678" value={d.phone}
              onChange={(e) => { set({ phone: e.target.value.replace(/\D/g, '').slice(0, 11) }); clearErr('phone'); }} onBlur={scheduleSave} />
          </div>,
          'We use this to reach you about orders.')}

        <div className={styles.field}>
          <label className={styles.lab} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={d.whatsappSame} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
              onChange={(e) => { set({ whatsappSame: e.target.checked }); scheduleSave(); }} />
            <span>WhatsApp number is the same as my phone</span>
          </label>
          {!d.whatsappSame && (
            <div className={`${styles.inwrap} ${styles.hasPre}`} style={{ marginTop: 10 }}>
              <span className={styles.pre}>+234</span>
              <input className={`${styles.inp} ${styles.mono} ${errors.whatsappNumber ? styles.errInput : ''}`} inputMode="numeric"
                placeholder="WhatsApp number" value={d.whatsappNumber}
                onChange={(e) => { set({ whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }); clearErr('whatsappNumber'); }} onBlur={scheduleSave} />
            </div>
          )}
          {errors.whatsappNumber && <p className={styles.errmsg}>⚠ {errors.whatsappNumber}</p>}
        </div>
      </>
    );
  }

  function stepLocation() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Where do you operate from?</span>
        <h1 className={styles.head}>Location</h1>
        <p className={styles.sub}>Carryofy riders collect orders here. Pin it accurately — a wrong location is the #1 cause of failed pickups.</p>

        {field(<><span>Business operates from</span> <span className={styles.req}>*</span></>, 'operatesFrom',
          choiceCards(OPERATES_FROM.map(([v, l]) => [v, l]) as [string, string][], d.operatesFrom,
            (v) => { set({ operatesFrom: v }); clearErr('operatesFrom'); scheduleSave(); }, 2))}

        {d.operatesFrom === 'MARKET_STALL' && (
          <div className={styles.grid2}>
            {field(<><span>Market name</span> <span className={styles.req}>*</span></>, 'marketName',
              <input className={`${styles.inp} ${errors.marketName ? styles.errInput : ''}`} placeholder="e.g. Alaba International"
                value={d.marketName} onChange={(e) => { set({ marketName: e.target.value }); clearErr('marketName'); }} onBlur={scheduleSave} />)}
            {field(<><span>Stall number</span> <span className={styles.opt}>— optional</span></>, 'stallNumber',
              <input className={styles.inp} placeholder="e.g. Block C, Shop 14" value={d.stallNumber}
                onChange={(e) => set({ stallNumber: e.target.value })} onBlur={scheduleSave} />)}
          </div>
        )}

        <div className={styles.map}>
          <div className={styles.ping} />
          <div className={styles.pin}><MapPin size={38} fill="currentColor" /></div>
          <div className={`${styles.coords} ${styles.mono}`}>{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</div>
        </div>
        <button type="button" className={styles.gpsbtn}
          onClick={() => {
            if (!navigator.geolocation) { toast.error('Geolocation not available.'); return; }
            navigator.geolocation.getCurrentPosition(
              (pos) => { set({ lat: pos.coords.latitude, lng: pos.coords.longitude, gps: true }); scheduleSave(); toast.success('Location captured'); },
              () => toast.error('Could not get your location.'),
              { enableHighAccuracy: true, timeout: 10000 },
            );
          }}>
          <Crosshair size={17} /> {d.gps ? 'Location captured — tap to update' : 'Use my current location'}
        </button>

        {field(<><span>Pickup address</span> <span className={styles.req}>*</span></>, 'address',
          <textarea className={`${styles.ta} ${errors.address ? styles.errInput : ''}`} placeholder="Street, building, area…"
            value={d.address} onChange={(e) => { set({ address: e.target.value }); clearErr('address'); }} onBlur={scheduleSave} />,
          'Be specific — include building name or number.')}

        <div className={styles.grid2}>
          {field(<><span>State</span> <span className={styles.req}>*</span></>, 'state',
            <select className={`${styles.sel} ${errors.state ? styles.errInput : ''}`} value={d.state}
              onChange={(e) => { set({ state: e.target.value, lga: '' }); clearErr('state'); scheduleSave(); }}>
              <option value="">Select state…</option>
              {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>)}
          {field(<><span>LGA / Area</span> <span className={styles.req}>*</span></>, 'lga',
            <select className={`${styles.sel} ${errors.lga ? styles.errInput : ''}`} value={d.lga} disabled={!d.state}
              onChange={(e) => { set({ lga: e.target.value }); clearErr('lga'); scheduleSave(); }}>
              <option value="">{d.state ? 'Select LGA…' : 'Select a state first'}</option>
              {(NIGERIA_LGAS[d.state] || []).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>)}
        </div>

        {field(<><span>Nearest landmark</span> <span className={styles.opt}>— optional</span></>, 'landmark',
          <input className={styles.inp} placeholder="e.g. opposite GTBank, Allen roundabout" value={d.landmark}
            onChange={(e) => set({ landmark: e.target.value })} onBlur={scheduleSave} />,
          'Helps new riders find you faster.')}

        {field(<><span>Operating hours</span> <span className={styles.opt}>— Mon–Sat</span></>, 'hours',
          <div className={styles.grid2}>
            <input type="time" className={styles.inp} value={d.openTime} onChange={(e) => { set({ openTime: e.target.value }); scheduleSave(); }} />
            <input type="time" className={styles.inp} value={d.closeTime} onChange={(e) => { set({ closeTime: e.target.value }); scheduleSave(); }} />
          </div>)}

        {field(<><span>Pickup instructions</span> <span className={styles.opt}>— optional</span></>, 'instructions',
          <input className={styles.inp} placeholder="e.g. Call on arrival, ask for store 2B" value={d.instructions}
            onChange={(e) => set({ instructions: e.target.value })} onBlur={scheduleSave} />)}
      </>
    );
  }

  function stepStock() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Your inventory</span>
        <h1 className={styles.head}>Stock &amp; supply</h1>
        <p className={styles.sub}>This helps us match buyers with sellers who can deliver — and tailor your selling tools.</p>

        {field(<><span>Do you have physical stock ready to list?</span> <span className={styles.req}>*</span></>, 'hasStock',
          <div className={styles.toggle2}>
            {[['yes', true], ['no', false]].map(([id, val]) => {
              const on = d.hasStock === val;
              return (
                <button type="button" key={id as string} className={`${styles.toggleBtn} ${on ? styles.toggleOn : ''}`}
                  onClick={() => { set({ hasStock: val as boolean }); clearErr('hasStock'); scheduleSave(); }}>
                  <span className={styles.ci}><Package size={20} /></span>
                  <span className={styles.toggleTitle}>{val ? 'Yes, in stock' : 'Not yet'}</span>
                </button>
              );
            })}
          </div>)}

        {d.hasStock === true && (
          <>
            {field(<><span>Estimated inventory value</span> <span className={styles.req}>*</span></>, 'inventoryValue',
              choiceCards(INVENTORY_BANDS.map(([v, l]) => [v, l]) as [string, string][], d.inventoryValue,
                (v) => { set({ inventoryValue: v }); clearErr('inventoryValue'); scheduleSave(); }, 2))}
            {field(<><span>Where is your stock held?</span> <span className={styles.req}>*</span></>, 'stockLocation',
              choiceCards(STOCK_LOCATIONS.map(([v, l]) => [v, l]) as [string, string][], d.stockLocation,
                (v) => { set({ stockLocation: v }); clearErr('stockLocation'); scheduleSave(); }, 2))}
          </>
        )}

        {d.hasStock === false && field(<><span>How will you fulfill orders?</span> <span className={styles.req}>*</span></>, 'sourcing',
          choiceCards(SOURCING.map(([v, l]) => [v, l]) as [string, string][], d.sourcing,
            (v) => { set({ sourcing: v }); clearErr('sourcing'); scheduleSave(); }, 3))}

        <div className={styles.grid2}>
          {field(<><span>Minimum order value</span> <span className={styles.opt}>— optional</span></>, 'minOrderNaira',
            <div className={`${styles.inwrap} ${styles.hasPre}`}>
              <span className={styles.pre}>₦</span>
              <input className={`${styles.inp} ${styles.mono}`} inputMode="numeric" placeholder="0" value={d.minOrderNaira}
                onChange={(e) => set({ minOrderNaira: e.target.value.replace(/\D/g, '') })} onBlur={scheduleSave} />
            </div>)}
          {field(<><span>Same-day fulfillment?</span> <span className={styles.opt}>— optional</span></>, 'sameDay',
            <div className={styles.toggle2}>
              {[['Yes', true], ['No', false]].map(([l, val]) => (
                <button type="button" key={l as string} className={`${styles.toggleBtn} ${d.sameDay === val ? styles.toggleOn : ''}`}
                  style={{ padding: '13px 16px' }} onClick={() => { set({ sameDay: val as boolean }); scheduleSave(); }}>
                  <span className={styles.toggleTitle} style={{ fontSize: 15 }}>{l}</span>
                </button>
              ))}
            </div>)}
        </div>

        {d.hasStock === true && (
          <div className={styles.field}>
            <label className={styles.lab}><span>Product photos</span> <span className={styles.req}>*</span><span className={styles.counter}>{d.productPhotos.length}/10</span></label>
            <PhotoGrid photos={d.productPhotos} max={10}
              onAdd={(files) => handlePhotos(files, 'productPhotos', 10)}
              onRemove={(i) => { set({ productPhotos: d.productPhotos.filter((_, x) => x !== i) }); scheduleSave(); }} />
            {errors.productPhotos ? <p className={styles.errmsg}>⚠ {errors.productPhotos}</p>
              : <p className={`${styles.photoMeta} ${d.productPhotos.length >= 3 ? styles.photoMetaOk : ''}`}>
                {d.productPhotos.length >= 3 ? '✓ Minimum reached' : 'Upload at least 3 clear photos of items you sell.'}</p>}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.lab}><span>Store / stall photos</span> <span className={styles.opt}>— optional, up to 3</span></label>
          <PhotoGrid photos={d.storePhotos} max={3}
            onAdd={(files) => handlePhotos(files, 'storePhotos', 3)}
            onRemove={(i) => { set({ storePhotos: d.storePhotos.filter((_, x) => x !== i) }); scheduleSave(); }} />
        </div>
      </>
    );
  }

  function stepIdentity() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Verify it&apos;s really you</span>
        <h1 className={styles.head}>Identity</h1>
        <p className={styles.sub}>We verify every seller to keep buyers safe and unlock payouts. Your details are encrypted and never shown to buyers.</p>

        <div className={styles.grid2}>
          {field(<><span>ID type</span> <span className={styles.req}>*</span></>, 'idType',
            <select className={styles.sel} value={d.idType} onChange={(e) => { set({ idType: e.target.value }); scheduleSave(); }}>
              {ID_TYPES.map((t) => <option key={t} value={t}>{t === 'NIN' ? 'National ID (NIN)' : t}</option>)}
            </select>)}
          {field(<><span>ID number</span> <span className={styles.req}>*</span></>, 'idNumber',
            <input className={`${styles.inp} ${styles.mono} ${errors.idNumber ? styles.errInput : ''}`} placeholder="e.g. 12345678901"
              value={d.idNumber} onChange={(e) => { set({ idNumber: e.target.value }); clearErr('idNumber'); }} onBlur={scheduleSave} />)}
        </div>

        {field(<><span>BVN</span> <span className={styles.opt}>— optional, speeds up payouts</span></>, 'bvn',
          <input className={`${styles.inp} ${styles.mono} ${errors.bvn ? styles.errInput : ''}`} inputMode="numeric" maxLength={11}
            placeholder="11 digits" value={d.bvn} onChange={(e) => { set({ bvn: e.target.value.replace(/\D/g, '').slice(0, 11) }); clearErr('bvn'); }} onBlur={scheduleSave} />,
          'Used only to match your payout account. We never see your bank balance.')}

        {d.sellerType !== 'Individual' && (
          <div className={styles.grid2}>
            {field(<><span>CAC registration number</span> <span className={styles.req}>*</span></>, 'regNumber',
              <input className={`${styles.inp} ${styles.mono} ${errors.regNumber ? styles.errInput : ''}`} placeholder="RC / BN number"
                value={d.regNumber} onChange={(e) => { set({ regNumber: e.target.value }); clearErr('regNumber'); }} onBlur={scheduleSave} />,
              'Must match the name on your CAC certificate.')}
            {d.sellerType === 'Company' && field(<><span>Tax ID (TIN)</span> <span className={styles.req}>*</span></>, 'taxId',
              <input className={`${styles.inp} ${styles.mono} ${errors.taxId ? styles.errInput : ''}`} placeholder="Tax identification number"
                value={d.taxId} onChange={(e) => { set({ taxId: e.target.value }); clearErr('taxId'); }} onBlur={scheduleSave} />)}
          </div>
        )}
      </>
    );
  }

  function stepDocuments() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Upload proof</span>
        <h1 className={styles.head}>Documents</h1>
        <p className={styles.sub}>Clear, full-frame photos approve fastest. Accepted: JPG, PNG, WEBP or PDF · up to 5MB each.</p>

        <div className={styles.docPair}>
          {dropZone('Government ID — front', 'idImage', d.idImage, true, `Front of your ${d.idType || 'ID'}`)}
          {dropZone('Government ID — back', 'idImageBack', d.idImageBack, false, 'Back of your ID (skip for passport)')}
        </div>
        {d.sellerType !== 'Individual' && dropZone('CAC certificate', 'cacDoc', d.cacDoc, true, 'Your business registration document')}
        {dropZone('Proof of address', 'addressProof', d.addressProof, false, 'Utility bill or bank statement (last 3 months)')}
      </>
    );
  }

  function dropZone(label: string, key: 'idImage' | 'idImageBack' | 'cacDoc' | 'addressProof', file: DocFile | null, required: boolean, desc: string) {
    return (
      <div className={styles.field}>
        <label className={styles.lab}><span>{label}</span> {required ? <span className={styles.req}>*</span> : <span className={styles.opt}>— optional</span>}</label>
        <div className={`${styles.drop} ${file ? styles.dropFilled : ''} ${errors[key] ? styles.errInput : ''}`}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add(styles.dragover); }}
          onDragLeave={(e) => e.currentTarget.classList.remove(styles.dragover)}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove(styles.dragover); void handleSingle(e.dataTransfer.files?.[0], key); }}>
          {!file && <input type="file" accept="image/*,.pdf" onChange={(e) => void handleSingle(e.target.files?.[0], key)} />}
          {file ? (
            <div className={styles.filepreview}>
              {file.pdf ? <div className={`${styles.thumb} ${styles.thumbPdf}`}>PDF</div> : <img className={styles.thumb} src={file.url} alt="" />}
              <div className={styles.fi}>
                <div className={styles.fn}>{file.name}</div>
                <div className={styles.fs}><Check size={13} strokeWidth={3} /> Uploaded</div>
              </div>
              <button type="button" className={styles.rm} title="Remove" onClick={(e) => { e.preventDefault(); set({ [key]: null } as Partial<WizardData>); scheduleSave(); }}>✕</button>
            </div>
          ) : (
            <div>
              <div className={styles.di}><Upload size={20} /></div>
              <div className={styles.dt}><b>Tap to upload</b> or drag a file here</div>
              <div className={styles.dd}>{desc}</div>
            </div>
          )}
        </div>
        {errors[key] && <p className={styles.errmsg}>⚠ {errors[key]}</p>}
      </div>
    );
  }

  function stepBank() {
    const d = data;
    return (
      <>
        <span className={styles.eyebrow}>Where you get paid</span>
        <h1 className={styles.head}>Bank account</h1>
        <p className={styles.sub}>Payouts from your sales land here. The name must match your verified identity.</p>

        {field(<><span>Bank</span> <span className={styles.req}>*</span></>, 'bankCode',
          <select className={`${styles.sel} ${errors.bankCode ? styles.errInput : ''}`} value={d.bankCode}
            onChange={(e) => {
              const code = e.target.value;
              const bank = NIGERIAN_BANKS.find((b) => b.code === code);
              set({ bankCode: code, bankName: bank?.name || '', accountName: '' });
              clearErr('bankCode');
              if (/^\d{10}$/.test(d.accountNumber) && code) void resolveAccount(d.accountNumber, code);
            }}>
            <option value="">Select your bank…</option>
            {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>)}

        {field(<><span>Account number</span> <span className={styles.req}>*</span></>, 'accountNumber',
          <>
            <input className={`${styles.inp} ${styles.mono} ${errors.accountNumber ? styles.errInput : ''}`} inputMode="numeric" maxLength={10}
              placeholder="10-digit account number" value={d.accountNumber}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                set({ accountNumber: v, accountName: '' });
                clearErr('accountNumber');
                if (v.length === 10 && d.bankCode) void resolveAccount(v, d.bankCode);
              }} />
            {resolving && <div className={styles.resolving}><span className={styles.spinSm} /> Resolving account name…</div>}
            {!resolving && d.accountName && <div className={styles.resolveChip}><CheckCircle2 size={16} /> {d.accountName}</div>}
          </>,
          'We confirm the account name automatically.')}

        {field(<><span>Account type</span> <span className={styles.req}>*</span></>, 'accountType',
          choiceCards([['PERSONAL', 'Personal'], ['BUSINESS', 'Business']], d.accountType,
            (v) => { set({ accountType: v }); clearErr('accountType'); scheduleSave(); }, 2))}
      </>
    );
  }

  function stepReview() {
    const d = data;
    const row = (k: string, v: React.ReactNode, mono?: boolean, missing?: boolean) => (
      <div className={styles.revRow}>
        <span className={styles.rk}>{k}</span>
        <span className={`${styles.rv} ${mono ? styles.rvMono : ''} ${missing ? styles.rvMiss : ''}`}>{v || (missing ? 'Not set' : '—')}</span>
      </div>
    );
    const sm = ({ B2C_ONLY: 'Retail', B2B_ONLY: 'Wholesale', B2C_AND_B2B: 'Retail & wholesale' } as Record<string, string>)[d.sellingMode];
    const docCount = [d.idImage, d.idImageBack, d.cacDoc, d.addressProof].filter(Boolean).length;
    return (
      <>
        <span className={styles.eyebrow}>Almost there</span>
        <h1 className={styles.head}>Review &amp; submit</h1>
        <p className={styles.sub}>Double-check everything. After you submit, your details lock while our team reviews — {KYC_REVIEW_ETA}.</p>

        <ReviewCard title="Business" onEdit={() => goto(0)}>
          {row('Business name', d.businessName, false, true)}
          {row('Seller type', d.sellerType, false, true)}
          {row('Sells', sm)}
          {row('Phone', `+234 ${d.phone}`, true, true)}
          {row('Primary category', categories.find((c) => c.id === d.primaryCategoryId)?.name, false, true)}
        </ReviewCard>

        <ReviewCard title="Location" onEdit={() => goto(1)}>
          {row('Operates from', OPERATES_FROM.find((o) => o[0] === d.operatesFrom)?.[1], false, true)}
          {row('Address', d.address, false, true)}
          {row('State / LGA', `${d.state}${d.lga ? ' · ' + d.lga : ''}`, false, true)}
          {row('Coordinates', `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`, true)}
        </ReviewCard>

        <ReviewCard title="Identity" onEdit={() => goto(2)}>
          {row('ID type', d.idType)}
          {row('ID number', mask(d.idNumber), true, true)}
          {d.bvn && row('BVN', mask(d.bvn), true)}
          {d.sellerType !== 'Individual' && row('CAC number', d.regNumber, true, true)}
          {d.sellerType === 'Company' && row('Tax ID', d.taxId, true, true)}
        </ReviewCard>

        <ReviewCard title={`Documents · ${docCount} uploaded`} onEdit={() => goto(3)}>
          <div className={styles.revRow} style={{ borderBottom: 'none' }}>
            <span className={styles.rk}>Files</span>
            <span className={styles.rv} style={{ maxWidth: '70%' }}>
              {([['ID front', d.idImage], ['ID back', d.idImageBack], ['CAC', d.cacDoc], ['Address', d.addressProof]] as [string, DocFile | null][])
                .filter(([, v]) => v).map(([l]) => <span key={l} className={styles.docpill}><Check size={12} strokeWidth={3} />{l}</span>)}
              {docCount === 0 && <span className={styles.rvMiss}>None uploaded</span>}
            </span>
          </div>
        </ReviewCard>

        <ReviewCard title="Bank account" onEdit={() => goto(4)}>
          {row('Bank', d.bankName, false, true)}
          {row('Account number', mask(d.accountNumber), true, true)}
          {row('Account name', d.accountName, false, true)}
          {row('Type', d.accountType ? d.accountType[0] + d.accountType.slice(1).toLowerCase() : '', false, true)}
        </ReviewCard>

        <p className={styles.hint} style={{ marginTop: 8 }}>
          Product photos and stock details come next — after you&apos;re approved you&apos;ll list your first product in a short wizard.
        </p>

        <div className={styles.consent}>
          <input type="checkbox" id="consent" checked={d.consent} onChange={(e) => { set({ consent: e.target.checked }); clearErr('consent'); }} />
          <label htmlFor="consent">I confirm the information above is accurate and the documents belong to me. I authorise Carryofy to verify these details, and accept the <a href="/terms-of-service">Seller Agreement</a> &amp; <a href="/privacy-policy">Privacy Policy</a>.</label>
        </div>
        {errors.consent && <p className={styles.errmsg}>⚠ {errors.consent}</p>}
      </>
    );
  }

  function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
    return (
      <div className={styles.revCard}>
        <div className={styles.revHead}><h3>{title}</h3><button type="button" className={styles.revEdit} onClick={onEdit}>Edit</button></div>
        <div className={styles.revBody}>{children}</div>
      </div>
    );
  }

  function PhotoGrid({ photos, max, onAdd, onRemove }: { photos: Photo[]; max: number; onAdd: (f: FileList | null) => void; onRemove: (i: number) => void }) {
    return (
      <div className={styles.photoGrid}>
        {photos.map((p, i) => (
          <div key={i} className={styles.photoCell}>
            <img src={p.url} alt="" />
            <button type="button" className={styles.rm} onClick={() => onRemove(i)}>✕</button>
          </div>
        ))}
        {photos.length < max && (
          <label className={styles.photoAdd}>
            <Upload size={18} />
            <input type="file" accept="image/*" multiple onChange={(e) => onAdd(e.target.files)} />
          </label>
        )}
      </div>
    );
  }
}

/* ----------------------------- types ----------------------------- */
interface OnboardingState {
  onboardingCurrentStep: number;
  onboardingCompletedAt: string | null;
  profile: {
    id: string; kycStatus: string; businessName: string; sellingMode: string | null;
    legalEntityType: string | null; businessDescription: string | null; primaryCategoryId: string | null;
    additionalCategoryIds?: string[]; whatsappNumber?: string | null; yearsInOperation: number | null;
    businessAddress: string | null; latitude: number | null; longitude: number | null; pickupInstructions: string | null;
    state: string | null; lga: string | null; nearestLandmark: string | null;
    businessOperatesFrom?: string | null; marketName?: string | null; stallNumber?: string | null;
    operatingSchedule?: unknown;
    hasPhysicalStock?: boolean | null; estimatedInventoryValue?: string | null; stockLocation?: string | null;
    minimumOrderValueKobo?: number | null; offersSameDayFulfillment?: boolean | null;
    productPhotoUrls?: string[]; storePhotoUrls?: string[]; sourcingType?: string | null;
  };
  kyc: {
    businessType: string | null; idType: string | null; idNumber: string | null; idImage: string | null;
    idImageBack: string | null; cacDocumentUrl: string | null; addressProofImage: string | null;
    bvn: string | null; registrationNumber: string | null; taxId: string | null;
    rejectionReason?: string | null; rejectionReasonCode?: string | null; rejectedAt?: string | null;
    submittedAt?: string | null;
  } | null;
  bankAccount: { accountName: string; accountNumber: string; bankCode: string; bankName: string; accountType: string | null } | null;
}

function computeResume(d: WizardData): number {
  const okBusiness = d.businessName && d.sellerType && d.sellingMode && d.primaryCategoryId;
  const okLocation = d.state && d.lga && d.address && d.operatesFrom;
  const okIdentity = d.idType && d.idNumber && d.sellerType;
  const okDocs = !!d.idImage;
  const okBank = /^\d{10}$/.test(d.accountNumber) && !!d.bankCode && !!d.accountName;
  if (!okBusiness) return 0;
  if (!okLocation) return 1;
  if (!okIdentity) return 2;
  if (!okDocs) return 3;
  if (!okBank) return 4;
  return 5;
}
