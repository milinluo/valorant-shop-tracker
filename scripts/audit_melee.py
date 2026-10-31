# -*- coding: utf-8 -*-
"""输出 DOT 表外（2025+ 新近战）的品质档，供核对；写入已知公告例外价"""
import json
import re
import sys

sys.path.insert(0, r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts")
from vp_prices_data import PRICES

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

def norm(s):
    s = s.replace("Ø", "o").replace("ø", "o")
    return re.sub(r"[\s_*'’&/.·•\-]+", "", s).lower()

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)
with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api_en = json.load(f)

us = {}; uw = {}
for w in api_en["data"]:
    for s in w.get("skins", []):
        us[s["uuid"]] = s.get("displayName", "")
        uw[s["uuid"]] = w["displayName"]

# DOT Melee 索引
melee_idx = {norm(sn): v for sn, v in PRICES["Melee"].items()}

print("== DOT 表外近战（2025+ 新）品质档 ==")
for s in skins:
    if s["weapon"] != "近战武器":
        continue
    sk = us.get(s["id"], "")
    if norm(sk) not in melee_idx:
        print(f"  {s['name']} | tier={s['tierKey']} | 国服现价={s['vp']}")

# 写入已知公告例外
FIX = {
    "焚月镰刃": 3780,
    "噬影者 簇刃": 3780,
    "荒狼之颚 蛮勇战斧": 1180,
}
for s in skins:
    if s["name"] in FIX:
        s["vp"] = FIX[s["name"]]
        s["vpSrc"] = "cn-exact"
        if s["name"] == "荒狼之颚 蛮勇战斧":
            s["tierKey"] = "select"
            s["tier"] = "精选"
        print("写入:", s["name"], s["vp"], s["tierKey"])

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)
