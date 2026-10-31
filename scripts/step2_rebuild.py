# -*- coding: utf-8 -*-
"""第二步：重建 skins.json —— 只保留端游每日商店会刷新的皮肤。

排除（按序）：默认皮肤 → 随机/最爱占位 → Ayakashi(国服未上架) → 非商店皮肤(通行证/活动/特工契约)。
不再按 displayIcon 过滤（图鉴为文字列表，无图标皮肤也是真实皮肤）。
"""
import json
import sys

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
RAW = BASE + r"\public\data\_raw_valorant_api.json"
OUT = BASE + r"\public\data\skins.json"
NSL = BASE + r"\scripts\_nonshop_skin_levels.json"

# Ayakashi 套装（国服端游未上架）
EXCLUDE_UUIDS = {
    "c1b96274-4346-2ea4-65f4-ec957d217922",
    "a9d11586-488a-c93e-c3cc-1ca5d9b6faa9",
    "987e847d-47d2-6ab3-2369-0497b6c39a7e",
}

TIER_ZH = {"select": "精选", "deluxe": "豪华", "premium": "卓越", "exclusive": "传奇", "ultra": "终极"}


def main() -> int:
    raw = json.load(open(RAW, encoding="utf-8"))
    skins, weapons, tiers = raw["skins"], raw["weapons"], raw["tiers"]

    tier_by_uuid = {t["uuid"]: t["displayName"] for t in tiers}
    default_skin_uuids = {w.get("defaultSkinUuid") for w in weapons}
    skin_weapon = {}
    for w in weapons:
        cat = (w.get("category") or "").split("::")[-1] or "Melee"
        for s in w.get("skins") or []:
            skin_weapon[s["uuid"]] = (w["displayName"], cat)

    # 非商店皮肤 uuid 集合
    nsl = json.load(open(NSL, encoding="utf-8"))
    level_set = set(nsl["level_uuids"])
    nonshop_uuids = set()
    for s in skins:
        if any(lv.get("uuid") in level_set for lv in (s.get("levels") or [])):
            nonshop_uuids.add(s["uuid"])

    # 主题级扩展：同主题套装只要有皮肤在契约里（通行证/活动/特工），整套都按非商店处理
    # （Riot 的套装要么整套装进通行证，要么整套装进商店，不会拆分）
    nonshop_themes = {s["themeUuid"] for s in skins if s["uuid"] in nonshop_uuids}
    for s in skins:
        if s.get("themeUuid") in nonshop_themes:
            nonshop_uuids.add(s["uuid"])

    step = {}
    kept = []
    for s in skins:
        name = s["displayName"]
        if s["uuid"] in default_skin_uuids:
            step["默认皮肤"] = step.get("默认皮肤", 0) + 1
            continue
        if "随机选择" in name or "最爱" in name:
            step["随机/最爱"] = step.get("随机/最爱", 0) + 1
            continue
        if s["uuid"] in EXCLUDE_UUIDS:
            step["国服未上架(Ayakashi)"] = step.get("国服未上架(Ayakashi)", 0) + 1
            continue
        if s["uuid"] in nonshop_uuids:
            step["非商店(通行证/活动/特工)"] = step.get("非商店(通行证/活动/特工)", 0) + 1
            continue

        tier_name = tier_by_uuid.get(s.get("contentTierUuid"))
        tier_key = None
        for k, v in TIER_ZH.items():
            if v == tier_name:
                tier_key = k
                break
        wname, wcat = skin_weapon.get(s["uuid"], ("", ""))
        kept.append(
            {
                "id": s["uuid"],
                "name": name,
                "weapon": wname,
                "category": wcat,
                "tier": tier_name or "",
                "tierKey": tier_key,
            }
        )

    print("原始条数:", len(skins))
    for k, v in step.items():
        print(f"剔除[{k}]: {v}")
    print("保留条数:", len(kept))

    json.dump(kept, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("已写入:", OUT)

    # 验证用户点名的皮肤
    names = {s["name"] for s in kept}
    for kw in ["凌云天纵", "金镶碧玉", "电光霓虹", "源晶工程", "艾沃莉", "紫阙金琅", "胧夜月华", "稚狐夜刃"]:
        hits = sorted(n for n in names if kw in n)
        print(f"保留中[{kw}]:", len(hits), hits[:8])
    return 0


if __name__ == "__main__":
    sys.exit(main())
