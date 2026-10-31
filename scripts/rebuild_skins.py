# -*- coding: utf-8 -*-
"""从原始快照重新生成 skins.json（端游国服皮肤池）。
剔除规则：
1. 默认皮肤（武器默认 skin）
2. 无 displayIcon 的条目
3. 名称含“随机选择/最爱”的特殊条目
4. 国服端游未上架的套装：Ayakashi 胧夜月华（3 款）
"""
import json
import sys

RAW = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\public\data\_raw_valorant_api.json"
OUT = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\public\data\skins.json"

# 国服端游没有的皮肤 uuid（Ayakashi 套装：胧夜月华 幻影 / 胧夜月华 鬼魅 / 稚狐夜刃）
EXCLUDE_UUIDS = {
    "c1b96274-4346-2ea4-65f4-ec957d217922",
    "a9d11586-488a-c93e-c3cc-1ca5d9b6faa9",
    "987e847d-47d2-6ab3-2369-0497b6c39a7e",
}

TIER_ZH = {
    "select": "精选",
    "deluxe": "豪华",
    "premium": "卓越",
    "exclusive": "传奇",
    "ultra": "终极",
}

WEAPON_ZH = {
    "Sidearm": "标配",
    "SMG": "蜂刺",
    "Shotgun": "判官",
    "Rifle": "幻影",
    "Sniper": "冥驹",
    "Heavy": "奥丁",
    "Melee": "近战武器",
}


def main() -> int:
    raw = json.load(open(RAW, encoding="utf-8"))
    skins = raw["skins"]
    weapons = raw["weapons"]
    tiers = raw["tiers"]

    tier_by_uuid = {t["uuid"]: t["displayName"] for t in tiers}
    default_skin_uuids = {w.get("defaultSkinUuid") for w in weapons}
    # 通过武器条目内的 skins 数组建立 皮肤uuid -> (武器中文名, 分类短码) 映射
    skin_weapon = {}
    for w in weapons:
        cat = (w.get("category") or "").split("::")[-1] or "Melee"
        for s in w.get("skins") or []:
            skin_weapon[s["uuid"]] = (w["displayName"], cat)

    step = {}
    kept = []
    for s in skins:
        name = s["displayName"]
        # 1. 默认皮肤
        if s["uuid"] in default_skin_uuids:
            step["默认皮肤"] = step.get("默认皮肤", 0) + 1
            continue
        # 2. 无图标
        if not s.get("displayIcon"):
            step["无图标"] = step.get("无图标", 0) + 1
            continue
        # 3. 特殊条目
        if "随机选择" in name or "最爱" in name:
            step["随机/最爱"] = step.get("随机/最爱", 0) + 1
            continue
        # 4. 国服未上架
        if s["uuid"] in EXCLUDE_UUIDS:
            step["国服未上架(Ayakashi)"] = step.get("国服未上架(Ayakashi)", 0) + 1
            continue

        wuuid = s.get("weaponUuid")
        wname, wcat = skin_weapon.get(s["uuid"], ("", ""))
        tier_name = tier_by_uuid.get(s.get("contentTierUuid"))
        tier_key = None
        for k, v in TIER_ZH.items():
            if v == tier_name:
                tier_key = k
                break
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

    # 校验：确认剔除的三个 uuid 确实存在
    all_ids = {s["uuid"] for s in skins}
    missing = [u for u in EXCLUDE_UUIDS if u not in all_ids]
    if missing:
        print("警告: 以下剔除 uuid 不在原始数据中:", missing)
        return 1

    json.dump(kept, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("已写入:", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
