"""Erzeugt die App-Icons aus dem Logo-Entwurf "Negativraum".

Geometrie in einem 100x100-Raster, identisch zur favicon.svg:
gruene Kachel, Loch und Fahne dunkel ausgespart.
"""

import os

from PIL import Image, ImageDraw

OUT = "public"
GREEN = (34, 197, 94, 255)  # turf-500
DARK = (4, 18, 11, 255)  # deep-950
SS = 4  # Supersampling gegen Treppchen
DX = -5.0  # optischer Ausgleich: die Fahne zieht die Masse nach rechts


def render(px: int, radius_pct: float = 0.0, k: float = 1.0, opaque: bool = False):
    """k skaliert das Motiv um die Mitte - fuer die maskierbare Variante."""
    S = px * SS
    u = S / 100.0
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if radius_pct > 0:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius_pct * S, fill=GREEN)
    else:
        d.rectangle([0, 0, S, S], fill=GREEN)

    def tx(x: float, y: float):
        return ((50 + (x + DX - 50) * k) * u, (50 + (y - 50) * k) * u)

    cx, cy = tx(50, 70)
    rx, ry = 11 * k * u, 7.5 * k * u
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=DARK)

    x0, y0 = tx(50 - 2.1, 24 - 2.1)
    x1, y1 = tx(50 + 2.1, 70)
    d.rounded_rectangle([x0, y0, x1, y1], radius=2.1 * k * u, fill=DARK)

    d.polygon([tx(52.2, 25), tx(76, 33), tx(52.2, 41)], fill=DARK)

    img = img.resize((px, px), Image.LANCZOS)
    return img.convert("RGB") if opaque else img


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#22c55e"/>
  <ellipse cx="45" cy="70" rx="11" ry="7.5" fill="#04120b"/>
  <rect x="42.9" y="21.9" width="4.2" height="48.1" rx="2.1" fill="#04120b"/>
  <polygon points="47.2,25 71,33 47.2,41" fill="#04120b"/>
</svg>
"""


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    with open(f"{OUT}/favicon.svg", "w", encoding="utf-8") as f:
        f.write(SVG)

    jobs = [
        ("favicon-32.png", render(32, radius_pct=0.22)),
        # iOS rundet selbst ab -> randlos und ohne Alpha
        ("apple-touch-icon.png", render(180, opaque=True)),
        # purpose "any" wird nicht maskiert, traegt also die Markenform selbst
        ("icon-192.png", render(192, radius_pct=0.22)),
        ("icon-512.png", render(512, radius_pct=0.22)),
        # Android maskiert -> randlos, Motiv in die Sicherheitszone schrumpfen
        ("icon-maskable-512.png", render(512, k=0.8)),
    ]

    for name, img in jobs:
        path = f"{OUT}/{name}"
        img.save(path)
        print(f"{name:26} {img.size[0]}x{img.size[1]}  {os.path.getsize(path) / 1024:.1f} KB")

    print(f"{'favicon.svg':26} vektor       {os.path.getsize(f'{OUT}/favicon.svg') / 1024:.1f} KB")


if __name__ == "__main__":
    main()
