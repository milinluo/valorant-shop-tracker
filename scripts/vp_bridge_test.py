# -*- coding: utf-8 -*-
"""验证：Dot Esports 皮肤英文名+武器 → valorant-api displayName 桥接匹配"""
import json
import re

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api_en = json.load(f)
with open(BASE + r"\scripts\valapi_weapons_zh.json", encoding="utf-8") as f:
    api_zh = json.load(f)

def norm(s):
    return re.sub(r"[\s_*'’/]+", "", s).lower()

# uuid -> 英文displayName / 中文displayName
en_by_uuid = {}
zh_by_uuid = {}
for w in api_en["data"]:
    for s in w.get("skins", []):
        en_by_uuid[s["uuid"]] = s.get("displayName", "")
for w in api_zh["data"]:
    for s in w.get("skins", []):
        zh_by_uuid[s["uuid"]] = s.get("displayName", "")

# 测试样例：Dot Esports (皮肤名, 武器英文名) -> 期望 VP
tests = [
    ("Araxys", "Vandal", 2175),
    ("Elderflame", "Vandal", 2475),
    ("Kuronami", "Vandal", 2375),
    ("Spectrum", "Phantom", 2675),
    ("Protocol 781-A", "Phantom", 2475),
    ("Radiant Entertainment System", "Phantom", 2975),
    ("Champions 2021", "Vandal", 2675),
    ("VALORANT GO! Vol. 2", "Vandal", 1775),
    ("Prime//2.0", "Phantom", 1775),
    ("Evori Dreamwings", "Vandal", 2475),
    ("Power Fist", "Melee", 5950),
    ("Araxys Bio-Atomizers", "Melee", 5350),
]

for skin, weapon, vp in tests:
    cand = norm(skin + " " + weapon)
    # 在 en_by_uuid 中找 norm(displayName) == cand
    found = None
    for uid, dn in en_by_uuid.items():
        if norm(dn) == cand:
            found = uid
            break
    if found:
        print(f"OK  {skin} {weapon}: API={en_by_uuid[found]} | 中文={zh_by_uuid.get(found)} | 期望VP={vp}")
    else:
        # 尝试宽松：武器名在尾部
        print(f"MISS {skin} {weapon} (期望VP={vp})")
