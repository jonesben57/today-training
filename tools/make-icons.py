#!/usr/bin/env python3
"""Draw the home-screen icons: a near-black square with a red tick.

Standard library only. Run from anywhere:  python3 tools/make-icons.py
Writes icons/icon-192.png, icons/icon-512.png and icons/apple-touch-icon.png (180 px).
The squares are full-bleed and opaque: iPhone and Android round the corners themselves,
and the tick sits well inside Android's "maskable" safe circle.
"""
import math
import pathlib
import struct
import zlib

BACKGROUND = (0x11, 0x11, 0x11)  # near-black
TICK_COLOUR = (0xD9, 0x43, 0x2B)  # the app's red accent

# The tick, as fractions of the icon size: three points joined by a round-ended stroke.
# icons/icon.svg draws the same shape (multiply by 512).
TICK = [(0.2635, 0.5055), (0.4285, 0.6705), (0.7475, 0.3295)]
STROKE = 0.105

SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}


def distance_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def draw(size):
    points = [(x * size, y * size) for x, y in TICK]
    segments = list(zip(points, points[1:]))
    half = STROKE * size / 2
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            d = min(distance_to_segment(x + 0.5, y + 0.5, *a, *b) for a, b in segments)
            cover = max(0.0, min(1.0, half - d + 0.5))  # 1 px of anti-aliasing at the edge
            row += bytes(round(b + (t - b) * cover) for b, t in zip(BACKGROUND, TICK_COLOUR))
        rows.append(bytes(row))
    return png(size, size, rows)


def png(width, height, rows):
    def chunk(kind, data):
        return (struct.pack(">I", len(data)) + kind + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF))

    raw = b"".join(b"\x00" + row for row in rows)  # filter type 0 on every row
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    out = pathlib.Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for name, size in SIZES.items():
        (out / name).write_bytes(draw(size))
        print(f"wrote icons/{name} ({size}x{size})")
