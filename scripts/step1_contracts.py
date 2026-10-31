# -*- coding: utf-8 -*-
"""第一步：抓取 contracts 接口，识别所有非商店皮肤（战斗通行证/活动通行证/特工契约）。

输出：
- scripts/_contracts_raw.json          全部契约原始数据
- scripts/_nonshop_skin_levels.json    非商店契约中的皮肤 reward uuid 集合
"""
import json
import sys
import urllib.request
import time

sys.stdout.reconfigure(encoding="utf-8")


def fetch(url, tries=5):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=150) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print("retry", i + 1, type(e).__name__)
            time.sleep(3)
    raise RuntimeError("fail " + url)


BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\scripts"


def main() -> int:
    contracts = fetch("https://valorant-api.com/v1/contracts?language=zh-CN")["data"]
    with open(BASE + r"\_contracts_raw.json", "w", encoding="utf-8") as f:
        json.dump(contracts, f, ensure_ascii=False)

    # 分类：Story=战斗通行证, Events=活动通行证, Characters=特工契约, 其他=特殊
    cats = {"Story": [], "Events": [], "Characters": [], "Other": []}
    for c in contracts:
        ap = c.get("assetPath") or ""
        if "/Contracts/Story/" in ap:
            cats["Story"].append(c)
        elif "/Contracts/Events/" in ap:
            cats["Events"].append(c)
        elif "/Contracts/Characters/" in ap:
            cats["Characters"].append(c)
        else:
            cats["Other"].append(c)

    print("契约分类: Story=%d Events=%d Characters=%d Other=%d" % (
        len(cats["Story"]), len(cats["Events"]), len(cats["Characters"]), len(cats["Other"])))

    # 收集所有非商店契约里的皮肤奖励（level uuid）
    skin_level_uuids = set()
    skin_uuids = set()
    for cat in ("Story", "Events", "Characters"):
        for c in cats[cat]:
            content = c.get("content") or {}
            for ch in content.get("chapters") or []:
                for lv in ch.get("levels") or []:
                    rw = lv.get("reward") or {}
                    t = rw.get("type")
                    if t == "EquippableSkinLevel":
                        skin_level_uuids.add(rw.get("uuid"))
                    elif t == "EquippableSkin":
                        skin_uuids.add(rw.get("uuid"))

    print("非商店 level uuid:", len(skin_level_uuids), "| 直接 skin uuid:", len(skin_uuids))
    with open(BASE + r"\_nonshop_skin_levels.json", "w", encoding="utf-8") as f:
        json.dump(
            {"level_uuids": sorted(skin_level_uuids), "skin_uuids": sorted(skin_uuids)},
            f, ensure_ascii=False, indent=1,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
