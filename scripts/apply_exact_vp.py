# -*- coding: utf-8 -*-
"""用 Dot Esports 逐款单买价 + 品质规则兜底，为 704 款皮肤赋 VP"""
import json
import re
import sys

sys.path.insert(0, r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts")
from vp_prices_data import PRICES

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

def norm(s):
    s = s.replace("Ø", "o").replace("ø", "o")
    return re.sub(r"[\s_*'’&/.·•\-]+", "", s).lower()

# 建 norm 索引
price_index = {}  # norm(皮肤名+武器名) -> vp  枪械
melee_index = {}  # norm(皮肤名) -> vp         近战
for weapon, skins in PRICES.items():
    if weapon == "Melee":
        for skin, vp in skins.items():
            melee_index[norm(skin)] = vp
    else:
        for skin, vp in skins.items():
            price_index[norm(skin + " " + weapon)] = vp

# 读 API 英文数据：uuid -> (weapon_en, skin_display)
with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api_en = json.load(f)
uuid_weapon = {}
uuid_skin = {}
for w in api_en["data"]:
    wn = w["displayName"]
    for s in w.get("skins", []):
        uuid_weapon[s["uuid"]] = wn
        uuid_skin[s["uuid"]] = s.get("displayName", "")

# 兜底规则
GUN_VP = {"select": 875, "deluxe": 1275, "premium": 1775, "exclusive": 2175, "ultra": 2475}
MELEE_VP = {k: v * 2 for k, v in GUN_VP.items()}

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

exact = 0
fallback = []
for s in skins:
    uid = s["id"]
    sk = uuid_skin.get(uid, "")
    wp = uuid_weapon.get(uid, "")
    vp = None
    if wp == "Melee":
        vp = melee_index.get(norm(sk))
    else:
        vp = price_index.get(norm(sk))
    if vp is not None:
        s["vp"] = vp
        s["vpSrc"] = "exact"
        exact += 1
    else:
        # 规则兜底
        tier = s["tierKey"]
        vp2 = MELEE_VP.get(tier) if s["weapon"] == "近战武器" else GUN_VP.get(tier)
        if vp2 is None:
            fallback.append((s["name"], "品质未知"))
            continue
        s["vp"] = vp2
        s["vpSrc"] = "rule"
        fallback.append((s["name"], f"品质规则:{vp2}"))

print("精确匹配(单买价):", exact)
print("规则兜底:", len(fallback))
print("--- 规则兜底清单 ---")
for name, note in fallback:
    print(" ", name, "->", note)

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
print("已写回。样例：")
for s in skins[:4]:
    print(" ", s["name"], s.get("vp"), s.get("vpSrc"))
