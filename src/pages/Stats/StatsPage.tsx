import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TierBadge from '@/components/TierBadge';
import { useSkins } from '@/lib/skins-context';
import { useRecords } from '@/lib/records-context';
import { useSettings } from '@/lib/settings-context';
import { TIER_KEYS, TIER_META, orderWeapons } from '@/lib/skins';
import type { ISkin, TierKey } from '@/lib/skins';
import type { IRecord } from '@/lib/records';
import { toISODate } from '@/lib/dates';

interface TierFreqItem {
  key: TierKey;
  count: number;
}

function computeTierFreq(
  records: IRecord[],
  skinById: Map<string, ISkin>,
  allowedDays?: Set<string>,
): TierFreqItem[] {
  const freq: TierFreqItem[] = TIER_KEYS.map((key) => ({ key, count: 0 }));
  for (const r of records) {
    if (allowedDays && !allowedDays.has(r.date)) continue;
    for (const id of r.skins) {
      const s = skinById.get(id);
      if (s?.tierKey) {
        const item = freq.find((t) => t.key === s.tierKey);
        if (item) item.count += 1;
      }
    }
  }
  return freq;
}

function TierFreqChart({ freq, title, sub }: { freq: TierFreqItem[]; title: string; sub: string }) {
  const { statsChartMode: mode } = useSettings();
  const maxFreq = Math.max(1, ...freq.map((t) => t.count));
  const total = freq.reduce((a, t) => a + t.count, 0);

  const pieSize = 172;
  const pieR = 70;
  const cx = pieSize / 2;
  const cy = pieSize / 2;
  const segs = freq
    .filter((t) => t.count > 0)
    .reduce<{ key: TierKey; count: number; a: number; b: number }[]>((acc, t) => {
      const start = acc.length > 0 ? acc[acc.length - 1].b : -90;
      const sweep = total > 0 ? (t.count / total) * 360 : 0;
      acc.push({ ...t, a: start, b: start + sweep });
      return acc;
    }, []);
  const arcPath = (a: number, b: number) => {
    const rad = (d: number) => (d * Math.PI) / 180;
    const p1 = { x: cx + pieR * Math.cos(rad(a)), y: cy + pieR * Math.sin(rad(a)) };
    const p2 = { x: cx + pieR * Math.cos(rad(b)), y: cy + pieR * Math.sin(rad(b)) };
    const large = b - a > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${pieR} ${pieR} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  };

  return (
    <Card className="flex flex-col transition-colors hover:border-primary/30">
      <CardHeader className="border-b border-border pb-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardHeader>
      <CardContent className="flex h-[272px] shrink-0 flex-col items-center justify-center gap-3 pt-4">
        {mode === 'bar' ? (
          <div className="flex h-full w-full shrink-0 items-end gap-2 sm:gap-3">
            {freq.map((t) => (
              <div
                key={t.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              >
                    <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                <div
                  className="w-full max-w-12 rounded-sm"
                  style={{
                    height: `${Math.max((t.count / maxFreq) * 192, t.count > 0 ? 8 : 2)}px`,
                    background: `linear-gradient(to top, ${TIER_META[t.key].chartVar}, color-mix(in srgb, ${TIER_META[t.key].chartVar} 45%, transparent))`,
                    opacity: t.count > 0 ? 1 : 0.25,
                  }}
                />
                <TierBadge tierKey={t.key} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="shrink-0 font-mono text-sm font-medium text-muted-foreground">
              共 {total} 次
            </div>
            <div className="relative shrink-0" style={{ width: pieSize, height: pieSize }}>
              <svg width={pieSize} height={pieSize} viewBox={`0 0 ${pieSize} ${pieSize}`} className="block">
                {segs.map((t) => (
                  <path
                    key={t.key}
                    d={arcPath(t.a, t.b)}
                    fill={TIER_META[t.key].chartVar}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
                {segs.length === 0 && (
                  <circle cx={cx} cy={cy} r={pieR} fill="var(--muted)" stroke="var(--card)" strokeWidth={2} />
                )}
              </svg>
            </div>
            <div className="grid w-full grid-cols-5 gap-1">
              {freq.map((t) => (
                <div key={t.key} className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: TIER_META[t.key].chartVar }} />
                    {TIER_META[t.key].label}
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {t.count}
                    <span className="text-xs font-normal text-muted-foreground">
                      {' '}
                      {total > 0 ? ((t.count / total) * 100).toFixed(0) : 0}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const { skins } = useSkins();
  const { records } = useRecords();

  const countBySkin = new Map<string, number>();
  for (const r of records) {
    for (const id of r.skins) {
      countBySkin.set(id, (countBySkin.get(id) ?? 0) + 1);
    }
  }

  const totalAppearances = [...countBySkin.values()].reduce((a, b) => a + b, 0);

  const tierStats = TIER_KEYS.map((key) => {
    const pool = skins.filter((s) => s.tierKey === key);
    const seenIn = pool.filter((s) => countBySkin.has(s.id)).length;
    return {
      key,
      total: pool.length,
      seen: seenIn,
      pct: pool.length > 0 ? (seenIn / pool.length) * 100 : 0,
    };
  });

  // 武器覆盖：按具体武器（狂徒、幻影等）统计，按覆盖占比从高到低
  const weaponNames = orderWeapons([...new Set(skins.map((s) => s.weapon))]);
  const weaponStats = weaponNames
    .map((w) => {
      const pool = skins.filter((s) => s.weapon === w);
      const seenIn = pool.filter((s) => countBySkin.has(s.id)).length;
      return {
        weapon: w,
        total: pool.length,
        seen: seenIn,
        pct: pool.length > 0 ? (seenIn / pool.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct || b.seen - a.seen);

  const skinById = new Map(skins.map((s) => [s.id, s]));
  const tierRank = (key: TierKey | null) => (key ? TIER_KEYS.indexOf(key) : -1);
  // 出现 ≥2 次：先按出现次数降序，同次数按品质从高到低
  const ranked = [...countBySkin.entries()]
    .map(([id, count]) => ({ skin: skinById.get(id), count }))
    .filter((x): x is { skin: ISkin; count: number } => Boolean(x.skin) && x.count >= 2)
    .sort((a, b) => b.count - a.count || tierRank(b.skin.tierKey) - tierRank(a.skin.tierKey));
  const [minCount, setMinCount] = useState(2);
  const maxCount = ranked.length > 0 ? ranked[0].count : 2;
  const shown = ranked.filter((x) => x.count >= Math.min(minCount, maxCount));

  // 品质频率：近 14 天 + 全部天数
  const now = new Date();
  const days: { date: string; label: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ date: toISODate(d), label: `${d.getMonth() + 1}/${d.getDate()}` });
  }
  const daySet = new Set(days.map((d) => d.date));
  const freq14 = computeTierFreq(records, skinById, daySet);
  const freqAll = computeTierFreq(records, skinById);

  if (records.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Statistics
          </p>
          <h1 className="mt-1 border-l-2 border-primary pl-3 text-2xl font-bold tracking-tight">数据统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共记录 <span className="font-mono text-base font-medium text-foreground">{records.length}</span> 天，出现的皮肤一共{' '}
            <span className="font-mono text-base font-medium text-foreground">{totalAppearances}</span> 次。
          </p>
        </header>
        <Card>
          <CardContent>
            <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              还没有任何记录。先到「每日记录」保存一次商店皮肤，这里就会生成统计数据。
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Statistics
          </p>
          <h1 className="mt-1 border-l-2 border-primary pl-3 text-2xl font-bold tracking-tight">数据统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共记录 <span className="font-mono text-base font-medium text-foreground">{records.length}</span> 天，出现的皮肤一共{' '}
            <span className="font-mono text-base font-medium text-foreground">{totalAppearances}</span> 次。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="transition-colors hover:border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">按品质覆盖</CardTitle>
              <p className="text-xs text-muted-foreground">各品质皮肤的已见比例</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tierStats.map((t) => (
                <div key={t.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <TierBadge tierKey={t.key} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.seen}/{t.total} · {t.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${t.pct}%`, background: TIER_META[t.key].chartVar }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">按武器覆盖</CardTitle>
              <p className="text-xs text-muted-foreground">
                按覆盖占比从高到低 · 共 {weaponNames.length} 种
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md pr-2">
                <div className="space-y-2.5">
                  {weaponStats.map((c) => (
                    <div key={c.weapon} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm">{c.weapon}</span>
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${c.pct}%`, background: 'var(--primary)' }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {c.seen}/{c.total} · {c.pct.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
                <ScrollBar
                  orientation="vertical"
                  forceMount
                  className="w-[7px] border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="flex flex-col transition-colors hover:border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">出现最多的皮肤</CardTitle>
              <p className="text-xs text-muted-foreground">
                出现 ≥{minCount} 次的皮肤 · 按次数与品质排序
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {shown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  还没有出现 ≥{minCount} 次的皮肤，继续记录吧。
                </p>
              ) : (
                <>
                  <ScrollArea className="h-[188px] rounded-md pr-2">
                    <div className="space-y-2">
                      {shown.map(({ skin, count }, i) => (
                        <div
                          key={skin.id}
                          className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/50"
                        >
                          <span className="w-5 shrink-0 font-mono text-sm text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-base">{skin.name}</span>
                          {skin.tierKey ? <TierBadge tierKey={skin.tierKey} tierName={skin.tier} /> : null}
                          <span className="shrink-0 rounded-sm border border-foreground/30 bg-foreground/10 px-1.5 py-0.5 font-mono text-[13px] font-medium text-foreground">
                            ×{count}
                          </span>
                        </div>
                      ))}
                    </div>
                    <ScrollBar
                      orientation="vertical"
                      className="w-[7px] border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
                    />
                  </ScrollArea>
                  <div className="mt-8 flex items-center gap-3">
                    <Slider
                      value={[Math.min(minCount, maxCount)]}
                      min={2}
                      max={maxCount}
                      step={1}
                      onValueChange={(v) => setMinCount(v[0])}
                      className="flex-1"
                    />
                    <span className="w-20 shrink-0 text-right font-mono text-sm text-muted-foreground">
                      出现 ≥{Math.min(minCount, maxCount)} 次
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <TierFreqChart
            freq={freq14}
            title="近期品质频率"
            sub={`${Math.min(records.length, 14)} 天内的商店皮肤品质分布`}
          />
          <TierFreqChart
            freq={freqAll}
            title="总品质概率"
            sub={`${records.length} 天内的商店皮肤品质分布`}
          />
        </div>
    </div>
  );
}
