import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SkinsContext } from '@/lib/skins-context';
import type { ISkinsState } from '@/lib/skins-context';
import { loadSkins } from '@/lib/skins';
import type { ISkin } from '@/lib/skins';
import {
  loadCustomStore,
  saveCustomStore,
  mergeSkins,
  type ICustomSkinStore,
} from '@/lib/custom-skins';

export default function SkinsProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<ISkin[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [custom, setCustom] = useState<ICustomSkinStore>(() => loadCustomStore());

  useEffect(() => {
    let cancelled = false;
    loadSkins()
      .then((skins) => {
        if (cancelled) return;
        setBase(skins);
        setStatus('ready');
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setBase([]);
        setStatus('error');
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 用户自定义数据变更时持久化
  useEffect(() => {
    saveCustomStore(custom);
  }, [custom]);

  const skins = useMemo(() => mergeSkins(base, custom), [base, custom]);

  const addSkin = (skin: ISkin) => {
    setCustom((prev) => ({ ...prev, added: [...prev.added, skin] }));
  };

  const updateSkin = (id: string, patch: Partial<ISkin>) => {
    setCustom((prev) => {
      const isAdded = prev.added.some((s) => s.id === id);
      if (isAdded) {
        return {
          ...prev,
          added: prev.added.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        };
      }
      return { ...prev, edited: { ...prev.edited, [id]: { ...prev.edited[id], ...patch } } };
    });
  };

  const removeSkin = (id: string) => {
    setCustom((prev) => {
      const isAdded = prev.added.some((s) => s.id === id);
      if (isAdded) {
        return { ...prev, added: prev.added.filter((s) => s.id !== id) };
      }
      if (prev.removed.includes(id)) return prev;
      const target = base.find((s) => s.id === id);
      return {
        ...prev,
        removed: [...prev.removed, id],
        removedInfo: {
          ...prev.removedInfo,
          [id]: { name: target?.name ?? id, weapon: target?.weapon ?? '' },
        },
      };
    });
  };

  const restoreSkin = (id: string) => {
    setCustom((prev) => ({
      ...prev,
      removed: prev.removed.filter((x) => x !== id),
      edited: Object.fromEntries(Object.entries(prev.edited).filter(([k]) => k !== id)),
      removedInfo: Object.fromEntries(Object.entries(prev.removedInfo).filter(([k]) => k !== id)),
    }));
  };

  const state: ISkinsState = { skins, status, error, custom, addSkin, updateSkin, removeSkin, restoreSkin };

  return <SkinsContext.Provider value={state}>{children}</SkinsContext.Provider>;
}
