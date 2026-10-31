# -*- coding: utf-8 -*-
import io, glob

old = 'className="w-2.5 border-l-0 bg-transparent opacity-50 transition-opacity hover:opacity-100 data-[state=visible]:opacity-60 [&>div]:bg-primary/40 [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/70"'
new = 'className="w-2.5 border-l-0 bg-transparent transition-opacity data-[state=visible]:opacity-100 [&>div]:bg-primary [&>div]:min-h-12 [&>div]:rounded-full [&>div]:hover:bg-primary/80"'

root = r'C:\Users\30454\Doubao\chats\2026-10-29\new-chat\valorant-shop-tracker\src'
files = [
    r'pages\Stats\StatsPage.tsx',
    r'pages\Skins\SkinsPage.tsx',
    r'pages\Records\sections\HistoryList.tsx',
]
total = 0
for rel in files:
    p = root + '\\' + rel
    s = io.open(p, encoding='utf-8').read()
    n = s.count(old)
    if n:
        s = s.replace(old, new)
        io.open(p, 'w', encoding='utf-8').write(s)
        total += n
        print(rel, 'replaced', n)
print('total', total)
