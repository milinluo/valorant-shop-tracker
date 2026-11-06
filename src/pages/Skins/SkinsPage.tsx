import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Settings2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import TierBadge from '@/components/TierBadge';
import SkinDetailDialog from './sections/SkinDetailDialog';
import SkinManagerDialog from './sections/SkinManagerDialog';
import { useSkins } from '@/lib/skins-context';
import { useRecords } from '@/lib/records-context';
import { useSettings } from '@/lib/settings-context';
import { getWishlist, toggleWish } from '@/lib/wishlist';
import { TIER_KEYS, TIER_META } from '@/lib/skins';
import type { ISkin } from '@/lib/skins';
import type { IRecord } from '@/lib/records';
import { formatDateCN } from '@/lib/dates';

/** 与游戏内图鉴「枪型」页一致的武器顺序 */
const WEAPON_ORDER = [
  '狂徒', '幻影', '近战武器', '正义', '冥驹', '鬼魅', '骇灵', '标配', '短炮', '狂怒',
  '蜂刺', '雄鹿', '判官', '獠犬', '戍卫', '飞将', '战神', '奥丁', '莽侠', '追猎', '悍狼',
];

/** 武器卡片拖拽排序的本地存储键 */
const WEAPON_ORDER_KEY = 'skin-weapon-order';

