# -*- coding: utf-8 -*-
"""按品质规则为皮肤附加 VP 价格：精选875/奢华1275/卓越1775/终极2175/传奇2475，近战翻倍"""
import json
import collections

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

# 非近战标准价
GUN_VP = {
    "select": 875,
    "deluxe": 1275,
    "premium": 1775,
    "exclusive": 2175,
    "ultra": 2475,
}
MELEE_VP = {k: v * 2 for k, v in GUN_VP.items()}

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

stats = collections.Counter()
for s in skins:
    tier = s["tierKey"]
    if s["weapon"] == "近战武器":
        vp = MELEE_VP.get(tier)
    else:
        vp = GUN_VP.get(tier)
    if vp is None:
        stats["未知品质:" + str(tier)] += 1
        continue
    s["vp"] = vp
    stats[tier + ("/近战" if s["weapon"] == "近战武器" else "")] += 1

print("各品质数量:", dict(stats))
print("总皮肤数:", len(skins), "| 含vp:", sum(1 for s in skins if "vp" in s))

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)

# 打印几个样例
for s in skins[:5]:
    print(s["name"], "->", s.get("vp"))
