"""Tách nền oải hương của ảnh nhân vật khách -> PNG trong suốt trong public/assets/guests/.
Cùng thuật toán flood-fill viền với tools/tach-nen.py của Lớp Toán (và bộ cô bói):
nền = vùng sát màu nền chạm mép ảnh + vùng kín đủ lớn rất sát màu nền; viền mềm 2px.
Chạy: python3 tools/tach-nen-khach.py  (đọc art-raw/guests/, ghi đè public/assets/guests/)"""
from pathlib import Path
import re
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art-raw' / 'guests'
OUT = ROOT / 'public' / 'assets' / 'guests'
TOL = 16
HOLE_MIN = 300


def alpha_of(a: np.ndarray) -> np.ndarray:
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    diff = np.abs(a.astype(int) - bg).max(axis=2)
    near = diff <= TOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(n + 1))
    tight = diff <= 7
    keep = np.zeros(n + 1, bool)
    keep[list(edge)] = True
    for i in range(1, n + 1):
        if not keep[i] and sizes[i] >= HOLE_MIN and tight[lab == i].mean() > 0.9:
            keep[i] = True
    bgmask = keep[lab]
    ring = ndimage.binary_dilation(bgmask, iterations=2) & ~bgmask
    alpha = np.where(bgmask, 0, 255).astype(np.float32)
    alpha[ring] = np.clip((diff[ring] - TOL) / 30, 0.35, 1) * 255
    return alpha.astype(np.uint8)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in sorted(SRC.glob('media-generation-guest-*.webp')):
        m = re.search(r'guest-([mf]\d)-', f.name)
        if not m:
            continue
        name = m.group(1)
        a = np.array(Image.open(f).convert('RGB'))
        al = alpha_of(a)
        im = Image.fromarray(np.dstack([a, al]), 'RGBA')
        box = im.getbbox()
        im = im.crop(box)
        im.save(OUT / f'{name}.png')
        print(name, im.size)


if __name__ == '__main__':
    main()
