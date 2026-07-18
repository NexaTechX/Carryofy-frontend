import { MapPin, Package, ShieldCheck, Tags } from 'lucide-react';

const signals = [
  {
    icon: ShieldCheck,
    title: 'Verified suppliers',
    text: 'Screened before they list',
  },
  {
    icon: Tags,
    title: 'Unit prices upfront',
    text: 'See wholesale rates before you order',
  },
  {
    icon: Package,
    title: 'Clear MOQs',
    text: 'Minimums shown on every SKU',
  },
  {
    icon: MapPin,
    title: 'Lagos delivery',
    text: 'Coordinated dispatch to your shop',
  },
] as const;

export default function WholesaleTrustBar() {
  return (
    <section
      aria-label="Why retailers source on Carryofy"
      className="border-b border-border-custom bg-sidebar-bg"
    >
      <div className="mx-auto grid max-w-7xl gap-px bg-border-custom/60 sm:grid-cols-2 lg:grid-cols-4">
        {signals.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3.5 bg-sidebar-bg px-5 py-5 sm:px-6 sm:py-6"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-foreground/55">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
