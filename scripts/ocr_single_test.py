# -*- coding: utf-8 -*-
"""测试 RapidOCR 识别一张商店截图。"""
import sys
import json
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding="utf-8")
engine = RapidOCR()

img = r"C:\Users\30454\Desktop\商店\Screenshot_20260727_112510.jpg"
result, _ = engine(img)
if not result:
    print("无识别结果")
    sys.exit(0)
for box, text, score in result:
    y = box[0][1]
    print(f"y={y:6.0f} score={str(score)[:4]}  {text}")
