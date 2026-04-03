'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import PriceRangeSlider from './PriceRangeSlider';
import { categoryDisplayName } from '../../../lib/buyer/categoryDisplay';

interface Category {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface VendorOption {
  id: string;
  businessName: string;
}

interface ShopFiltersPanelProps {
  categories: Category[];
  vendors: VendorOption[];
  vendorSearch: string;
  onVendorSearchChange: (v: string) => void;
  selectedSellerId: string;
  onSellerIdChange: (sellerId: string) => void;
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  purchaseType: 'ALL' | 'B2C' | 'B2B';
  onPurchaseTypeChange: (t: 'ALL' | 'B2C' | 'B2B') => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (v: boolean) => void;
  verifiedSellersOnly: boolean;
  onVerifiedSellersOnlyChange: (v: boolean) => void;
  moqMin: string;
  moqMax: string;
  onMoqMinChange: (v: string) => void;
  onMoqMaxChange: (v: string) => void;
  priceLow: number;
  priceHigh: number;
  onPriceLowChange: (v: number) => void;
  onPriceHighChange: (v: number) => void;
  priceMinBound: number;
  priceMaxBound: number;
  onApply: () => void;
  onReset: () => void;
  onClose?: () => void;
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-sidebar-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 text-left text-foreground font-medium text-sm hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function ShopFiltersPanel({
  categories,
  vendors,
  vendorSearch,
  onVendorSearchChange,
  selectedSellerId,
  onSellerIdChange,
  selectedCategory,
  onCategoryChange,
  purchaseType,
  onPurchaseTypeChange,
  inStockOnly,
  onInStockOnlyChange,
  verifiedSellersOnly,
  onVerifiedSellersOnlyChange,
  moqMin,
  moqMax,
  onMoqMinChange,
  onMoqMaxChange,
  priceLow,
  priceHigh,
  onPriceLowChange,
  onPriceHighChange,
  priceMinBound,
  priceMaxBound,
  onApply,
  onReset,
  onClose,
}: ShopFiltersPanelProps) {
  const [openCategories, setOpenCategories] = useState(true);
  const [openPurchaseType, setOpenPurchaseType] = useState(true);
  const [openAvailability, setOpenAvailability] = useState(true);
  const [openMoq, setOpenMoq] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [openVendor, setOpenVendor] = useState(true);

  const isB2B = purchaseType === 'B2B';

  const vendorFilter = vendorSearch.trim().toLowerCase();
  const filteredVendors = vendors.filter(
    (v) =>
      !vendorFilter ||
      v.businessName.toLowerCase().includes(vendorFilter) ||
      v.id.toLowerCase().includes(vendorFilter),
  );

  return (
    <aside className="w-full min-w-0 sm:w-[280px] lg:w-[260px] shrink-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 bg-sidebar-bg border-b border-sidebar-border shrink-0">
        <h2 className="text-foreground font-bold text-base">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Reset All
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-[#ffcc99] hover:text-white rounded-lg transition-colors touch-target"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AccordionSection title="Vendor" open={openVendor} onToggle={() => setOpenVendor(!openVendor)}>
          <div className="space-y-2">
            <input
              type="search"
              value={vendorSearch}
              onChange={(e) => onVendorSearchChange(e.target.value)}
              placeholder="Narrow vendor list by name or ID…"
              className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
            />
            <select
              value={selectedSellerId}
              onChange={(e) => onSellerIdChange(e.target.value)}
              className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All vendors</option>
              {filteredVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName}
                </option>
              ))}
            </select>
          </div>
        </AccordionSection>

        <AccordionSection title="Categories" open={openCategories} onToggle={() => setOpenCategories(!openCategories)}>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory
                  ? 'bg-primary text-black font-semibold'
                  : 'text-foreground/80 hover:bg-sidebar-border/50 hover:text-foreground'
                }`}
            >
              All categories
            </button>
            {categories
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(selectedCategory === cat.slug ? '' : cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.slug
                      ? 'bg-primary text-black font-semibold'
                      : 'text-foreground/80 hover:bg-sidebar-border/50 hover:text-foreground'
                    }`}
                >
                  {categoryDisplayName(cat.slug, cat.name)}
                </button>
              ))}
          </nav>
        </AccordionSection>

        <AccordionSection title="Purchase Type" open={openPurchaseType} onToggle={() => setOpenPurchaseType(!openPurchaseType)}>
          <div className="flex rounded-lg overflow-hidden border border-sidebar-border">
            <button
              type="button"
              onClick={() => onPurchaseTypeChange('ALL')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${purchaseType === 'ALL'
                  ? 'bg-primary text-black'
                  : 'bg-transparent text-foreground/80 hover:text-foreground'
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onPurchaseTypeChange('B2C')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${purchaseType === 'B2C'
                  ? 'bg-primary text-black'
                  : 'bg-transparent text-foreground/80 hover:text-foreground'
                }`}
            >
              Retail
            </button>
            <button
              type="button"
              onClick={() => onPurchaseTypeChange('B2B')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${purchaseType === 'B2B'
                  ? 'bg-primary text-black'
                  : 'bg-transparent text-foreground/80 hover:text-foreground'
                }`}
            >
              Wholesale
            </button>
          </div>
          {isB2B && (
            <p className="text-foreground/60 text-xs mt-2">Min. order range filter appears below when wholesale is active.</p>
          )}
        </AccordionSection>

        <AccordionSection title="Availability" open={openAvailability} onToggle={() => setOpenAvailability(!openAvailability)}>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onInStockOnlyChange(e.target.checked)}
                className="rounded border-primary/50 text-primary focus:ring-primary bg-input-bg"
              />
              <span className="text-foreground/80 text-sm">In-stock only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedSellersOnly}
                onChange={(e) => onVerifiedSellersOnlyChange(e.target.checked)}
                className="rounded border-primary/50 text-primary focus:ring-primary bg-input-bg"
              />
              <span className="text-foreground/80 text-sm">Verified sellers only</span>
            </label>
          </div>
        </AccordionSection>

        {isB2B && (
          <AccordionSection title="Min. order range" open={openMoq} onToggle={() => setOpenMoq(!openMoq)}>
            <div className="space-y-3">
              <div>
                <label className="text-foreground/70 text-xs mb-1 block">Min. order (units)</label>
                <input
                  type="number"
                  value={moqMin}
                  onChange={(e) => onMoqMinChange(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-foreground/70 text-xs mb-1 block">Min. order up to (units)</label>
                <input
                  type="number"
                  value={moqMax}
                  onChange={(e) => onMoqMaxChange(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </AccordionSection>
        )}

        <AccordionSection title="Price Range (₦)" open={openPrice} onToggle={() => setOpenPrice(!openPrice)}>
          <PriceRangeSlider
            min={priceMinBound}
            max={priceMaxBound}
            low={priceLow}
            high={priceHigh}
            onLowChange={onPriceLowChange}
            onHighChange={onPriceHighChange}
            step={1000}
            formatValue={(v) => `₦${(v / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
          />
        </AccordionSection>
      </div>

      {/* Apply button - fixed at bottom of panel */}
      <div className="shrink-0 px-4 py-4 bg-sidebar-bg border-t border-sidebar-border">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
