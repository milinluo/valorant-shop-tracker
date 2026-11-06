// EXPORTS: IRecordsApi, RecordsContext, useRecords
import { createContext, useContext } from 'react';
import type { IRecord } from '@/lib/records';

export interface IRecordsApi {
  records: IRecord[];
  /** 同一天只保留一条记录：已有该日期记录时覆盖 */
  upsertRecord: (date: string, skins: string[]) => void;
  removeRecord: (id: string) => void;
  /** 用外部数据整体替换记录（导入备份用；会按日期去重，同日期保留后导入的） */
  importRecords: (records: IRecord[]) => void;
  /** 清空全部记录（谨慎操作，调用方需二次确认） */
  clearRecords: () => void;
}

export const RecordsContext = createContext<IRecordsApi>({
  records: [],
  upsertRecord: () => {},
  removeRecord: () => {},
  importRecords: () => {},
  clearRecords: () => {},
});

export function useRecords(): IRecordsApi {
  return useContext(RecordsContext);
}
