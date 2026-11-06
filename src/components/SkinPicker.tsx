import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSkins } from '@/lib/skins-context';
import { CATEGORY_LABELS } from '@/lib/skins';
import TierBadge from '@/components/TierBadge';

interface SkinPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  exclude?: string[];
  placeholder?: string;
  className?: string;
  /** 限定只在该武器下选择皮肤 */
  weapon?: string | null;
}

export default function SkinPicker({
  value,
  onChange,
  exclude = [],
  placeholder = '选择皮肤',
  className,
  weapon,
}: SkinPickerProps) {
  const { skins, status } = useSkins();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = skins.find((s) => s.id === value) ?? null;
  const excluded = new Set(exclude);
  const q = query.trim().toLowerCase();
  // 有武器限定时不按大类分组，直接列出该武器皮肤
  const categories = weapon
    ? []
    : [...new Set(skins.map((s) => s.category))];
  const poolFor = (cat: string | null) =>
    skins.filter((s) => (weapon ? s.weapon === weapon : s.category === cat) && !excluded.has(s.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between font-normal ${className ?? ''}`}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{selected.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{selected.weapon}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {status === 'loading' ? '皮肤数据加载中…' : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="搜索皮肤名称或武器…" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-72 [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:hover:bg-primary/80">
            <CommandEmpty>没有找到匹配的皮肤</CommandEmpty>
            {weapon ? (
              (() => {
                const pool = poolFor(null);
                const items = q
                  ? pool.filter(
                      (s) => s.name.toLowerCase().includes(q) || s.weapon.toLowerCase().includes(q),
                    )
                  : pool;
                if (items.length === 0) return null;
                return (
                  <CommandGroup heading={weapon}>
                    {items.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.name} ${s.weapon}`}
                        className="text-base"
                        onSelect={() => {
                          onChange(s.id);
                          setOpen(false);
                        }}
                      >
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{s.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            {s.tierKey ? <TierBadge tierKey={s.tierKey} tierName={s.tier} /> : null}
                            {!weapon && <span className="text-sm text-muted-foreground">{s.weapon}</span>}
                          </span>
                        </span>
                        {value === s.id && <Check className="ml-1 h-4 w-4 shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })()
            ) : (
              categories.map((cat) => {
                const pool = poolFor(cat);
                const items = q
                  ? pool.filter(
                      (s) => s.name.toLowerCase().includes(q) || s.weapon.toLowerCase().includes(q),
                    )
                  : pool.slice(0, 14);
                if (items.length === 0) return null;
                return (
                  <CommandGroup key={cat} heading={CATEGORY_LABELS[cat] ?? cat}>
                    {items.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.name} ${s.weapon}`}
                        className="text-base"
                        onSelect={() => {
                          onChange(s.id);
                          setOpen(false);
                        }}
                      >
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{s.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            {s.tierKey ? <TierBadge tierKey={s.tierKey} tierName={s.tier} /> : null}
                            {!weapon && <span className="text-sm text-muted-foreground">{s.weapon}</span>}
                          </span>
                        </span>
                        {value === s.id && <Check className="ml-1 h-4 w-4 shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
