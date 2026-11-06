// EXPORTS: ICustomSkinStore, emptyCustomStore, loadCustomStore, saveCustomStore
import type { ISkin } from '@/lib/skins';

/**
 * 用户自定义皮肤数据（持久化在 localStorage）：
 * - added：用户新增的皮肤
 * - edited：对已有皮肤字段的覆盖（id → 需要修改的字段）
 * - removed：被用户删除的内置皮肤 id
 */
export interface ICustomSkinStore {
  added: ISkin[];
  edited: Record<string, Partial<ISkin>>;
  removed: string[];
  /** 被删除皮肤的快照（id → 名称/武器），用于「已删除」列表展示与恢复提示 */
  removedInfo: Record<string, { name: string; weapon: string }>;
}

const NS = 'valorant-shop-tracker';
const KEY = 'customSkins';

export function emptyCustomStore(): ICustomSkinStore {
  return { added: [], edited: {}, removed: [], removedInfo: {} };
}

export function loadCustomStore(): ICustomSkinStore {
  try {
    const raw = localStorage.getItem(`${NS}:${KEY}`);
    if (!raw) return emptyCustomStore();
    const parsed = JSON.parse(raw) as ICustomSkinStore;
    return {
      added: Array.isArray(parsed.added) ? parsed.added : [],
      edited: parsed.edited && typeof parsed.edited === 'object' ? parsed.edited : {},
      removed: Array.isArray(parsed.removed) ? parsed.removed : [],
      removedInfo:
        parsed.removedInfo && typeof parsed.removedInfo === 'object' ? parsed.removedInfo : {},
    };
  } catch {
    return emptyCustomStore();
  }
}

export function saveCustomStore(store: ICustomSkinStore): void {
  try {
    localStorage.setItem(`${NS}:${KEY}`, JSON.stringify(store));
  } catch {
    /* 隐私模式 / 禁用站点数据时静默降级 */
  }
}

/** 内置皮肤与用户自定义合并后的最终皮肤列表 */
export function mergeSkins(base: ISkin[], store: ICustomSkinStore): ISkin[] {
  const removedSet = new Set(store.removed);
  const merged = base
    .filter((s) => !removedSet.has(s.id))
    .map((s) => (store.edited[s.id] ? { ...s, ...store.edited[s.id] } : s));
  return [...merged, ...store.added];
}
