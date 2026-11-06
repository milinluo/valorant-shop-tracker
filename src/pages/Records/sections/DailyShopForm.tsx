import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SkinPicker from '@/components/SkinPicker';
import WishHitEffect from '@/components/WishHitEffect';
import { useRecords } from '@/lib/records-context';
import { useSkins } from '@/lib/skins-context';
import { getWishlist } from '@/lib/wishlist';
import { orderWeapons } from '@/lib/skins';
import { formatDateCN, toISODate } from '@/lib/dates';

const DEFAULT_DATE = toISODate(new Date());
const SLOT_LABELS = ['槽位 1', '槽位 2', '槽位 3', '槽位 4'];
const NONE = '__none__';

interface SlotState {
  weapon: string | null;
  skinId: string | null;
}

const emptySlots = (): SlotState[] => [
  { weapon: null, skinId: null },
  { weapon: null, skinId: null },
  { weapon: null, skinId: null },
  { weapon: null, skinId: null },
];

interface DailyShopFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 手动输入今日商店：自动获取失效时在弹出的窗口中手动选择皮肤 */
export default function DailyShopForm({ open, onOpenChange }: DailyShopFormProps) {
  const { records, upsertRecord } = useRecords();
  const { skins } = useSkins();
  const [date, setDate] = useState<string>(DEFAULT_DATE);
  const [slots, setSlots] = useState<SlotState[]>(() => {
    const arr = emptySlots();
    const todayRec = records.find((r) => r.date === DEFAULT_DATE);
    if (todayRec) {
      todayRec.skins.forEach((id, i) => {
        if (i < 4) {
          const skin = skins.find((s) => s.id === id);
          arr[i] = { weapon: skin?.weapon ?? null, skinId: id };
        }
      });
    }
    return arr;
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{ date: string; skins: string[] } | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const celebrateIfWished = (ids: string[]) => {
    const wishSet = new Set(getWishlist());
    const hit = ids.find((id) => wishSet.has(id));
    if (hit) {
      const s = skins.find((x) => x.id === hit);
      setCelebrate(s?.name ?? '心愿皮肤');
    }
  };

  // 武器列表：按游戏内官方顺序（佩枪→冲锋→霰弹→步枪→狙击→重武器→近战）
  const weapons = orderWeapons([...new Set(skins.map((s) => s.weapon))]);

  const setSlotWeapon = (i: number, weapon: string | null) => {
    setSlots((prev) =>
      prev.map((v, idx) => {
        if (idx !== i) return v;
        // 更换武器时清掉不属于该武器的已选皮肤
        const skin = skins.find((s) => s.id === v.skinId);
        if (v.skinId && skin && skin.weapon !== weapon) {
          return { weapon, skinId: null };
        }
        return { ...v, weapon };
      }),
    );
  };

  const setSlotSkin = (i: number, skinId: string | null) => {
    setSlots((prev) => prev.map((v, idx) => (idx === i ? { ...v, skinId } : v)));
  };

  const clearSlot = (i: number) => {
    setSlots((prev) => prev.map((v, idx) => (idx === i ? { weapon: null, skinId: null } : v)));
  };

  const handleSave = () => {
    const picked = slots.filter((s): s is SlotState & { skinId: string } => Boolean(s.skinId)).map((s) => s.skinId);
    if (picked.length === 0) {
      toast.error('至少选择一个皮肤');
      return;
    }
    if (new Set(picked).size !== picked.length) {
      toast.error('同一天不能选择重复的皮肤');
      return;
    }
    const existing = records.find((r) => r.date === date);
    if (existing) {
      setPending({ date, skins: picked });
      setConfirmOpen(true);
      return;
    }
    upsertRecord(date, picked);
    celebrateIfWished(picked);
    toast.success(`${formatDateCN(date)}的商店皮肤已记录`);
    onOpenChange(false);
  };

  const handleConfirmReplace = () => {
    if (!pending) return;
    upsertRecord(pending.date, pending.skins);
    celebrateIfWished(pending.skins);
    toast.success(`${formatDateCN(pending.date)}的商店皮肤已更新`);
    setConfirmOpen(false);
    setPending(null);
    onOpenChange(false);
  };

  const filled = slots.filter((s) => Boolean(s.skinId)).length;
  const pickedIds = slots.filter((s): s is SlotState & { skinId: string } => Boolean(s.skinId)).map((s) => s.skinId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-base">手动输入今日商店</DialogTitle>
          <DialogDescription>
            每个槽位先选枪械种类，再选该枪械下的皮肤（最多 4 个）· 已选 {filled}/4
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="shop-date" className="text-sm text-muted-foreground">
              刷新日期
            </label>
            <Input
              id="shop-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setDate(DEFAULT_DATE)}>
              今天
            </Button>
            <div className="flex-1" />
            <Button type="button" onClick={handleSave} className="min-w-28">
              保存今日刷新
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SLOT_LABELS.map((label, i) => {
              const slot = slots[i];
              const slotWished = Boolean(slot.skinId && new Set(getWishlist()).has(slot.skinId));
              return (
                <div
                  key={label}
                  className={`rounded-md border p-2.5 ${
                    slotWished
                      ? 'border-amber-400/70 bg-amber-400/5 shadow-[0_0_14px_rgba(255,190,0,0.15)]'
                      : 'border-border bg-muted/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {slotWished && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      {label}
                    </span>
                    {slot.skinId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground"
                        onClick={() => clearSlot(i)}
                        aria-label={`清除${label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={slot.weapon ?? NONE}
                      onValueChange={(v) => setSlotWeapon(i, v === NONE ? null : v)}
                    >
                      <SelectTrigger className="h-10 w-full text-base">
                        <SelectValue placeholder="选择枪械" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>未选择枪械</SelectItem>
                        {weapons.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {slot.weapon ? (
                      <SkinPicker
                        value={slot.skinId}
                        onChange={(id) => setSlotSkin(i, id)}
                        exclude={pickedIds.filter((id) => id !== slot.skinId)}
                        weapon={slot.weapon}
                        placeholder="选择皮肤"
                        className="h-10 text-base"
                      />
                    ) : (
                      <Button type="button" variant="outline" disabled className="h-10 w-full justify-between font-normal text-base">
                        <span className="text-muted-foreground">请先选择枪械</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>该日期已有记录</AlertDialogTitle>
              <AlertDialogDescription>
                {pending ? `${formatDateCN(pending.date)} 已经记录过一次商店皮肤，保存会覆盖原记录，确定继续吗？` : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReplace}>覆盖并保存</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {celebrate && <WishHitEffect skinName={celebrate} onDone={() => setCelebrate(null)} />}
      </DialogContent>
    </Dialog>
  );
}
