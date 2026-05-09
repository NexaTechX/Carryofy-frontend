import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { getAdminBreadcrumbs } from '../../lib/admin/adminBreadcrumbs';

type AdminBreadcrumbsProps = {
  className?: string;
};

export default function AdminBreadcrumbs({ className }: AdminBreadcrumbsProps) {
  const router = useRouter();
  const items = getAdminBreadcrumbs(router.pathname, router.query);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx(
        'flex flex-wrap items-center gap-1 border-b border-border-custom/80 bg-background/80 px-4 py-3 text-xs font-medium text-gray-500 sm:px-6 lg:px-8',
        className
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-hidden /> : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="rounded-md text-gray-400 transition hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={clsx(isLast && 'text-foreground')}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
