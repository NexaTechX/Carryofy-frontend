import { Star } from 'lucide-react';

/** Counts per star 1..5. Proportions used for bar widths. */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

function defaultDist(): RatingDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function ratingDistributionFromReviews(reviews: { rating: number }[]): RatingDistribution {
  const d = defaultDist();
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    d[star]++;
  }
  return d;
}

interface RatingDistributionBarProps {
  distribution: RatingDistribution;
  className?: string;
}

const STAR_COLORS = [
  'bg-red-500/80',
  'bg-orange-500/80',
  'bg-yellow-500/80',
  'bg-lime-500/80',
  'bg-emerald-500/80',
] as const;

export function RatingDistributionBar({ distribution, className }: RatingDistributionBarProps) {
  const total = (distribution[1] + distribution[2] + distribution[3] + distribution[4] + distribution[5]) || 1;
  const segments = ([1, 2, 3, 4, 5] as const).map((star) => ({
    star,
    count: distribution[star],
    width: (distribution[star] / total) * 100,
  }));

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-gray-400">
        <span className="font-medium uppercase tracking-wider">Rating distribution</span>
        <span className="tabular-nums">{total} review{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
        {segments.map(({ star, width, count }) => (
          <div
            key={star}
            className={`${STAR_COLORS[star - 1]} transition-all duration-300`}
            style={{ width: `${Math.max(width, width > 0 ? 4 : 0)}%` }}
            title={`${star}★: ${count}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-1 text-[10px] text-gray-500">
        {([1, 2, 3, 4, 5] as const).map((star) => (
          <span key={star} className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-current text-yellow-500/70" />
            {distribution[star]}
          </span>
        ))}
      </div>
    </div>
  );
}
