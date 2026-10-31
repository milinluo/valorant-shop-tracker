# -*- coding: utf-8 -*-
"""全面审计：当前 vp 与 tierKey 档位标准国服价不一致的皮肤（应为公告例外）"""
import json

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
CN_GUN = {"select": 590, "deluxe": 890, "premium": 1290, "exclusive": 1590, "ultra": 1790}
CN_MELEE = {k: v * 2 for k, v in CN_GUN.items()}

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

print("== 与品质档标准国服价不一致（例外，应有公告来源） ==")
n_ex = 0
for s in skins:
    std = CN_MELEE if s["weapon"] == "近战武器" else CN_GUN
    base = std[s["tierKey"]]
    if s["vp"] != base:
        n_ex += 1
        print(f"  {s['name']} | {s['tierKey']} 标准={base} 实际={s['vp']} src={s.get('vpSrc')}")
print(f"例外总数: {n_ex}")

# 品质分布
from collections import Counter
print("\n== 品质分布 ==")
for w, group in [("枪械", [s for s in skins if s["weapon"] != "近战武器"]),
                 ("近战", [s for s in skins if s["weapon"] == "近战武器"])]:
    print(w, dict(Counter(s["tierKey"] for s in group)))
print("总数:", len(skins))
