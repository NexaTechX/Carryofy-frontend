import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';
import styles from '../../../styles/seller-onboarding.module.css';
import { KYC_REVIEW_ETA } from '../../../lib/seller/kyc-copy';

function refFrom(completedAt: string): string {
  // Deterministic, human-readable reference derived from the completion timestamp.
  const t = Date.parse(completedAt) || Date.now();
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let n = Math.floor(t / 1000);
  let code = '';
  for (let i = 0; i < 6; i++) { code += alphabet[n % alphabet.length]; n = Math.floor(n / alphabet.length); }
  return `KYC-${code}`;
}

export default function OnboardingSubmitted() {
  const [name, setName] = useState('');
  const [reference, setReference] = useState('KYC-PENDING');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cof_onboarding_done');
      if (raw) {
        const parsed = JSON.parse(raw) as { businessName?: string; completedAt?: string };
        setName(parsed.businessName || '');
        setReference(refFrom(parsed.completedAt || new Date().toISOString()));
      }
    } catch { /* no-op */ }
  }, []);

  return (
    <>
      <Head>
        <title>Application submitted · Carryofy Seller</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.doneWrap}>
        <div className={styles.done}>
          <div className={styles.ring}><Check size={46} strokeWidth={2.4} /></div>
          <h1 className={styles.doneTitle}>You&apos;re in review</h1>
          <p className={styles.doneP}>Thanks{name ? `, ${name}` : ''} — your verification has been submitted.</p>
          <p className={styles.doneP}>We&apos;ll email you the moment it&apos;s approved.</p>
          <div className={styles.ref}>REF · {reference}</div>

          <div className={styles.timeline}>
            <h4>What happens next</h4>
            <div className={`${styles.tl} ${styles.tlDone}`}>
              <span className={styles.ti}><Check size={14} strokeWidth={3} /></span>
              <div><div className={styles.tt}>Submitted</div><div className={styles.td}>Just now · your details are locked while we review</div></div>
            </div>
            <div className={`${styles.tl} ${styles.tlCur}`}>
              <span className={styles.ti}><Clock size={14} /></span>
              <div><div className={styles.tt}>Under review</div><div className={styles.td}>Our team verifies your ID &amp; documents — {KYC_REVIEW_ETA}</div></div>
            </div>
            <div className={`${styles.tl} ${styles.tlUp}`}>
              <span className={styles.ti}>3</span>
              <div><div className={styles.tt}>List your first product</div><div className={styles.td}>Once approved, add a product — then a quick listing check before you go live</div></div>
            </div>
          </div>

          <Link href="/seller/onboarding" className={styles.doneBtn}>View verification status</Link>
          <Link href="/seller" style={{ display: 'block', marginTop: 12, textAlign: 'center', fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
