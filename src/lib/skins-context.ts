// EXPORTS: ISkinsState, SkinsContext, useSkins
import { createContext, useContext } from 'react';
import type { ISkin } from '@/lib/skins';
import type { ICustomSkinStore } from '@/lib/custom-skins';

export interface ISkinsState {
  skins: ISkin[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  /** 用户自定义皮肤数据（新增/修改/删除标记） */
  custom: ICustomSkinStore;
  /** 新增一款皮肤 */
  addSkin: (skin: ISkin) => void;
  /** 修改一款皮肤（内置或自定义均可） */
  updateSkin: (id: string, patch: Partial<ISkin>) => void;
  /** 删除一款皮肤（内置皮肤记录删除标记；自定义皮肤直接移除） */
  removeSkin: (id: string) => void;
  /** 撤销删除：恢复被删除的内置皮肤 */
  restoreSkin: (id: string) => void;
}

export const SkinsContext = createContext<ISkinsState>({
  skins: [],
  status: 'loading',
  error: null,
  custom: { added: [], edited: {}, removed: [], removedInfo: {} },
  addSkin: () => {},
  updateSkin: () => {},
  removeSkin: () => {},
  restoreSkin: () => {},
});

export function useSkins(): ISkinsState {
  return useContext(SkinsContext);
}
