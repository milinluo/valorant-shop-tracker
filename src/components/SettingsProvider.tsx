import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SettingsContext, DEFAULT_SETTINGS, THEME_COLORS } from '@/lib/settings-context';
import type { ISettings, SidebarStatKey, ThemeColor } from '@/lib/settings-context';

const STORAGE_KEY = 'app-settings';

function loadSidebarStats(raw: unknown): ISettings['sidebarStats'] {
  const out: ISettings['sidebarStats'] = { ...DEFAULT_SETTINGS.sidebarStats };
  if (!raw || typeof raw !== 'object') return out;
  const obj = raw as Record<string, unknown>;
  (Object.keys(out) as SidebarStatKey[]).forEach((key) => {
    if (typeof obj[key] === 'boolean') out[key] = obj[key];
  });
  return out;
}

function loadSettings(): ISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ISettings> & { showSeenCount?: boolean };
    let seenCountMode: ISettings['seenCountMode'] = DEFAULT_SETTINGS.seenCountMode;
    // 兼容旧版本存储的 showSeenCount 布尔值
    if (typeof parsed.showSeenCount === 'boolean') {
      seenCountMode = parsed.showSeenCount ? 'all' : 'off';
    } else if (parsed.seenCountMode === 'all' || parsed.seenCountMode === 'first' || parsed.seenCountMode === 'off') {
      seenCountMode = parsed.seenCountMode;
    }
    return {
      themeColor:
        parsed.themeColor && parsed.themeColor in THEME_COLORS
          ? (parsed.themeColor as ThemeColor)
          : DEFAULT_SETTINGS.themeColor,
      skinGridCols:
        parsed.skinGridCols === 6 || parsed.skinGridCols === 8 ? parsed.skinGridCols : DEFAULT_SETTINGS.skinGridCols,
      statsChartMode: parsed.statsChartMode === 'pie' ? 'pie' : 'bar',
      seenCountMode,
      sidebarStats: loadSidebarStats(parsed.sidebarStats),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ISettings>(() => loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* 存储不可用时静默忽略 */
    }
  }, [settings]);

  // 应用主题色：覆盖 --primary / --ring，其余派生色（边框、sidebar、info）自动联动
  useEffect(() => {
    const color = THEME_COLORS[settings.themeColor].primary;
    const root = document.documentElement;
    root.style.setProperty('--primary', color);
    root.style.setProperty('--ring', color);
  }, [settings.themeColor]);

  const updateSettings = (patch: Partial<ISettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
