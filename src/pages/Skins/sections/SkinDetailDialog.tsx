import { useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TierBadge from '@/components/TierBadge';
import { useRecords } from '@/lib/records-context';
import { isWished, toggleWish } from '@/lib/wishlist';
import { formatDateCN, weekdayCN } from '@/lib/dates';
import type { ISkin } from '@/lib/skins';

interface SkinDetailDialogProps {
  skin: ISkin;
  onClose: () => void;
}

export default function SkinDetailDialog({ skin, onClose }: SkinDetailDialogProps) {
  const { records } = useRecords();
  const [wished, setWished] = useState<boolean>(isWished(skin.id));

  const toggle = () => setWished(toggleWish(skin.id));

  const hits = records
    .filter((r) => r.skins.includes(skin.id))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = hits.reduce(
    (sum, r) => sum + r.skins.filter((id) => id === skin.id).length,
    0,
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span className="truncate">{skin.name}</span>
            {skin.tierKey ? <TierBadge tierKey={skin.tierKey} tierName={skin.tier} /> : null}
          </DialogTitle>
          <DialogDescription>武器：{skin.weapon}</DialogDescription>
        </DialogHeader>
        <button
          type="button"
          onClick={toggle}
          className={`mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            wished
              ? 'border-amber-400/70 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
              : 'border-border bg-muted/30 text-muted-foreground hover:border-amber-400/50 hover:text-amber-300'
          }`}
        >
          <Star className={`h-4 w-4 ${wished ? 'fill-amber-400 text-amber-400' : ''}`} />
          {wished ? '已许愿 · 抽中时会有庆祝特效' : '加入心愿单'}
        </button>
        {hits.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            尚未刷到过这款皮肤
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              共刷到 <span className="font-semibold text-foreground">{total}</span> 次
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hits.map((r) => (
                <span
                  key={r.id}
                  className="rounded-sm border border-border bg-muted/40 px-2 py-1 text-xs tabular-nums"
                >
                  {formatDateCN(r.date)} · {weekdayCN(r.date)}
                </span>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
