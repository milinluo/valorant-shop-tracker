# -*- coding: utf-8 -*-
"""为 skins.json 附加 valorant-api 的 VP 价格（按 uuid 匹配）"""
import json
import sys

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"

with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api = json.load(f)

VP_UUID = "85ad13f7-3d1b-5128-9eb2-7cd8ee0b3a1f"

# uuid -> vp
vp_map = {}
name_map = {}  # uuid -> english displayName（调试用）
for weapon in api["data"]:
    for skin in weapon.get("skins", []):
        cost = skin.get("cost") or {}
        vp = None
        if cost:
            if VP_UUID in cost:
                vp = cost[VP_UUID]
            else:
                vals = [v for v in cost.values() if isinstance(v, int)]
                vp = vals[0] if vals else None
        vp_map[skin["uuid"]] = vp
        name_map[skin["uuid"]] = skin.get("displayName", "")

with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)

matched = 0
missing = []
for s in skins:
    vp = vp_map.get(s["id"])
    if vp is not None:
        s["vp"] = vp
        matched += 1
    else:
        missing.append((s.get("name", "?"), s.get("id", "?")))

print("总皮肤数:", len(skins))
print("匹配到VP:", matched)
print("未匹配:", len(missing))
for name, sid in missing[:40]:
    print("MISS:", name, sid)

with open(BASE + r"\public\data\skins.json", "w", encoding="utf-8") as f:
    json.dump(skins, f, ensure_ascii=False, indent=1)

print("已写回 skins.json")
