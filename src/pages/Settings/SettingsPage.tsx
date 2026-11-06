import { useRef } from 'react';
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettings, SIDEBAR_STAT_LABELS, THEME_COLORS } from '@/lib/settings-context';
import { useRecords } from '@/lib/records-context';
import type { StatsChartMode, SeenCountMode, SidebarStatKey, ThemeColor, SkinGridCols } from '@/lib/settings-context';
import type { IRecord } from '@/lib/records';

export default function SettingsPage({ embedded = false }: { embedded?: boolean }) {
  const { themeColor, skinGridCols, statsChartMode, seenCountMode, sidebarStats, updateSettings } = useSettings();
  const { records, importRecords, clearRecords } = useRecords();
  const fileRef = useRef<HTMLInputElement>(null);

  const setMode = (m: StatsChartMode) => updateSettings({ statsChartMode: m });
  const setSeenMode = (m: SeenCountMode) => updateSettings({ seenCountMode: m });
  const toggleSidebarStat = (key: SidebarStatKey, on: boolean) =>
    updateSettings({ sidebarStats: { ...sidebarStats, [key]: on } });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `无畏契约商店记录备份-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as unknown;
        if (!Array.isArray(data)) throw new Error('文件格式不正确');
        const clean = data.filter(
          (x): x is IRecord =>
            !!x &&
            typeof x === 'object' &&
            typeof (x as IRecord).date === 'string' &&
            Array.isArray((x as IRecord).skins),
        );
        importRecords(clean);
        toast.success(`导入成功：共 ${clean.length} 条记录`);
      } catch {
        toast.error('导入失败：请选择有效的记录备份文件（JSON）');
      }
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={
        embedded
          ? 'mx-auto flex w-full max-w-2xl flex-col gap-6'
          : 'mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4'
      }
    >
      {!embedded && (
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Settings</p>
          <h1 className="mt-1 border-l-2 border-primary pl-3 text-2xl font-bold tracking-tight">设置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            自定义应用的显示选项，设置会自动保存在浏览器本地。
          </p>
        </header>
      )}
      <Card className="transition-colors hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">显示选项</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 主题颜色 */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-base font-medium">主题颜色</div>
              <p className="mt-0.5 text-sm text-muted-foreground">更改应用主色调，设置会自动保存</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(Object.keys(THEME_COLORS) as ThemeColor[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  title={THEME_COLORS[key].label}
                  aria-label={`主题色：${THEME_COLORS[key].label}`}
                  onClick={() => updateSettings({ themeColor: key })}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: THEME_COLORS[key].primary,
                    boxShadow:
                      themeColor === key
                        ? '0 0 0 2px var(--background), 0 0 0 4px var(--primary)'
                        : '0 0 0 1px rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 统计图表模式：柱状图 / 饼图 */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <div className="min-w-0">
              <div className="text-base font-medium">品质概率图表</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                数据统计中「近期品质频率」与「总品质概率」的展示方式
              </p>
            </div>
            <div className="flex shrink-0 items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('bar')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  statsChartMode === 'bar'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                柱状图
              </button>
              <button
                type="button"
                onClick={() => setMode('pie')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  statsChartMode === 'pie'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                饼图
              </button>
            </div>
          </div>

          {/* 每日记录显示刷到次数 */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <div className="min-w-0">
              <div className="text-base font-medium">显示刷到次数</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                在每日记录的历史里显示每个皮肤刷到的次数
              </p>
            </div>
            <div className="flex shrink-0 items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              {(
                [
                  { key: 'off', label: '关闭' },
                  { key: 'all', label: '全部显示' },
                  { key: 'first', label: '只显示第一次' },
                ] as { key: SeenCountMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSeenMode(opt.key)}
                  className={`rounded px-2.5 py-1 font-medium transition-colors ${
                    seenCountMode === opt.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 图鉴武器网格列数 */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <div className="min-w-0">
              <div className="text-base font-medium">图鉴网格列数</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                皮肤图鉴首页武器网格每行显示的卡片数量
              </p>
            </div>
            <div className="flex shrink-0 items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              {([6, 7, 8] as SkinGridCols[]).map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => updateSettings({ skinGridCols: cols })}
                  className={`rounded px-2.5 py-1 font-medium transition-colors ${
                    skinGridCols === cols
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cols} 列
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">商店概况</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            选择侧边栏「商店概况」中展示的统计项；全部关闭后商店概况将整体隐藏。
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {(Object.keys(SIDEBAR_STAT_LABELS) as SidebarStatKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{SIDEBAR_STAT_LABELS[key]}</span>
                <Switch
                  checked={sidebarStats[key]}
                  onCheckedChange={(v) => toggleSidebarStat(key, v)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">数据管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Download className="h-4 w-4" />
              导出记录
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Upload className="h-4 w-4" />
              导入记录
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }}
            />
            <p className="text-sm text-muted-foreground">
              将全部记录导出为 JSON 备份文件，可随时导入恢复。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-destructive/40 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  清空全部记录
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定清空全部记录？</AlertDialogTitle>
                  <AlertDialogDescription>
                    将删除全部 {records.length} 条每日记录（皮肤图鉴的已见统计也会随之清空），
                    此操作不可撤销。建议先导出备份。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      clearRecords();
                      toast.success('已清空全部记录');
                    }}
                  >
                    清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary">
                  <RotateCcw className="h-4 w-4" />
                  恢复图鉴武器默认顺序
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>恢复图鉴武器默认顺序？</AlertDialogTitle>
                  <AlertDialogDescription>
                    将撤销你在皮肤图鉴中对武器卡片的拖拽排序，恢复为游戏内默认顺序。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // 与 SkinsPage 的 WEAPON_ORDER_KEY 保持一致
                      localStorage.removeItem('skin-weapon-order');
                      toast.success('已恢复图鉴武器默认顺序，打开图鉴页即可看到效果');
                    }}
                  >
                    恢复
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
