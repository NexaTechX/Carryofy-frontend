import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { aiOnboardingApi } from '../../lib/api/ai-onboarding';

interface BrandSelectorProps {
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  favoriteCategories?: string[];
}

export default function BrandSelector({ selectedBrands, onBrandsChange, favoriteCategories = [] }: BrandSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const category = favoriteCategories.length > 0 ? favoriteCategories[0] : undefined;
        const results = await aiOnboardingApi.getBrandSuggestions(category, searchTerm);
        setSuggestions(results.filter(brand => !selectedBrands.includes(brand)));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching brand suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, favoriteCategories, selectedBrands]);

  const addBrand = (brand: string) => {
    if (!selectedBrands.includes(brand) && brand.trim().length > 0) {
      onBrandsChange([...selectedBrands, brand.trim()]);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const removeBrand = (brand: string) => {
    onBrandsChange(selectedBrands.filter(b => b !== brand));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim().length > 0) {
      e.preventDefault();
      addBrand(searchTerm);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search for brands (e.g., Samsung, Nike, Apple)"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => addBrand(brand)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition"
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              {brand}
              <button
                type="button"
                onClick={() => removeBrand(brand)}
                className="hover:text-primary-dark"
                aria-label={`Remove ${brand}`}
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selectedBrands.length === 0 && searchTerm.length === 0 && (
        <p className="text-sm text-gray-500 text-center">
          Start typing to search for brands, or press Enter to add a custom brand
        </p>
      )}
    </div>
  );
}
