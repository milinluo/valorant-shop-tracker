# -*- coding: utf-8 -*-
import io
p = r'C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\src\pages\Stats\StatsPage.tsx'
s = io.open(p, encoding='utf-8').read()

# 1. 删除统计卡排
old_stat = '''      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="记录天数" value={String(records.length)} sub="每日商店刷新次数" />
        <StatCard label="皮肤总数" value={String(total)} sub={status === 'loading' ? '加载中…' : '武器皮肤数据库'} />
        <StatCard label="已见皮肤" value={String(seen)} sub={`出现 ${totalAppearances} 次`} />
        <StatCard label="皮肤覆盖率" value={`${coverage.toFixed(1)}%`} sub="已见 / 全部皮肤" />
      </div>

'''
assert old_stat in s, 'stat grid not found'
s = s.replace(old_stat, '')

# 2. 删除不再使用的变量定义
old_vars = '''  const total = skins.length;
  const seen = countBySkin.size;
  const coverage = total > 0 ? (seen / total) * 100 : 0;
  const totalAppearances = [...countBySkin.values()].reduce((a, b) => a + b, 0);
'''
assert old_vars in s, 'vars not found'
s = s.replace(old_vars, '''  const totalAppearances = [...countBySkin.values()].reduce((a, b) => a + b, 0);
''')

# 3. 出现最多说明文字
old_desc = '''            <p className="text-xs text-muted-foreground">
              出现 ≥2 次的皮肤 · 按次数与品质排序
            </p>'''
new_desc = '''            <p className="text-xs text-muted-foreground">
              出现 ≥{minCount} 次的皮肤 · 按次数与品质排序
            </p>'''
assert old_desc in s, 'desc not found'
s = s.replace(old_desc, new_desc)

# 4. top -> shown
s = s.replace('{top.length === 0 ? (', '{shown.length === 0 ? (')
s = s.replace('还没有出现 ≥2 次的皮肤，继续记录吧。', '还没有出现 ≥{minCount} 次的皮肤，继续记录吧。')
s = s.replace('{top.map(({ skin, count }, i) => (', '{shown.map(({ skin, count }, i) => (')

# 5. 出现最多皮肤名调大 + 徽章改色调大
old_row = '''                        <span className="min-w-0 flex-1 truncate text-sm">{skin.name}</span>
                        {skin.tierKey ? <TierBadge tierKey={skin.tierKey} tierName={skin.tier} /> : null}
                        <span className="shrink-0 rounded-sm bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          ×{count}
                        </span>'''
new_row = '''                        <span className="min-w-0 flex-1 truncate text-base">{skin.name}</span>
                        {skin.tierKey ? <TierBadge tierKey={skin.tierKey} tierName={skin.tier} /> : null}
                        <span className="shrink-0 rounded-sm border border-foreground/30 bg-foreground/10 px-1.5 py-0.5 text-[13px] font-semibold text-foreground">
                          ×{count}
                        </span>'''
assert old_row in s, 'row not found'
s = s.replace(old_row, new_row)

# 6. 滑动条按次数
old_slider = '''                  <Slider
                    value={[Math.min(topLimit, topMax)]}
                    min={2}
                    max={topMax}
                    step={1}
                    onValueChange={(v) => setTopLimit(v[0])}
                    className="flex-1"
                  />
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    前 {Math.min(topLimit, topMax)} 款
                  </span>'''
new_slider = '''                  <Slider
                    value={[Math.min(minCount, maxCount)]}
                    min={2}
                    max={maxCount}
                    step={1}
                    onValueChange={(v) => setMinCount(v[0])}
                    className="flex-1"
                  />
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    出现 ≥{Math.min(minCount, maxCount)} 次
                  </span>'''
assert old_slider in s, 'slider not found'
s = s.replace(old_slider, new_slider)

io.open(p, 'w', encoding='utf-8').write(s)
print('all replaced')
