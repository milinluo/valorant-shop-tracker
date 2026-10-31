# -*- coding: utf-8 -*-
"""批量 OCR 识别商店截图：提取每张截图当日刷新的 4 款皮肤。

流程：
1. 读取 public/data/skins.json 全部皮肤名（去空格后的规范名）
2. 对文件夹内 Screenshot_YYYYMMDD_*.jpg 逐张 OCR
3. 提取卡片区文本行，与皮肤名做精确/编辑距离/包含匹配
4. 输出 scripts/ocr_results.json：{date: [matched_name...], failures: [...]}
"""
import json
import os
import re
import sys
import time
from rapidocr_onnxruntime import RapidOCR

BASE = r"C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker"
SHOP_DIR = r"C:\Users\30454\Desktop\商店"
OUT = BASE + r"\scripts\ocr_results.json"

sys.stdout.reconfigure(encoding="utf-8")


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s)


def norm2(s: str) -> str:
    """去空格且去 //（OCR 常丢失斜杠）"""
    return re.sub(r"\s+|//|/", "", s)


def edit_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    la, lb = len(a), len(b)
    if abs(la - lb) > 2:
        return 99
    dp = list(range(lb + 1))
    for i in range(1, la + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, lb + 1):
            cur = dp[j]
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + (0 if a[i - 1] == b[j - 1] else 1))
            prev = cur
    return dp[lb]


def match_skin(line: str, skin_names_norm: list):
    """返回匹配到的皮肤名（原始带空格名）或 None"""
    t = norm(line)
    t2 = norm2(line)
    if len(t) < 2:
        return None
    best, best_d = None, 99
    for orig, n in skin_names_norm:
        if t == n or t2 == norm2(orig):
            return orig
        d = edit_distance(t, n)
        if d < best_d:
            best_d = d
            best = orig
    # 包含关系容错：行是皮肤名的一部分且长度够长
    for orig, n in skin_names_norm:
        if len(t) >= 4 and (t in n or n in t) and abs(len(n) - len(t)) <= 2:
            return orig
    if best_d <= 1 and best:
        return best
    return None


def main() -> int:
    skins = json.load(open(BASE + r"\public\data\skins.json", encoding="utf-8"))
    skin_names = [(s["name"], norm(s["name"])) for s in skins]

    files = sorted(
        f for f in os.listdir(SHOP_DIR) if re.match(r"Screenshot_\d{8}_\d{6}\.jpg$", f)
    )
    print("截图总数:", len(files))

    engine = RapidOCR()
    results = {}
    failures = []
    unmatched_lines = {}

    for i, fn in enumerate(files, 1):
        m = re.match(r"Screenshot_(\d{8})_\d{6}\.jpg$", fn)
        date = m.group(1)
        date_fmt = f"{date[:4]}-{date[4:6]}-{date[6:]}"
        path = os.path.join(SHOP_DIR, fn)
        t0 = time.time()
        res, _ = engine(path)
        # 卡片区文本：y 在 600~2700 之间（图片高 2800），排除数字/想要/导航
        lines = []
        if res:
            for box, text, _score in res:
                y = box[0][1]
                t = text.strip()
                if not (600 <= y <= 2700):
                    continue
                if re.fullmatch(r"[\d.\-]+", t):
                    continue
                if "想要" in t or "万人" in t:
                    continue
                if "出场率" in t or "大师赛" in t or "冠军赛" in t:
                    continue
                if t in ("商店", "VCT商店", "战斗通行证", "掌瓦通行证", "每日商店", "王国商店", "首页", "好友", "福利", "我的", "端游"):
                    continue
                lines.append(t)
        matched = []
        for ln in lines:
            hit = match_skin(ln, skin_names)
            if hit:
                matched.append(hit)
        # 去重（同名只算一次）
        matched = list(dict.fromkeys(matched))
        results[date_fmt] = matched
        if len(matched) < 4:
            failures.append({"date": date_fmt, "matched": matched, "lines": lines})
        elif len(matched) > 4:
            unmatched_lines[date_fmt] = matched
        print(f"[{i}/{len(files)}] {date_fmt} 识别 {len(matched)} 款: {matched} ({time.time()-t0:.1f}s)", flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"results": results, "failures": failures, "extra": unmatched_lines}, f, ensure_ascii=False, indent=1)
    print("完成。失败:", len(failures), "多余匹配:", len(unmatched_lines))
    for fa in failures:
        print("  FAIL:", fa["date"], fa["matched"], "| lines:", fa["lines"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
