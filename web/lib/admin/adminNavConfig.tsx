import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart2,
  Building2,
  Calendar,
  Coffee,
  DollarSign,
  FileBarChart2,
  FileText,
  HelpCircle,
  House,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Scale,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Bell,
  UserCheck,
  Users,
  Warehouse as WarehouseIcon,
  Zap,
} from 'lucide-react';

export type AdminNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** When true, match only exact path (not children). */
  exact?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { name: 'Overview', href: '/admin', icon: House, exact: true },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
      { name: 'Sharing analytics', href: '/admin/sharing/analytics', icon: Share2 },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog & accounts',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Sellers', href: '/admin/sellers', icon: Store },
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: Tag },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Quote Requests', href: '/admin/quote-requests', icon: FileText },
      { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
      { name: 'Refunds', href: '/admin/refunds', icon: DollarSign },
      { name: 'Disputes', href: '/admin/disputes', icon: Scale },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics & ops',
    items: [
      { name: 'Deliveries', href: '/admin/deliveries', icon: Truck },
      { name: 'Rider KYC', href: '/admin/riders-kyc', icon: UserCheck },
      { name: 'Rider breaks', href: '/admin/rider-break-requests', icon: Coffee },
      { name: 'Fleet operators', href: '/admin/fleet', icon: Building2 },
      { name: 'Safety Center', href: '/admin/safety', icon: Shield },
      { name: 'Dispatch', href: '/admin/dispatch', icon: Zap },
      { name: 'Delivery exceptions', href: '/admin/delivery-exceptions', icon: AlertTriangle },
      { name: 'Locations', href: '/admin/locations', icon: MapPin },
      { name: 'Warehouse', href: '/admin/warehouse', icon: WarehouseIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & reporting',
    items: [
      { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
      { name: 'Finance', href: '/admin/finance', icon: FileBarChart2 },
      { name: 'Reports', href: '/admin/reports', icon: FileBarChart2 },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      { name: 'Banners', href: '/admin/banners', icon: Megaphone },
      { name: 'Broadcast', href: '/admin/broadcast', icon: Mail },
      { name: 'Broadcast History', href: '/admin/broadcast-history', icon: Calendar },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Audit Log', href: '/admin/audit-log', icon: FileText },
      { name: 'Feedback', href: '/admin/feedback', icon: Star },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
      { name: 'Support Center', href: '/admin/support', icon: HelpCircle },
    ],
  },
];

/** Flat list for quick lookup (e.g. active page title). */
export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