function loadWeaponOrder(): string[] {
  try {
    const raw = localStorage.getItem(WEAPON_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    // 忽略损坏的本地数据
  }
  return [];
}

function lastSeenDate(records: IRecord[], skinId: string): string | null {
  let last: string | null = null;
  for (const r of records) {
    if (r.skins.includes(skinId) && (last === null || r.date > last)) last = r.date;
  }
  return last;
}

/** 距今多少天（以本地日期为准，当天为 0 天） */
function daysSince(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

function ProgressRing({
  seen,
  total,
  size = 68,
  stroke = 5,
}: {
  seen: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(seen / total, 1) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(210 30% 22%)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 - 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize={size / 3.8}
        fontWeight={700}
      >
        {seen}
      </text>
      <text
        x={size / 2}
        y={size / 2 + size / 5.6}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--muted-foreground)"
        fontSize={size / 5.6}
      >
        / {total}
      </text>
    </svg>
  );
}

export default function SkinsPage() {
  const { skins, status, error } = useSkins();
  const { records } = useRecords();
  const { skinGridCols } = useSettings();
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [seenFilter, setSeenFilter] = useState<'all' | 'seen' | 'unseen'>('all');
  const [weaponView, setWeaponView] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weapon' | 'collection'>('weapon');
  const [collectionView, setCollectionView] = useState<string | null>(null);
  const [selected, setSelected] = useState<ISkin | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [weaponOrder, setWeaponOrder] = useState<string[]>(loadWeaponOrder);
  const [dragWeapon, setDragWeapon] = useState<string | null>(null);
  const [dragOverWeapon, setDragOverWeapon] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<'before' | 'after' | null>(null);
  const [wishSet, setWishSet] = useState<Set<string>>(() => new Set(getWishlist()));

  const toggleRowWish = (id: string) => {
    toggleWish(id);
    setWishSet(new Set(getWishlist()));
  };

  const countBySkin = new Map<string, number>();
  for (const r of records) {
    for (const id of r.skins) {
      countBySkin.set(id, (countBySkin.get(id) ?? 0) + 1);
    }
  }

  const baseWeapons = [
    ...WEAPON_ORDER.filter((w) => skins.some((s) => s.weapon === w)),
    ...[...new Set(skins.map((s) => s.weapon))].filter((w) => w && !WEAPON_ORDER.includes(w)),
  ];
  const orderedWeapons = [
    ...weaponOrder.filter((w) => baseWeapons.includes(w)),
    ...baseWeapons.filter((w) => !weaponOrder.includes(w)),
  ];

  const persistWeaponOrder = (order: string[]) => {
    setWeaponOrder(order);
    try {
      localStorage.setItem(WEAPON_ORDER_KEY, JSON.stringify(order));
    } catch {
      // 存储失败不影响本次会话内的排序
    }
  };

  const handleWeaponDrop = (target: string) => {
    if (!dragWeapon || dragWeapon === target) {
      setDragWeapon(null);
      setDragOverWeapon(null);
      setDropSide(null);
      return;
    }
    const next = orderedWeapons.filter((w) => w !== dragWeapon);
    let idx = next.indexOf(target);
    if (dropSide === 'after') idx += 1;
    next.splice(idx, 0, dragWeapon);
    persistWeaponOrder(next);
    setDragWeapon(null);
    setDragOverWeapon(null);
    setDropSide(null);
  };

  const q = query.trim().toLowerCase();
  const matchesQuery = (s: ISkin) => {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.weapon.toLowerCase().includes(q);
  };
  const matchesSeen = (s: ISkin) => {
    const seen = countBySkin.has(s.id);
    if (seenFilter === 'all') return true;
    return seenFilter === 'seen' ? seen : !seen;
  };

  // 皮肤名中的系列版本号（如 盖亚的复仇//2.0 → 2），无版本为 0
  const versionOf = (s: ISkin) => {
    const m = s.name.match(/\/\/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  // 二级视图：当前武器的皮肤，按品质分组
  const weaponSkins = weaponView
    ? skins
        .filter((s) => s.weapon === weaponView && (tier === 'all' || s.tierKey === tier) && matchesQuery(s) && matchesSeen(s))
        .sort((a, b) => versionOf(a) - versionOf(b) || 0)
    : [];
  const weaponGrouped = [...TIER_KEYS].reverse().map((key) => ({
    key,
    items: weaponSkins.filter((s) => s.tierKey === key),
  })).filter((g) => g.items.length > 0);

  // 一级搜索：跨武器的匹配结果
  const searchResults = q ? skins.filter((s) => matchesQuery(s) && matchesSeen(s)) : [];

  // 武器网格：按当前刷到状态筛选（仅过滤显示哪些武器，卡片内进度统计保持完整）
  const gridWeapons = orderedWeapons.filter((w) => {
    const list = skins.filter((s) => s.weapon === w);
    return list.some(matchesSeen);
  });

  const seenCountOf = (s: ISkin) => countBySkin.get(s.id) ?? 0;

  const openDetail = (s: ISkin) => setSelected(s);

  const backToList = () => {
    setWeaponView(null);
    setTier('all');
  };

  // 按系列分组（皮肤数降序，「其他」固定最后）
  const collectionGroups = useMemo(() => {
    const m = new Map<string, ISkin[]>();
    for (const s of skins) {
      const c = s.collection || '其他';
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(s);
    }
    return [...m.entries()].sort((a, b) =>
      a[0] === '其他' ? 1 : b[0] === '其他' ? -1 : b[1].length - a[1].length,
    );
  }, [skins]);

  // 系列一级：匹配搜索与已见/未见筛选的系列
  const visibleCollections = collectionGroups.filter(([name, list]) => {
    if (seenFilter === 'seen' && !list.some((s) => countBySkin.has(s.id))) return false;
    if (seenFilter === 'unseen' && !list.some((s) => !countBySkin.has(s.id))) return false;
    if (q && !name.toLowerCase().includes(q) && !list.some((s) => s.name.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });

  // 系列二级：当前系列皮肤，按品质分组；同品质内 本系列(无版本) → 2.0 → 3.0
  const collectionSkins = collectionView
    ? skins
        .filter(
          (s) =>
            (s.collection || '其他') === collectionView &&
            (tier === 'all' || s.tierKey === tier) &&
            matchesQuery(s) &&
            matchesSeen(s),
        )
        .sort((a, b) => versionOf(a) - versionOf(b) || 0)
    : [];
  const collectionGrouped = [...TIER_KEYS].reverse()
    .map((key) => ({ key, items: collectionSkins.filter((s) => s.tierKey === key) }))
    .filter((g) => g.items.length > 0);

  const backToCollections = () => {
    setCollectionView(null);
    setTier('all');
  };

  const switchView = (m: 'weapon' | 'collection') => {
    setViewMode(m);
    setWeaponView(null);
    setCollectionView(null);
    setQuery('');
    setTier('all');
  };

  const renderSkinRow = (s: ISkin, showWeapon: boolean) => {
    const seen = seenCountOf(s);
    const last = lastSeenDate(records, s.id);
    const wished = wishSet.has(s.id);
    return (
      <div
        key={s.id}
        onClick={() => openDetail(s)}
        className="group flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted/40"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleRowWish(s.id);
          }}
          aria-label={wished ? '移出心愿单' : '加入心愿单'}
          className={`shrink-0 rounded p-0.5 transition-colors ${
            wished
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-amber-300'
          }`}
        >
          <Star className={`h-4 w-4 ${wished ? 'fill-amber-400' : ''}`} />
        </button>
        <span className="min-w-0 flex-1 truncate text-base">{s.name}</span>
        {showWeapon && (
          <span className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
            {s.weapon}
          </span>
        )}
        <span className="flex shrink-0 items-center justify-end gap-1.5">
          <span className="w-52 shrink-0 whitespace-nowrap text-right text-sm text-muted-foreground">
            {seen > 0 && last ? `最近 ${formatDateCN(last)}（距今 ${daysSince(last)} 天）` : ''}
          </span>
          <span
            className={`w-16 shrink-0 rounded-sm border px-1 py-0.5 text-center text-[13px] font-semibold ${
              seen > 0
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                : 'border-foreground/30 bg-foreground/10 text-foreground'
            }`}
          >
            {seen > 0 ? `已见 ×${seen}` : '未见'}
          </span>
          {s.tierKey ? <TierBadge tierKey={s.tierKey} tierName={s.tier} /> : null}
          {s.vp ? (
            <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-amber-500">
              {s.vp.toLocaleString()} 点券
            </span>
          ) : null}
        </span>
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Skin Vault</p>
        <h1 className="mt-1 border-l-2 border-primary pl-3 text-2xl font-bold tracking-tight">皮肤图鉴</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          全部 {skins.length} 款武器皮肤，已记录其中 {countBySkin.size} 款。点击任意皮肤可查看它的刷新记录。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-fit items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5 text-xs">
          {(['weapon', 'collection'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchView(m)}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                viewMode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'weapon' ? '按武器' : '按系列'}
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索皮肤名称…"
            className="pl-8"
          />
        </div>
        {weaponView || (viewMode === 'collection' && collectionView) ? (
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="皮肤品质" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部品质</SelectItem>
              {[...TIER_KEYS].reverse().map((key) => (
                <SelectItem key={key} value={key}>
                  {TIER_META[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select
          value={seenFilter}
          onValueChange={(v) => setSeenFilter(v as 'all' | 'seen' | 'unseen')}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="刷到状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="seen">已见</SelectItem>
            <SelectItem value="unseen">未见</SelectItem>
          </SelectContent>
        </Select>
        {!weaponView && (
          <span className="text-sm text-muted-foreground">
            {q ? `匹配 ${searchResults.length} 款皮肤` : `共 ${gridWeapons.length} 种武器`}
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setManagerOpen(true)}
        >
          <Settings2 className="h-4 w-4" />
          管理皮肤
        </Button>
      </div>

      {status === 'loading' && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
          皮肤数据加载失败：{error}。请刷新页面重试。
        </div>
      )}

      {status === 'ready' && (
        <>
          {viewMode === 'collection' ? (
            collectionView ? (
              <Card>
                <CardHeader>
                  <button
                    onClick={backToCollections}
                    className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    返回系列列表
                  </button>
                  <CardTitle className="text-xl">
                    {collectionView}
                    <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                      已见 {collectionSkins.filter((s) => countBySkin.has(s.id)).length} /{' '}
                      {collectionSkins.length} 款（当前筛选）
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">按品质展示 · 点击皮肤查看刷新记录</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {collectionGrouped.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      没有符合条件的皮肤，换个关键词试试。
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-380px)] rounded-md pr-3">
                      <div className="space-y-5">
                        {collectionGrouped.map((g) => (
                          <section key={g.key}>
                            <div className="mb-2 flex items-center justify-between">
                              <TierBadge tierKey={g.key} />
                              <span className="text-sm text-muted-foreground">
                                共 {g.items.length} 款 · 已见{' '}
                                {g.items.filter((s) => countBySkin.has(s.id)).length} 款
                              </span>
                            </div>
                            <div className="rounded-md border border-border">
                              {g.items.map((s) => renderSkinRow(s, true))}
                            </div>
                          </section>
                        ))}
                      </div>
                      <ScrollBar
                        orientation="vertical"
                        forceMount
                        className="w-[7px] border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
                      />
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            ) : visibleCollections.length === 0 ? (
              <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                没有符合当前筛选的系列，换个筛选条件试试。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCollections.map(([name, list]) => {
                  const seen = list.filter((s) => countBySkin.has(s.id)).length;
                  const shown = list.filter((s) => matchesQuery(s) && matchesSeen(s)).length;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setCollectionView(name);
                        setTier('all');
                      }}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-base font-semibold">{name}</span>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {shown} 款 · 已见 {seen}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : weaponView ? (
            <Card>
              <CardHeader>
                <button
                  onClick={backToList}
                  className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回武器列表
                </button>
                <CardTitle className="text-xl">
                  {weaponView}
                  <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                    已见 {weaponSkins.filter((s) => countBySkin.has(s.id)).length} /{' '}
                    {weaponSkins.length} 款（当前筛选）
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">按品质展示 · 点击皮肤查看刷新记录</p>
              </CardHeader>
              <CardContent className="pt-0">
                {weaponGrouped.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    没有符合条件的皮肤，换个关键词试试。
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-380px)] rounded-md pr-3">
                    <div className="space-y-5">
                      {weaponGrouped.map((g) => (
                        <section key={g.key}>
                          <div className="mb-2 flex items-center justify-between">
                            <TierBadge tierKey={g.key} />
                            <span className="text-sm text-muted-foreground">
                              共 {g.items.length} 款 · 已见 {g.items.filter((s) => countBySkin.has(s.id)).length} 款
                            </span>
                          </div>
                          <div className="rounded-md border border-border">
                            {g.items.map((s) => renderSkinRow(s, false))}
                          </div>
                        </section>
                      ))}
                    </div>
                    <ScrollBar
                      orientation="vertical"
                      forceMount
                      className="w-2.5 border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
                    />
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : q ? (
            <Card>
              <CardHeader>
                <button
                  onClick={() => setQuery('')}
                  className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回武器列表
                </button>
              </CardHeader>
              <CardContent className="pt-0">
                {searchResults.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    没有符合条件的皮肤，换个关键词试试。
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-380px)] rounded-md pr-3">
                    {searchResults.map((s) => renderSkinRow(s, true))}
                    <ScrollBar
                      orientation="vertical"
                      forceMount
                      className="w-2.5 border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
                    />
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : gridWeapons.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              没有符合当前筛选的武器，换个筛选条件试试。
            </div>
          ) : (
            <div className={`grid gap-3 ${skinGridCols === 6 ? 'grid-cols-6' : skinGridCols === 8 ? 'grid-cols-8' : 'grid-cols-7'}`}>
                {gridWeapons.map((w) => {
                  const list = skins.filter((s) => s.weapon === w);
                  const seen = list.filter((s) => countBySkin.has(s.id)).length;
                  const isDragging = dragWeapon === w;
                  const showSlot =
                    dragWeapon !== null && dragWeapon !== w && dragOverWeapon === w;
                  return (
                    <button
                      key={w}
                      draggable
                      onClick={() => {
                        setWeaponView(w);
                        setQuery('');
                        setTier('all');
                      }}
                      onDragStart={(e) => {
                        setDragWeapon(w);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', w);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = e.currentTarget.getBoundingClientRect();
                        const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                        if (dragOverWeapon !== w || dropSide !== side) {
                          setDragOverWeapon(w);
                          setDropSide(side);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverWeapon === w) {
                          setDragOverWeapon(null);
                          setDropSide(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleWeaponDrop(w);
                      }}
                      onDragEnd={() => {
                        setDragWeapon(null);
                        setDragOverWeapon(null);
                        setDropSide(null);
                      }}
                      className={`group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-4 transition-colors hover:border-primary/40 hover:bg-muted/50 ${
                        isDragging ? 'cursor-grabbing opacity-40' : 'cursor-grab'
                      }`}
                    >
                      {showSlot && (
                        <span
                          className={`pointer-events-none absolute top-1/2 z-10 h-[62%] w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_3px_rgba(248,60,90,0.55)] ${
                            dropSide === 'before' ? '-left-[7px]' : '-right-[7px]'
                          }`}
                        />
                      )}
                      <span className="text-xl font-bold">{w}</span>
                      <ProgressRing seen={seen} total={list.length} size={76} stroke={5} />
                      <span className="text-sm text-muted-foreground">翻牌进度</span>
                    </button>
                  );
                })}
              </div>
          )}
        </>
      )}

      {selected && <SkinDetailDialog skin={selected} onClose={() => setSelected(null)} />}
      {managerOpen && <SkinManagerDialog onClose={() => setManagerOpen(false)} />}
    </div>
  );
}
