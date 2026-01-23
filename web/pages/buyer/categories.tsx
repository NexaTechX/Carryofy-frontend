import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { ArrowRight, Package, Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';

export default function CategoriesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Redirect to products page to show the new design
    router.push('/buyer/products');
  }, [router]);

  if (!mounted) {
    return null;
  }

  return null;
}

