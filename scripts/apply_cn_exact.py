# -*- coding: utf-8 -*-
"""写入已确认的国服例外价 + 剔除 VCT 限定遗漏皮肤"""
import json

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

CN_EXACT = {
    "双城之战 正义": 1740,
    "夜刃诡镰": 3780,
    "鬼丸国纲": 3780,
    "谐波音谱": 3780,
    "生物分子解离器": 3780,
    "离火刃": 3280,
    "双城之战 拳套": 3180,
    "双城之战 狂徒": 1590,
}
for s in skins:
    if s["name"] in CN_EXACT:
        s["vp"] = CN_EXACT[s["name"]]
        s["vpSrc"] = "cn-exact"
        print("价:", s["name"], s["vp"])

# 剔除 VCT 限定（季前邀请赛 = VCT LOCK//IN）
removed = []
for s in list(skins):
    n = s["name"]
    if ("季前邀请赛" in n) or ("VCT" in n) or ("冠军赛" in n) or ("无畏契约季前" in n):
        removed.append(n)
        skins.remove(s)
print("剔除 VCT/冠军赛:", len(removed))
for n in removed:
    print("  ", n)

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
print("剩余皮肤数:", len(skins))
