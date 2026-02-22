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

interface ShopFiltersPanelProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  purchaseType: 'B2C' | 'B2B';
  onPurchaseTypeChange: (t: 'B2C' | 'B2B') => void;
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
    <div className="border-b border-[#2a2a2a] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 text-left text-white font-medium text-sm hover:text-[#FF6B00] transition-colors"
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

  const isB2B = purchaseType === 'B2B';

  return (
    <aside className="w-full min-w-0 sm:w-[280px] lg:w-[260px] shrink-0 bg-[#1A1A1A] border-r border-[#2a2a2a] flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 bg-[#1A1A1A] border-b border-[#2a2a2a] shrink-0">
        <h2 className="text-white font-bold text-base">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="text-[#FF6B00] hover:text-[#ff9955] text-sm font-medium transition-colors"
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
        <AccordionSection title="Categories" open={openCategories} onToggle={() => setOpenCategories(!openCategories)}>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-[#FF6B00] text-black font-semibold'
                  : 'text-[#ffcc99] hover:bg-[#2a2a2a] hover:text-white'
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
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-[#FF6B00] text-black font-semibold'
                      : 'text-[#ffcc99] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {categoryDisplayName(cat.slug, cat.name)}
                </button>
              ))}
          </nav>
        </AccordionSection>

        <AccordionSection title="Purchase Type" open={openPurchaseType} onToggle={() => setOpenPurchaseType(!openPurchaseType)}>
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => onPurchaseTypeChange('B2C')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                purchaseType === 'B2C'
                  ? 'bg-[#FF6B00] text-black'
                  : 'bg-transparent text-[#ffcc99] hover:text-white'
              }`}
            >
              B2C
            </button>
            <button
              type="button"
              onClick={() => onPurchaseTypeChange('B2B')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                purchaseType === 'B2B'
                  ? 'bg-[#FF6B00] text-black'
                  : 'bg-transparent text-[#ffcc99] hover:text-white'
              }`}
            >
              B2B / Bulk
            </button>
          </div>
          {isB2B && (
            <p className="text-[#ffcc99]/60 text-xs mt-2">MOQ range filter will appear below when B2B is active.</p>
          )}
        </AccordionSection>

        <AccordionSection title="Availability" open={openAvailability} onToggle={() => setOpenAvailability(!openAvailability)}>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onInStockOnlyChange(e.target.checked)}
                className="rounded border-[#FF6B00]/50 text-[#FF6B00] focus:ring-[#FF6B00] bg-[#111111]"
              />
              <span className="text-[#ffcc99] text-sm">In-stock only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedSellersOnly}
                onChange={(e) => onVerifiedSellersOnlyChange(e.target.checked)}
                className="rounded border-[#FF6B00]/50 text-[#FF6B00] focus:ring-[#FF6B00] bg-[#111111]"
              />
              <span className="text-[#ffcc99] text-sm">Verified sellers only</span>
            </label>
          </div>
        </AccordionSection>

        {isB2B && (
          <AccordionSection title="MOQ Range" open={openMoq} onToggle={() => setOpenMoq(!openMoq)}>
            <div className="space-y-3">
              <div>
                <label className="text-[#ffcc99] text-xs mb-1 block">Min MOQ (units)</label>
                <input
                  type="number"
                  value={moqMin}
                  onChange={(e) => onMoqMinChange(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-[#ffcc99] text-xs mb-1 block">Max MOQ (units)</label>
                <input
                  type="number"
                  value={moqMax}
                  onChange={(e) => onMoqMaxChange(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00]"
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
      <div className="shrink-0 px-4 py-4 bg-[#1A1A1A] border-t border-[#2a2a2a]">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-3 bg-[#FF6B00] text-black font-bold rounded-xl hover:bg-[#ff9955] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
