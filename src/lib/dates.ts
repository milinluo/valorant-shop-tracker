// EXPORTS: toISODate, formatDateCN, weekdayCN
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateCN(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function weekdayCN(iso: string): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[parseISODate(iso).getDay()];
}
