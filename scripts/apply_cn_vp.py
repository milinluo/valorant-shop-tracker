# -*- coding: utf-8 -*-
"""国服点券价生成：
1. 704 款按国服品质档位标准价映射（精选590/豪华890/卓越1290/终极1590/传奇1790，近战×2）
2. 输出国际服例外皮肤（DOT价≠档位）清单，供逐个搜索国服价
"""
import json
import sys

sys.path.insert(0, r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts")
from vp_prices_data import PRICES

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

# 国服点券标准档位（国际服品质 -> 国服点券）
CN_GUN = {"select": 590, "deluxe": 890, "premium": 1290, "exclusive": 1590, "ultra": 1790}
CN_MELEE = {k: v * 2 for k, v in CN_GUN.items()}

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)
with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api_en = json.load(f)

# uuid -> API 皮肤displayName / 武器
uuid_skin = {}
uuid_weapon = {}
for w in api_en["data"]:
    wn = w["displayName"]
    for s in w.get("skins", []):
        uuid_skin[s["uuid"]] = s.get("displayName", "")
        uuid_weapon[s["uuid"]] = wn

# 已确认的国服例外（皮肤全名 -> 国服点券）——来自官方公告/攻略站
CN_EXCEPTIONS = {
    # 塑水宗 Kuronami 系列（国际服例外 2375）
    "塑水宗 狂徒": 1690, "塑水宗 正义": 1690, "塑水宗 骇灵": 1690, "塑水宗 飞将": 1690,
    "塑水宗 幻影": 1690, "塑水宗 冥驹": 1690, "塑水宗 戍卫": 1690, "塑水宗 鬼魅": 1690,
    "塑水宗//2.0 幻影": 1690, "塑水宗//2.0 冥驹": 1690, "塑水宗//2.0 戍卫": 1690, "塑水宗//2.0 鬼魅": 1690,
    # 圣契命澜（国际服例外 2375）
    "圣契命澜 狂徒": 1690, "圣契命澜 戍卫": 1690, "圣契命澜 飞将": 1690, "圣契命澜 追猎": 1690,
    # 电音光谱 Spectrum（国际服例外 2675）
    "电音光谱 幻影": 1890, "电音光谱 獠犬": 1890, "电音光谱 戍卫": 1890, "电音光谱 标配": 1890,
    "电音光谱 判官": 1890, "电音光谱 狂徒": 1890, "电音光谱 正义": 1890, "电音光谱 骇灵": 1890,
    # 源能者娱乐系统 Radiant Entertainment System（国际服例外 2975）
    "源能者娱乐系统 幻影": 2090, "源能者娱乐系统 冥驹": 2090, "源能者娱乐系统 鬼魅": 2090, "源能者娱乐系统 獠犬": 2090,
    "源能者娱乐系统 狂徒": 2090, "源能者娱乐系统 奥丁": 2090, "源能者娱乐系统 判官": 2090, "源能者娱乐系统 正义": 2090,
    "源能者娱乐系统 骇灵": 2090, "源能者娱乐系统 飞将": 2090, "源能者娱乐系统 标配": 2090,
    # 近战例外（已从公告确认）
    "泷吟": 3780, "命轮": 3780, "影蝶": 3780,
    # 掠影//3.0 追猎（premium 标准，无例外，但确认过）
}

# 应用国服价
for s in skins:
    if s["name"] in CN_EXCEPTIONS:
        s["vp"] = CN_EXCEPTIONS[s["name"]]
        s["vpSrc"] = "cn-exact"
    else:
        base = CN_MELEE if s["weapon"] == "近战武器" else CN_GUN
        s["vp"] = base[s["tierKey"]]
        s["vpSrc"] = "cn-rule"

# 统计国际服例外皮肤（DOT价 vs 国际服档位）供人工确认
def norm(s):
    s = s.replace("Ø", "o").replace("ø", "o")
    return re.sub(r"[\s_*'’&/.·•\-]+", "", s).lower()

import re
GUN = {"select": 875, "deluxe": 1275, "premium": 1775, "exclusive": 2175, "ultra": 2475}
MELEE = {k: v * 2 for k, v in GUN.items()}
intl_exceptions = []
for s in skins:
    std = MELEE[s["tierKey"]] if s["weapon"] == "近战武器" else GUN[s["tierKey"]]
    if s.get("vpSrc") != "cn-exact":  # 跳过已确认例外的
        # 用 DOT 表反查该皮肤国际服价
        uid = s["id"]
        sk = uuid_skin.get(uid, "")
        wp = uuid_weapon.get(uid, "")
        dot_vp = None
        if wp == "Melee":
            for sname, v in PRICES["Melee"].items():
                if norm(sname) == norm(sk):
                    dot_vp = v
                    break
        else:
            for weapon, skins_map in PRICES.items():
                if weapon == "Melee":
                    continue
                for sname, v in skins_map.items():
                    if norm(sname + " " + weapon) == norm(sk):
                        dot_vp = v
                        break
                if dot_vp:
                    break
        if dot_vp is not None and dot_vp != std:
            intl_exceptions.append((s["name"], std, dot_vp))

print("== 国际服例外但国服暂按标准价（需确认）==")
for name, std, dot in sorted(intl_exceptions):
    print(f"  {name}: 国服标准{CN_GUN.get(s['tierKey'], CN_MELEE.get(s['tierKey'])) if False else ''} | 国际服 {std}->{dot}")

# 保存
with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
print("已写回，共", len(skins), "款")
