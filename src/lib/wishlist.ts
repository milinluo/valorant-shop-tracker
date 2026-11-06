const WISHLIST_KEY = 'skin-wishlist';

/** 读取心愿单（想要但还没抽到的皮肤 id 列表） */
export function getWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    // 忽略损坏的本地数据
  }
  return [];
}

/** 切换某个皮肤的许愿状态，返回切换后是否处于许愿中 */
export function toggleWish(id: string): boolean {
  const list = getWishlist();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  } catch {
    // 存储失败不影响本次会话
  }
  return next.includes(id);
}

/** 判断某个皮肤是否已在心愿单 */
export function isWished(id: string): boolean {
  return getWishlist().includes(id);
}
