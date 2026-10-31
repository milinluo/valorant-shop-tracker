import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Library, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import SkinsProvider from '@/components/SkinsProvider';
import RecordsProvider from '@/components/RecordsProvider';
import { useSkins } from '@/lib/skins-context';
import { useRecords } from '@/lib/records-context';
import { formatDateCN } from '@/lib/dates';

const NAV_ITEMS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/', label: '每日记录', icon: ShoppingBag },
  { path: '/skins', label: '皮肤图鉴', icon: Library },
  { path: '/stats', label: '数据统计', icon: BarChart3 },
];

/** 连续记录统计：当前连续天数、最长连续天数、最近记录日期 */
function computeStreak(dates: string[]): { current: number; longest: number; lastDate: string | null } {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return { current: 0, longest: 0, lastDate: null };
  const dayNum = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  const nums = sorted.map(dayNum);
  let current = 1;
  for (let i = nums.length - 2; i >= 0; i--) {
    if (nums[i + 1] - nums[i] === 1) current += 1;
    else break;
  }
  let longest = 1;
  let run = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] - nums[i - 1] === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  return { current, longest, lastDate: sorted[sorted.length - 1] };
}

function SidebarStats() {
  const { skins } = useSkins();
  const { records } = useRecords();
  const seenSet = new Set<string>();
  let appearances = 0;
  for (const r of records) {
    for (const id of r.skins) {
      seenSet.add(id);
      appearances += 1;
    }
  }
  const coverage = skins.length > 0 ? (seenSet.size / skins.length) * 100 : 0;
  const streak = computeStreak(records.map((r) => r.date));
  const items = [
    { label: '记录天数', value: `${records.length} 天` },
    { label: '当前连续', value: `${streak.current} 天` },
    { label: '最长连续', value: `${streak.longest} 天` },
    { label: '最近记录', value: streak.lastDate ? formatDateCN(streak.lastDate) : '—' },
    { label: '皮肤总数', value: String(skins.length) },
    { label: '已见皮肤', value: String(seenSet.size) },
    { label: '皮肤覆盖率', value: `${coverage.toFixed(1)}%` },
  ];
  return (
    <SidebarGroup>
      <SidebarGroupLabel>商店概况</SidebarGroupLabel>
      <div className="space-y-1.5 px-2">
        {items.map((x) => (
          <div
            key={x.label}
            className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2.5 py-2 transition-colors hover:border-primary/30"
          >
            <span className="text-sm text-muted-foreground">{x.label}</span>
            <span className="text-lg font-bold tabular-nums">{x.value}</span>
          </div>
        ))}
      </div>
    </SidebarGroup>
  );
}

function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3.5 px-2.5 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-base font-black text-primary-foreground">
            V
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-lg font-bold">无畏契约 · 每日商店</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Daily Shop Tracker
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>记录工具</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                    <NavLink to={item.path} end={item.path === '/'}>
                      <Icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarStats />
      </SidebarContent>
    </Sidebar>
  );
}

export function Layout() {
  return (
    <SkinsProvider>
      <RecordsProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </RecordsProvider>
    </SkinsProvider>
  );
}
