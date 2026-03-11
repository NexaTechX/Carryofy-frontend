import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Wallet as WalletIcon, ArrowLeft, Gift, CreditCard, RotateCcw, ShoppingBag } from 'lucide-react';
import { getWalletBalance, getWalletTransactions, type WalletTransaction } from '../../lib/api/wallet';
import { formatNgnFromKobo } from '../../lib/api/utils';

const TYPE_LABEL: Record<string, string> = {
  REFERRAL_REWARD: 'Referral reward',
  CASHBACK: 'Cashback',
  REFUND_CREDIT: 'Refund to wallet',
  CHECKOUT_SPEND: 'Used at checkout',
};

export default function BuyerWalletPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [balanceKobo, setBalanceKobo] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bal, tx] = await Promise.all([
          getWalletBalance(),
          getWalletTransactions({ limit: 50 }),
        ]);
        setBalanceKobo(bal.balanceKobo);
        setTransactions(tx.transactions);
      } catch {
        setBalanceKobo(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mounted]);

  return (
    <>
      <Head>
        <title>Wallet | Carryofy</title>
      </Head>
      <BuyerLayout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/buyer/profile"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </Link>
          <div className="flex items-center gap-2 mb-6">
            <WalletIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-white">My Wallet</h1>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : (
            <>
              <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6 mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Available balance</p>
                <p className="text-3xl font-semibold text-primary">
                  {balanceKobo != null ? formatNgnFromKobo(balanceKobo) : '—'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Use your wallet balance at checkout to pay for orders.
                </p>
              </div>

              <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6">
                <h2 className="text-lg font-medium text-white mb-4">Transaction history</h2>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No transactions yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {transactions.map((t) => (
                      <li key={t.id} className="flex items-center justify-between py-2 border-b border-[#1f2432] last:border-0">
                        <div className="flex items-center gap-3">
                          {t.type === 'REFERRAL_REWARD' && <Gift className="w-4 h-4 text-amber-400" />}
                          {t.type === 'REFUND_CREDIT' && <RotateCcw className="w-4 h-4 text-blue-400" />}
                          {t.type === 'CHECKOUT_SPEND' && <ShoppingBag className="w-4 h-4 text-gray-400" />}
                          {t.type === 'CASHBACK' && <CreditCard className="w-4 h-4 text-green-400" />}
                          <div>
                            <p className="text-white text-sm">{TYPE_LABEL[t.type] || t.type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(t.createdAt).toLocaleString()}
                              {t.orderId && ` · Order #${t.orderId.slice(0, 8)}`}
                            </p>
                          </div>
                        </div>
                        <span className={t.amountKobo >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {t.amountKobo >= 0 ? '+' : ''}{formatNgnFromKobo(t.amountKobo)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
