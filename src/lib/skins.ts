// EXPORTS: TierKey, ISkin, TIER_KEYS, TIER_META, CATEGORY_LABELS, SKIN_DATA_BASE, loadSkins

export type TierKey = 'select' | 'deluxe' | 'premium' | 'exclusive' | 'ultra' | null;

export interface ISkin {
  id: string;
  name: string;
  weapon: string;
  /** API 分类码：Sidearm / SMG / Shotgun / Rifle / Sniper / Heavy / Melee */
  category: string;
  /** 品质中文名（来自游戏数据） */
  tier: string | null;
  tierKey: TierKey;
  /** VP 价格（官方定价规则：精选875/奢华1275/卓越1775/终极2175/传奇2475，近战翻倍） */
  vp?: number;
  /** 所属系列（主题），如 塑水宗 / 光明哨兵；无法归属的为「其他」 */
  collection?: string;
}

export const TIER_KEYS = ['select', 'deluxe', 'premium', 'exclusive', 'ultra'] as const;

export const TIER_META: Record<string, { label: string; chartVar: string }> = {
  select: { label: '精选', chartVar: 'var(--chart-1)' },
  deluxe: { label: '奢华', chartVar: 'var(--chart-2)' },
  premium: { label: '卓越', chartVar: 'var(--chart-3)' },
  exclusive: { label: '终极', chartVar: 'var(--chart-4)' },
  ultra: { label: '传奇', chartVar: 'var(--chart-5)' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  Sidearm: '随身武器',
  SMG: '微型冲锋枪',
  Shotgun: '器弹枪',
  Rifle: '步枪',
  Sniper: '狙击枪',
  Heavy: '重型武器',
  Melee: '近战武器',
};

/** 武器展示顺序：按游戏内官方分类排列（佩枪→冲锋→器弹→步枪→狙击→重武器→近战） */
export const WEAPON_ORDER = [
  '标配', '短炮', '狂怒', '鬼魅', '正义', '追猎',
  '蜂刺', '骱灵',
  '雄鹿', '判官',
  '獗犬', '狂徒', '戍卫', '幻影', '悍狼',
  '飞将', '萨侠', '冥騟',
  '战神', '奥丁',
  '近战武器',
];

/** 按游戏内官方顺序排序武器名列表 */
export function orderWeapons(names: string[]): string[] {
  const idx = new Map(WEAPON_ORDER.map((w, i) => [w, i]));
  return [...names].sort((a, b) => {
    const ia = idx.get(a) ?? 999;
    const ib = idx.get(b) ?? 999;
    return ia - ib || a.localeCompare(b, 'zh');
  });
}

export const SKIN_DATA_BASE =
  (import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '') + '/';

export async function loadSkins(): Promise<ISkin[]> {
  // 双击 HTML 直接打开时（file://），皮肤数据由 data/skins-data.js 注入全局变量
  const w = window as unknown as { __SKINS__?: ISkin[] };
  if (w.__SKINS__ && Array.isArray(w.__SKINS__) && w.__SKINS__.length > 0) {
    return w.__SKINS__;
  }
  const res = await fetch(`${SKIN_DATA_BASE}data/skins.json`);
  if (!res.ok) throw new Error(`皮肤数据加载失败（${res.status}）`);
  return (await res.json()) as ISkin[];
}

/** 宽松匹配：商店接口返回的皮肤名 → 图鉴皮肤。依次尝试精确、去空格、包含。 */
export function matchSkinByName(name: string, skins: ISkin[]): ISkin | null {
  const n = name.trim();
  const exact = skins.find((s) => s.name === n);
  if (exact) return exact;
  const compact = (x: string) => x.replace(/\s+/g, '');
  const cn = compact(n);
  const compactHit = skins.find((s) => compact(s.name) === cn);
  if (compactHit) return compactHit;
  const contains = skins.find(
    (s) => s.name.includes(n) || n.includes(s.name) || compact(s.name).includes(cn) || cn.includes(compact(s.name)),
  );
  if (contains) return contains;
  return null;
}
