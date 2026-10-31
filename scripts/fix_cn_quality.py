# -*- coding: utf-8 -*-
"""修正品质与国服价：
1. 枪械例外已确认国服价（塑水宗1690/电音1890/源能者2090）
2. 近战：按国际服实价反推品质档，修正 tierKey（图鉴品质徽章）+ 赋国服价
3. 例外近战（DOT 5350/4710/5440/5950 等）标记待搜索
"""
import json
import re
import sys

sys.path.insert(0, r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts")
from vp_prices_data import PRICES

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

def norm(s):
    s = s.replace("Ø", "o").replace("ø", "o")
    return re.sub(r"[\s_*'’&/.·•\-]+", "", s).lower()

# 国服点券
CN_GUN = {"select": 590, "deluxe": 890, "premium": 1290, "exclusive": 1590, "ultra": 1790}
CN_MELEE = {k: v * 2 for k, v in CN_GUN.items()}
# 国际服标准档
GUN = {"select": 875, "deluxe": 1275, "premium": 1775, "exclusive": 2175, "ultra": 2475}
MELEE = {k: v * 2 for k, v in GUN.items()}
# 国际服价 -> 档位（近战）
MELEE_TIER = {1750: "select", 2550: "deluxe", 3550: "premium", 4350: "exclusive", 4950: "ultra"}

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)
with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api_en = json.load(f)

us = {}; uw = {}
for w in api_en["data"]:
    for s in w.get("skins", []):
        us[s["uuid"]] = s.get("displayName", "")
        uw[s["uuid"]] = w["displayName"]

# 已确认国服例外（枪械 + 近战）
CN_EXACT = {
    "塑水宗 狂徒": 1690, "塑水宗 正义": 1690, "塑水宗 骇灵": 1690, "塑水宗 飞将": 1690,
    "塑水宗 幻影": 1690, "塑水宗 冥驹": 1690, "塑水宗 戍卫": 1690, "塑水宗 鬼魅": 1690,
    "塑水宗//2.0 幻影": 1690, "塑水宗//2.0 冥驹": 1690, "塑水宗//2.0 戍卫": 1690, "塑水宗//2.0 鬼魅": 1690,
    "圣契命澜 狂徒": 1690, "圣契命澜 戍卫": 1690, "圣契命澜 飞将": 1690, "圣契命澜 追猎": 1690,
    "电音光谱 幻影": 1890, "电音光谱 獠犬": 1890, "电音光谱 戍卫": 1890, "电音光谱 标配": 1890,
    "电音光谱 判官": 1890, "电音光谱 狂徒": 1890, "电音光谱 正义": 1890, "电音光谱 骇灵": 1890,
    "源能者娱乐系统 幻影": 2090, "源能者娱乐系统 冥驹": 2090, "源能者娱乐系统 鬼魅": 2090, "源能者娱乐系统 獠犬": 2090,
    "源能者娱乐系统 狂徒": 2090, "源能者娱乐系统 奥丁": 2090, "源能者娱乐系统 判官": 2090, "源能者娱乐系统 正义": 2090,
    "源能者娱乐系统 骇灵": 2090, "源能者娱乐系统 飞将": 2090, "源能者娱乐系统 标配": 2090,
    "泷吟": 3780, "命轮": 3780, "影蝶": 3780, "黑波之刃": 3780, "街机高手": 4180,
}

# 需要进一步确认的例外（搜索国服公告）
NEED_CONFIRM = set()

fixed = 0
for s in skins:
    name = s["name"]
    if name in CN_EXACT:
        s["vp"] = CN_EXACT[name]
        s["vpSrc"] = "cn-exact"
        continue
    sk = us.get(s["id"], "")
    wp = uw.get(s["id"], "")
    # 找 DOT 国际服价
    dot = None
    if wp == "Melee":
        for sn, v in PRICES["Melee"].items():
            if norm(sn) == norm(sk):
                dot = v
                break
    else:
        for wn, sm in PRICES.items():
            if wn == "Melee":
                continue
            for sn, v in sm.items():
                if norm(sn + " " + wn) == norm(sk):
                    dot = v
                    break
            if dot:
                break
    if dot is None:
        # DOT 表外（2025+ 新皮肤），按现有品质档国服标准价
        base = CN_MELEE if s["weapon"] == "近战武器" else CN_GUN
        s["vp"] = base[s["tierKey"]]
        s["vpSrc"] = "cn-rule"
        continue
    if wp == "Melee":
        if dot in MELEE_TIER:
            tier = MELEE_TIER[dot]
            if s["tierKey"] != tier:
                s["tierKey"] = tier
                s["tier"] = {"select": "精选", "deluxe": "奢华", "premium": "卓越", "exclusive": "终极", "ultra": "传奇"}[tier]
            s["vp"] = CN_MELEE[tier]
            s["vpSrc"] = "cn-rule"
            fixed += 1
        else:
            NEED_CONFIRM.add(name)
            print("需确认(近战例外):", name, "DOT=", dot)
    else:
        # 枪械非例外：按档位标准国服价
        if dot in GUN.values():
            tier = [k for k, v in GUN.items() if v == dot][0]
            if s["tierKey"] != tier:
                s["tierKey"] = tier
                s["tier"] = {"select": "精选", "deluxe": "奢华", "premium": "卓越", "exclusive": "终极", "ultra": "传奇"}[tier]
            s["vp"] = CN_GUN[tier]
            s["vpSrc"] = "cn-rule"
        else:
            NEED_CONFIRM.add(name)
            print("需确认(枪械例外):", name, "DOT=", dot)

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
print("修正近战品质:", fixed, "款")
print("待确认例外:", len(NEED_CONFIRM))
for n in sorted(NEED_CONFIRM):
    print("  ", n)
