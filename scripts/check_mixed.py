# -*- coding: utf-8 -*-
"""检查同主题套装的混合归属：找出契约数据遗漏的通行证皮肤。"""
import json
import sys

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
RAW = BASE + r"\public\data\_raw_valorant_api.json"
NSL = BASE + r"\scripts\_nonshop_skin_levels.json"

sys.stdout.reconfigure(encoding="utf-8")


def main() -> int:
    raw = json.load(open(RAW, encoding="utf-8"))
    skins = raw["skins"]
    nsl = json.load(open(NSL, encoding="utf-8"))
    level_set = set(nsl["level_uuids"])

    # 每个皮肤的 theme -> (是否非商店)
    nonshop = set()
    for s in skins:
        if any(lv.get("uuid") in level_set for lv in (s.get("levels") or [])):
            nonshop.add(s["uuid"])

    # 按 theme 分组
    from collections import defaultdict

    grp = defaultdict(lambda: {"nonshop": [], "shop": []})
    for s in skins:
        t = s.get("themeUuid") or "none"
        if s["uuid"] in nonshop:
            grp[t]["nonshop"].append(s["displayName"])
        else:
            grp[t]["shop"].append(s["displayName"])

    mixed = []
    for t, g in grp.items():
        if g["nonshop"] and g["shop"]:
            mixed.append((t, g))

    print("混合主题数:", len(mixed))
    out = []
    for t, g in mixed:
        out.append("== theme %s ==" % t)
        out.append("  非商店: " + ", ".join(sorted(g["nonshop"])))
        out.append("  商店侧: " + ", ".join(sorted(g["shop"])))
    text = "\n".join(out)
    open(BASE + r"\scripts\_mixed_themes.txt", "w", encoding="utf-8").write(text)
    print("已写入 _mixed_themes.txt，混合主题数:", len(mixed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
