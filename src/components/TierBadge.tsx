import { TIER_META } from '@/lib/skins';
import type { TierKey } from '@/lib/skins';

interface TierBadgeProps {
  tierKey: TierKey;
  tierName?: string | null;
  /** sm=13px（图鉴等紧凑场景），md=15px（历史记录等大字场景） */
  size?: 'sm' | 'md';
}

export default function TierBadge({ tierKey, tierName, size = 'sm' }: TierBadgeProps) {
  if (!tierKey) return null;
  const meta = TIER_META[tierKey];
  const label = tierName || meta.label;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm border font-semibold leading-none ${
        size === 'md' ? 'px-2 py-1 text-[15px]' : 'px-1.5 py-0.5 text-[13px]'
      }`}
      style={{
        color: meta.chartVar,
        borderColor: `color-mix(in srgb, ${meta.chartVar} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${meta.chartVar} 12%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
