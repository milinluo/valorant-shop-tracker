import { useState } from 'react';
import { Loader2, PenLine, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import DailyShopForm from './sections/DailyShopForm';
import HistoryList from './sections/HistoryList';
import WishHitEffect from '@/components/WishHitEffect';
import { useRecords } from '@/lib/records-context';
import { useSkins } from '@/lib/skins-context';
import { matchSkinByName } from '@/lib/skins';
import { getWishlist } from '@/lib/wishlist';

/** 生成自定义皮肤 id */
function makeCustomId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ShopData {
  auth?: boolean;
  date?: string;
  skins?: { name: string }[];
  error?: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 获取商店数据；net 表示是否因未连接而失败（可尝试自动启动） */
async function fetchShop(): Promise<{ ok: true; data: ShopData } | { ok: false; net: boolean; msg: string }> {
  try {
    const res = await fetch('http://localhost:4175/api/shop', { mode: 'cors' });
    if (!res.ok) return { ok: false, net: false, msg: `自动获取器响应异常（HTTP ${res.status}）` };
    const data = (await res.json()) as ShopData;
    if (!data.auth) {
      return { ok: false, net: false, msg: data.error || '自动获取器未登录，请重启「商店自动获取器」扫码登录' };
    }
    if (data.error) return { ok: false, net: false, msg: data.error };
    return { ok: true, data };
  } catch {
    return { ok: false, net: true, msg: '未连接自动获取器' };
  }
}

export default function RecordsPage() {
  const { upsertRecord } = useRecords();
  const { skins, addSkin } = useSkins();
  const [autoState, setAutoState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [autoMsg, setAutoMsg] = useState<string>('');
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const handleAutoFetch = async () => {
    setAutoState('loading');
    setAutoMsg('');
    // 1) 先探测：自动获取器已在运行则直接拉取，无需任何启动动作
    let r = await fetchShop();
    if (r.ok === false && r.net === true) {
      // 2) 未连接 → 在点击手势内立即唤起自定义协议启动自动获取器
      //    （自定义协议必须由用户点击直接触发，否则浏览器会拦截；
      //      浏览器会弹出「打开」确认窗口，点「打开」即自动启动，无需手动运行 cmd）
      try {
        window.location.href = 'valstarts://start';
      } catch {
        // 忽略唤起异常，继续轮询等待
      }
      setAutoMsg('正在启动自动获取器…若浏览器弹出「打开」确认窗口，请点击「打开」。');
      for (let i = 0; i < 25 && r.ok === false; i++) {
        if (r.net === false) break; // 服务已连通但未登录/报错，无需继续等待
        await sleep(2000);
        r = await fetchShop();
      }
    }
    if (r.ok === false) {
      setAutoMsg(
        r.net
          ? '自动获取器未能自动启动。请依次确认：① 浏览器弹出的「打开」确认窗口是否已点击「打开」；② 自动获取器目录下的「注册网页一键启动.cmd」是否运行过一次（注册一次永久生效）；③ 前两步都无效时，可双击「启动商店自动获取器.cmd」手动启动后再点此按钮。'
          : r.msg,
      );
      setAutoState('idle');
      return;
    }
    const data = r.data;
    if (data.error) {
      setAutoMsg(data.error);
      setAutoState('idle');
      return;
    }
    const names = (data.skins ?? []).map((s) => s.name);
    if (names.length === 0) {
      setAutoMsg('今日商店暂无数据');
      setAutoState('idle');
      return;
    }
    const ids: string[] = [];
    const unmatched: string[] = [];
    const newSkinIds: string[] = [];
    for (const n of names) {
      const hit = matchSkinByName(n, skins);
      if (hit) ids.push(hit.id);
      else {
        // 图鉴里没有的新皮肤：自动收录到图鉴，并记入当天商店
        unmatched.push(n);
        const id = makeCustomId();
        newSkinIds.push(id);
        addSkin({ id, name: n.trim(), weapon: '', category: 'Custom', tier: null, tierKey: null });
      }
    }
    if (ids.length + newSkinIds.length > 0) {
      upsertRecord(data.date ?? new Date().toISOString().slice(0, 10), [...ids, ...newSkinIds]);
      const wishSet = new Set(getWishlist());
      const hit = ids.find((id) => wishSet.has(id));
      if (hit) {
        const s = skins.find((x) => x.id === hit);
        setCelebrate(s?.name ?? '心愿皮肤');
      }
    }
    const parts = [`已自动记录 ${data.date ?? ''}：${names.join('、')}`];
    if (newSkinIds.length > 0) {
      toast.success(`已自动收录 ${newSkinIds.length} 款新皮肤到图鉴：${unmatched.join('、')}`);
      parts.push(`已自动收录新皮肤：${unmatched.join('、')}（可在管理皮肤中补充武器与品质）`);
    }
    setAutoMsg(parts.join('；'));
    setAutoState('done');
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Daily Shop</p>
            <h1 className="mt-1 border-l-2 border-primary pl-3 text-2xl font-bold tracking-tight">今日商店记录</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              每天把商店刷新的皮肤记下来，看看什么时候能等到想要的。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFetch}
              disabled={autoState === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
            >
              {autoState === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              自动获取今日商店
            </button>
            <button
              onClick={() => setManualOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <PenLine className="h-4 w-4" />
              手动输入
            </button>
          </div>
        </div>
      </header>
      <p className="text-sm text-muted-foreground">
        自动获取失效时，点击右上角「手动输入」按钮填写当日商店皮肤。
      </p>
      {autoMsg && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            autoState === 'done'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-muted/30 text-foreground'
          }`}
        >
          {autoMsg}
        </p>
      )}
      <DailyShopForm open={manualOpen} onOpenChange={setManualOpen} />
      <HistoryList />
      {celebrate && <WishHitEffect skinName={celebrate} onDone={() => setCelebrate(null)} />}
    </div>
  );
}
