import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TierBadge from '@/components/TierBadge';
import { useRecords } from '@/lib/records-context';
import { useSkins } from '@/lib/skins-context';
import { useSettings } from '@/lib/settings-context';
import { formatDateCN, weekdayCN } from '@/lib/dates';
import type { ISkin } from '@/lib/skins';
import type { IRecord } from '@/lib/records';

export default function HistoryList() {
  const { records, removeRecord } = useRecords();
  const { skins } = useSkins();
  const { seenCountMode } = useSettings();
  const [toDelete, setToDelete] = useState<IRecord | null>(null);

  const byId = new Map(skins.map((s) => [s.id, s]));
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));

  // 按日期从早到晚累计每个皮肤的已出现次数，得到"每个日期该皮肤是第几次刷到"
  const seenAt = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    const cum = new Map<string, number>();
    const asc = [...records].sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const rec of asc) {
      const perDate = new Map<string, number>();
      for (const id of rec.skins) {
        const n = (cum.get(id) ?? 0) + 1;
        cum.set(id, n);
        perDate.set(id, n);
      }
      map.set(rec.date, perDate);
    }
    return map;
  }, [records]);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            还没有记录，从上方选好今天的皮肤点击保存吧。
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-[17px]">
            历史记录
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              共 <span className="font-mono">{sorted.length}</span> 天
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[560px] rounded-md pr-3">
            <div className="space-y-2">
              {sorted.map((rec) => {
                const items = rec.skins
                  .map((id) => byId.get(id))
                  .filter((s): s is ISkin => Boolean(s));
                return (
                  <div
                    key={rec.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{formatDateCN(rec.date)}</span>
                        <span className="text-base text-muted-foreground">{weekdayCN(rec.date)}</span>
                        {rec.date === todayISO() && (
                          <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-sm font-semibold text-primary">
                            今天
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
                        {items.length > 0 ? (
                          items.map((s) => {
                            const n = seenCountMode !== 'off' ? seenAt.get(rec.date)?.get(s.id) : undefined;
                            const showBadge =
                              n !== undefined && (seenCountMode === 'all' || n === 1);
                            return (
                              <span
                                key={s.id}
                                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-base"
                              >
                                <span>{s.name}</span>
                                {s.tierKey ? <TierBadge tierKey={s.tierKey} tierName={s.tier} size="md" /> : null}
                                {showBadge ? (
                                  <span
                                    className={`rounded-sm px-1.5 py-0.5 text-xs font-medium ${
                                      n === 1
                                        ? 'border border-purple-500/40 bg-purple-500/15 text-purple-300'
                                        : 'border border-foreground/25 bg-foreground/10 text-muted-foreground'
                                    }`}
                                  >
                                    {n === 1 ? '首次' : <>第 <span className="font-mono">{n}</span> 次</>}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-base text-muted-foreground">无皮肤数据</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => setToDelete(rec)}
                      aria-label="删除记录"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <ScrollBar
              orientation="vertical"
              className="w-2.5 border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"
            />
          </ScrollArea>
        </CardContent>
      </Card>
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条记录？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，该日期的皮肤记录会被移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toDelete) return;
                removeRecord(toDelete.id);
                toast.success('记录已删除');
                setToDelete(null);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
