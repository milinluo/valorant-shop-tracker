import { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, Trash2, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import TierBadge from '@/components/TierBadge';
import { useSkins } from '@/lib/skins-context';
import { TIER_KEYS, TIER_META } from '@/lib/skins';
import type { ISkin, TierKey } from '@/lib/skins';
import { WEAPON_ORDER } from '@/lib/skins';

const TIER_VALUES: TierKey[] = [...TIER_KEYS];
const TIER_LABELS: Record<string, string> = Object.fromEntries(
  TIER_KEYS.map((k) => [k, TIER_META[k].label]),
);

/** 所属武器选择器：搜索式下拉，候选列表带红色滚动条 */
function WeaponPicker({
  value,
  onChange,
  weapons,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  weapons: string[];
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`justify-start font-normal ${value ? '' : 'text-muted-foreground'} ${className ?? ''}`}
        >
          {value || '所属武器'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索武器…" />
          <CommandList className="max-h-52 [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:hover:bg-primary/80">
            <CommandEmpty>没有匹配的武器</CommandEmpty>
            {weapons.map((w) => (
              <CommandItem
                key={w}
                value={w}
                onSelect={() => onChange(w)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{w}</span>
                {value === w && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ManagerDialogProps {
  onClose: () => void;
}

interface FormState {
  name: string;
  weapon: string;
  tier: TierKey | null;
  vp: string;
}

const EMPTY_FORM: FormState = { name: '', weapon: '', tier: null, vp: '' };

export default function SkinManagerDialog({ onClose }: ManagerDialogProps) {
  const { skins, custom, addSkin, updateSkin, removeSkin, restoreSkin } = useSkins();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [showRemoved, setShowRemoved] = useState(false);

  const customIds = useMemo(() => new Set(custom.added.map((s) => s.id)), [custom.added]);
  const weaponOptions = useMemo(
    () => [...new Set([...WEAPON_ORDER, ...skins.map((s) => s.weapon)])],
    [skins],
  );

  const q = query.trim().toLowerCase();
  const filtered = skins.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.weapon.toLowerCase().includes(q) ||
      (s.tier ?? '').toLowerCase().includes(q),
  );

  const removedSkins = custom.removed.map((id) => ({
    id,
    name: custom.removedInfo[id]?.name ?? id,
    weapon: custom.removedInfo[id]?.weapon ?? '',
  }));

  const makeId = () =>
    `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const validate = (f: FormState): string | null => {
    if (!f.name.trim()) return '皮肤名称不能为空';
    if (!f.weapon.trim()) return '所属武器不能为空';
    if (!f.tier) return '请选择品质';
    if (f.vp.trim() !== '' && (!Number.isFinite(Number(f.vp)) || Number(f.vp) < 0)) return '价格必须是数字';
    return null;
  };

  const toSkin = (f: FormState): ISkin => {
    const vp = f.vp.trim() === '' ? undefined : Number(f.vp);
    return {
      id: makeId(),
      name: f.name.trim(),
      weapon: f.weapon.trim(),
      category: 'Custom',
      tier: TIER_META[f.tier as TierKey].label,
      tierKey: f.tier as TierKey,
      vp,
    };
  };

  const handleAdd = () => {
    const err = validate(form);
    if (err) {
      alert(err);
      return;
    }
    addSkin(toSkin(form));
    setForm(EMPTY_FORM);
  };

  const startEdit = (s: ISkin) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      weapon: s.weapon,
      tier: s.tierKey ?? null,
      vp: s.vp != null ? String(s.vp) : '',
    });
  };

  const saveEdit = (id: string) => {
    const err = validate(editForm);
    if (err) {
      alert(err);
      return;
    }
    updateSkin(id, {
      name: editForm.name.trim(),
      weapon: editForm.weapon.trim(),
      tier: TIER_META[editForm.tier as TierKey].label,
      tierKey: editForm.tier as TierKey,
      vp: editForm.vp.trim() === '' ? undefined : Number(editForm.vp),
    });
    setEditingId(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 pb-3">
          <DialogTitle>管理皮肤信息</DialogTitle>
          <DialogDescription>
            可新增、修改或删除皮肤。内置皮肤被删除后可在下方「已删除」中恢复。
          </DialogDescription>
        </DialogHeader>

        {/* 新增皮肤表单 */}
        <div className="shrink-0 rounded-md border border-border bg-muted/20 p-3">
          <p className="mb-2 text-sm font-semibold">新增皮肤</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="皮肤名称"
              className="w-44"
            />
            <WeaponPicker
              value={form.weapon}
              onChange={(v) => setForm({ ...form, weapon: v })}
              weapons={weaponOptions}
              className="w-32"
            />
            <Select
              value={form.tier ?? undefined}
              onValueChange={(v) => setForm({ ...form, tier: v as TierKey })}
            >
              <SelectTrigger className="w-28">
                {form.tier ? <SelectValue /> : <span className="text-muted-foreground">所属品质</span>}
              </SelectTrigger>
              <SelectContent>
                {TIER_VALUES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TIER_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={form.vp}
              onChange={(e) => setForm({ ...form, vp: e.target.value })}
              placeholder="价格(点券)"
              className="w-28"
              inputMode="numeric"
            />
            <Button type="button" onClick={handleAdd} className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>
        </div>

        {/* 列表 + 搜索 */}
        <div className="mt-3 flex shrink-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索皮肤名称 / 武器…"
              className="pl-8"
            />
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">共 {filtered.length} 款</span>
        </div>

        <ScrollArea className="mt-3 h-[46vh] rounded-md pr-3">
          <div className="space-y-1.5">
            {filtered.map((s) =>
              editingId === s.id ? (
                <div
                  key={s.id}
                  className="rounded-md border border-primary/40 bg-muted/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="皮肤名称"
                      className="w-40"
                    />
                    <WeaponPicker
                      value={editForm.weapon}
                      onChange={(v) => setEditForm({ ...editForm, weapon: v })}
                      weapons={weaponOptions}
                      className="w-28"
                    />
                    <Select
                      value={editForm.tier ?? undefined}
                      onValueChange={(v) => setEditForm({ ...editForm, tier: v as TierKey })}
                    >
                      <SelectTrigger className="w-28">
                        {editForm.tier ? <SelectValue /> : <span className="text-muted-foreground">所属品质</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_VALUES.map((k) => (
                          <SelectItem key={k} value={k}>
                            {TIER_LABELS[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={editForm.vp}
                      onChange={(e) => setEditForm({ ...editForm, vp: e.target.value })}
                      placeholder="价格(点券)"
                      className="w-28"
                      inputMode="numeric"
                    />
                    <Button type="button" size="sm" onClick={() => saveEdit(s.id)}>
                      保存
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 transition-colors hover:border-primary/30"
                >
                  <span className="min-w-0 flex-1 truncate text-base">{s.name}</span>
                  <span className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
                    {s.weapon}
                  </span>
                  {s.tierKey ? <TierBadge tierKey={s.tierKey} /> : <span className="w-12 text-center text-xs text-muted-foreground">—</span>}
                  <span className="w-24 shrink-0 text-right text-[13px] font-semibold text-amber-500">
                    {s.vp != null ? `${s.vp.toLocaleString()} 点券` : ''}
                  </span>
                  {customIds.has(s.id) && (
                    <span className="shrink-0 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                      自定义
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeSkin(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ),
            )}
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">没有符合条件的皮肤。</div>
            )}
          </div>
          <ScrollBar
            orientation="vertical"
            className="w-2.5 border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
          />
        </ScrollArea>

        {/* 已删除皮肤 */}
        <div className="mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowRemoved((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
            已删除皮肤（{removedSkins.length}）
          </button>
          {showRemoved && removedSkins.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {removedSkins.map(({ id, name, weapon }) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-sm border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
                >
                  {name}
                  {weapon ? <span className="opacity-60">· {weapon}</span> : null}
                  <button
                    type="button"
                    onClick={() => restoreSkin(id)}
                    className="inline-flex items-center gap-0.5 text-foreground transition-colors hover:text-primary"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    恢复
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
