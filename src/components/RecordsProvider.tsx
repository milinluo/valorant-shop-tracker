import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RecordsContext } from '@/lib/records-context';
import { loadRecords, saveRecords } from '@/lib/records';
import type { IRecord } from '@/lib/records';
import { SKIN_DATA_BASE } from '@/lib/skins';

export default function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<IRecord[]>(() => loadRecords());
  const importedRef = useRef(false);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  // 首次打开且本地无记录时，尝试自动导入随应用分发的备份记录
  // （桌面版 data/records_import.json；线上无该文件时静默跳过）
  useEffect(() => {
    if (importedRef.current || loadRecords().length > 0) return;
    importedRef.current = true;
    let cancelled = false;
    fetch(`${SKIN_DATA_BASE}data/records_import.json`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((imported) => {
        if (cancelled || !Array.isArray(imported) || imported.length === 0) return;
        setRecords(imported);
      })
      .catch(() => {
        /* 文件不存在或网络失败时静默跳过 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertRecord = (date: string, skins: string[]) => {
    const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setRecords((prev) => [...prev.filter((r) => r.date !== date), { id, date, skins }]);
  };

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const importRecords = (imported: IRecord[]) => {
    setRecords((prev) => {
      const byDate = new Map<string, IRecord>();
      for (const r of prev) byDate.set(r.date, r);
      for (const r of imported) byDate.set(r.date, r);
      return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    });
  };

  const clearRecords = () => setRecords([]);

  return (
    <RecordsContext.Provider value={{ records, upsertRecord, removeRecord, importRecords, clearRecords }}>
      {children}
    </RecordsContext.Provider>
  );
}
