# -*- coding: utf-8 -*-
"""按 OP.GG / ValKing 确认的例外价修正 skins.json"""
import json

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

# (皮肤全名, 确认VP) —— 来自 OP.GG / ValKing 页面
FIXES = {
    "创·纪元 狂徒": 2375,
    "圣契命澜 狂徒": 2375,
    "圣契命澜 追猎": 2375,
    "圣契命澜 飞将": 2375,
    "ORA x 颗秒 狂徒": 2475,
    "ORA x 颗秒 幻影": 2475,
    "ORA x 颗秒 正义": 2475,
    "ORA x 颗秒 冥驹": 2475,
    "ORA x 颗秒 军刀": 4950,
    "掠影//3.0 追猎": 1775,
}

n = 0
for s in skins:
    if s["name"] in FIXES:
        s["vp"] = FIXES[s["name"]]
        s["vpSrc"] = "exact"
        n += 1
        print("修正:", s["name"], s["vp"])

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
print("共修正", n, "款")
