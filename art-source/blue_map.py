# Violet / gold / peach UI colours -> the dark blue theme (owner, Nov 22 2026 build j). Used on css/*.css and on the
# UI colours written in a few scripts. Exact literals only (normalised spacing for rgba).
import re, sys
HEX = {
    '#1c1033': '#0a1530', '#2c1850': '#102347', '#3a2166': '#16305f', '#251443': '#0d1c3c',
    '#f6e7ff': '#eaf3ff', '#c3b0de': '#a3bde2', '#fdb27e': '#3f8ae6', '#ffd23f': '#8fd0ff',
    '#3a2a5a': '#1e3560', '#1a1024': '#0a1428', '#ffe27a': '#b8e2ff', '#ffe680': '#bfe4ff',
    '#e09a1c': '#2a64c8', '#ffcf5a': '#7cc0ff', '#e69a2f': '#3f86e6', '#7a4a1b': '#cfe6ff',
    '#7a3ad0': '#2f6fd8', '#e8a066': '#4a90ec', '#ffb347': '#5aa8ff', '#9d7c41': '#2c5aa8',
    '#8a6ad8': '#4a8fe8', '#5a3fa0': '#2c5aa8', '#241540': '#0d1c3c', '#d8ccff': '#cfe2ff', '#e8e4ff': '#e4f0ff',
    '#ffe08a': '#b8e2ff', '#1e1038': '#0c1a38', '#22123f': '#0f1f42', '#160c2a': '#09142c', '#5a4a80': '#3a5a90',
    '#4a3480': '#24508f', '#5a3a9a': '#2c5aa8', '#3a2470': '#173470', '#5a2d8c': '#2c5aa8', '#3a1a66': '#173470',
    '#120d1c': '#0a1220', '#7a52c8': '#3f7ad8',
    '#5aa8ff': '#4a8fe8', '#2f74e6': '#2559c2', '#1b3c7a': '#10285c',
}
RGB = {
    (28, 16, 51): (10, 21, 48), (58, 33, 102): (22, 48, 95), (44, 24, 80): (16, 35, 71), (20, 10, 30): (6, 12, 28),
    (20, 10, 40): (6, 14, 38), (253, 178, 126): (90, 168, 255), (255, 210, 63): (143, 208, 255),
    (180, 108, 255): (90, 168, 255), (154, 82, 232): (63, 138, 230), (37, 20, 67): (13, 28, 60), (138, 106, 216): (74, 143, 232),
}
def conv(s):
    def h(m):
        k = m.group(0).lower()
        return HEX.get(k, m.group(0))
    s = re.sub(r'#[0-9a-fA-F]{6}\b', h, s)
    def r(m):
        nums = tuple(int(x) for x in m.group(2).split(','))
        if nums in RGB:
            a, b, c = RGB[nums]
            sp = ', ' if ', ' in m.group(2) else ','
            return m.group(1) + sp.join(map(str, (a, b, c))) + m.group(3)
        return m.group(0)
    s = re.sub(r'(rgba?\()\s*(\d+\s*,\s*\d+\s*,\s*\d+)(\s*[,)])', lambda m: r(type('M', (), {'group': lambda self, i, mm=m: mm.group(i) if i != 2 else re.sub(r'\s+', ' ', mm.group(2)).replace(' ,', ',')})()), s)
    return s
for p in sys.argv[1:]:
    a = open(p, newline='').read()
    b = conv(a)
    if a != b:
        open(p, 'w', newline='').write(b)
        print(p, sum(1 for x, y in zip(a.split('\n'), b.split('\n')) if x != y), 'lines')
