// EXPORTS: IRecord, loadRecords, saveRecords

export interface IRecord {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 皮肤 id 列表（当日商店刷新的皮肤） */
  skins: string[];
}

const NS = 'valorant-shop-tracker';
const KEY = 'records';

export function loadRecords(): IRecord[] {
  try {
    const raw = localStorage.getItem(`${NS}:${KEY}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: IRecord[]): void {
  try {
    localStorage.setItem(`${NS}:${KEY}`, JSON.stringify(records));
  } catch {
    /* 隐私模式 / 禁用站点数据时静默降级 */
  }
}
