// EXPORTS: StatsChartMode, ISettings, ISettingsApi, DEFAULT_SETTINGS, SettingsContext, useSettings
import { createContext, useContext } from 'react';

export type StatsChartMode = 'bar' | 'pie';

/** 每日记录历史中刷到次数的显示方式 */
export type SeenCountMode = 'off' | 'all' | 'first';

/** 应用主题色 */
export type ThemeColor = 'red' | 'blue' | 'green' | 'purple' | 'gold';

/** 图鉴武器网格列数 */
export type SkinGridCols = 6 | 7 | 8;

/** 主题色预设：primary 为 HSL 色值，前景色统一用深色（深色背景 + 高亮主色） */
export const THEME_COLORS: Record<ThemeColor, { label: string; primary: string }> = {
  red: { label: '瓦红', primary: 'hsl(354 100% 64%)' },
  blue: { label: '战术蓝', primary: 'hsl(217 91% 60%)' },
  green: { label: '翡翠绿', primary: 'hsl(152 60% 45%)' },
  purple: { label: '暗紫', primary: 'hsl(262 83% 60%)' },
  gold: { label: '琥珀金', primary: 'hsl(38 92% 55%)' },
};

/** 侧边栏「商店概况」可展示的统计项 */
export type SidebarStatKey =
  | 'recordDays'
  | 'currentStreak'
  | 'longestStreak'
  | 'lastRecord'
  | 'skinTotal'
  | 'seenSkins'
  | 'coverage';

export interface ISettings {
  /** 应用主题色 */
  themeColor: ThemeColor;
  /** 图鉴武器网格列数 */
  skinGridCols: SkinGridCols;
  /** 数据统计中「近期品质频率 / 总品质概率」的图表展示方式 */
  statsChartMode: StatsChartMode;
  /** 每日记录的历史中显示皮肤刷到次数：off=不显示 / all=全部显示 / first=只显示第一次 */
  seenCountMode: SeenCountMode;
  /** 商店概况中展示哪些统计项；全部为 false 时商店概况整体隐藏 */
  sidebarStats: Record<SidebarStatKey, boolean>;
}

export interface ISettingsApi extends ISettings {
  updateSettings: (patch: Partial<ISettings>) => void;
}

export const SIDEBAR_STAT_LABELS: Record<SidebarStatKey, string> = {
  recordDays: '记录天数',
  currentStreak: '当前连续',
  longestStreak: '最长连续',
  lastRecord: '最近记录',
  skinTotal: '皮肤总数',
  seenSkins: '已见皮肤',
  coverage: '皮肤覆盖率',
};

export const DEFAULT_SETTINGS: ISettings = {
  themeColor: 'red',
  skinGridCols: 7,
  statsChartMode: 'bar',
  seenCountMode: 'all',
  sidebarStats: {
    recordDays: true,
    currentStreak: true,
    longestStreak: true,
    lastRecord: true,
    skinTotal: true,
    seenSkins: true,
    coverage: true,
  },
};

export const SettingsContext = createContext<ISettingsApi>({
  ...DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function useSettings(): ISettingsApi {
  return useContext(SettingsContext);
}
