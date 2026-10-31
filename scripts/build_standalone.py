# -*- coding: utf-8 -*-
"""生成免安装分享版：双击 index.html 直接打开（无需 Python/服务器）"""
import io, os, glob, re, shutil

PROJ = r'C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker'
OUT_DIR = os.path.join(PROJ, 'dist', 'output')
RES_DIR = os.path.join(PROJ, 'dist', 'output_resource', 'assets')
DEST = r'C:\Users\30454\Desktop\无畏契约商店记录-免安装版'

os.makedirs(os.path.join(DEST, 'data'), exist_ok=True)

# 1. 读取构建产物
html = io.open(os.path.join(OUT_DIR, 'index.html'), encoding='utf-8').read()
css_files = glob.glob(os.path.join(RES_DIR, 'index-*.css'))
js_files = glob.glob(os.path.join(RES_DIR, 'index-*.js'))
assert len(css_files) == 1 and len(js_files) == 1, (css_files, js_files)
css = io.open(css_files[0], encoding='utf-8').read()
js = io.open(js_files[0], encoding='utf-8').read()

# 2. 内联 CSS
html = re.sub(r'<link rel="stylesheet"[^>]*>', lambda m: '<style>' + css + '</style>', html, count=1)

# 3. 内联 JS（module 脚本在 file:// 下被 CORS 拦截，必须内联）
js_inline = js.replace('</script>', '<\\/script>')
html = re.sub(
    r'<script type="module"[^>]*></script>',
    lambda m: '<script type="module">' + js_inline + '</script>',
    html,
    count=1,
)

# 4. 在 </head> 前注入皮肤数据脚本（普通 script，file:// 下可加载）
data_tag = '    <script src="data/skins-data.js"></script>\n  </head>'
html = html.replace('</head>', data_tag, 1)

# 5. 皮肤数据 JS 文件
skins = io.open(os.path.join(PROJ, 'public', 'data', 'skins.json'), encoding='utf-8').read()
skin_data_js = 'window.__SKINS__ = ' + skins + ';'
io.open(os.path.join(DEST, 'data', 'skins-data.js'), 'w', encoding='utf-8').write(skin_data_js)

# 6. 输出 index.html
io.open(os.path.join(DEST, 'index.html'), 'w', encoding='utf-8').write(html)

# 7. 复制 icons.svg（来源：工程 public 目录）
shutil.copy2(os.path.join(PROJ, 'public', 'icons.svg'), os.path.join(DEST, 'icons.svg'))

print('index.html 大小: %.2f KB' % (len(html) / 1024))
print('skins-data.js 大小: %.2f KB' % (len(skin_data_js) / 1024))
print('内联 module 脚本存在:', '<script type="module">' in html)
print('外链残留:', ('src="/assets' in html) or ('href="/assets' in html))
print('done')
