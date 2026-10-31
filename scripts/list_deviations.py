# -*- coding: utf-8 -*-
import json, re, sys
sys.path.insert(0, r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts")
from vp_prices_data import PRICES
BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
def norm(s):
    s = s.replace("Ø","o").replace("ø","o")
    return re.sub(r"[\s_*'’&/.·•\-]+", "", s).lower()
with open(BASE + r"\public\data\skins.json", encoding="utf-8") as f:
    skins = json.load(f)
with open(BASE + r"\scripts\valapi_weapons.json", encoding="utf-8") as f:
    api = json.load(f)
us = {}; uw = {}
for w in api["data"]:
    for s in w.get("skins", []):
        us[s["uuid"]] = s.get("displayName",""); uw[s["uuid"]] = w["displayName"]
GUN = {"select":875,"deluxe":1275,"premium":1775,"exclusive":2175,"ultra":2475}
MELEE = {k:v*2 for k,v in GUN.items()}
cnt = 0
for s in skins:
    std = MELEE[s["tierKey"]] if s["weapon"]=="近战武器" else GUN[s["tierKey"]]
    sk = us.get(s["id"],""); wp = uw.get(s["id"],"")
    dot = None
    if wp == "Melee":
        for sn, v in PRICES["Melee"].items():
            if norm(sn) == norm(sk): dot = v; break
    else:
        for wn, sm in PRICES.items():
            if wn == "Melee": continue
            for sn, v in sm.items():
                if norm(sn+" "+wn) == norm(sk): dot = v; break
            if dot: break
    if dot is not None and dot != std:
        cnt += 1
        if cnt <= 300:
            print(s["name"], "| tier=", s["tierKey"], "标准=", std, "国际服实价=", dot)
print("偏离总数:", cnt)
