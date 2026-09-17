#!/usr/bin/env python3
"""Derive transparent and reversed-out variants of the Acrylic Pros logo.

The production logo is `cropped-WhatsApp-Image-...jpeg`: black artwork on a
baked-in white rectangle. That cannot sit on dark or photographic surfaces,
and the only alternative on the live site is a *different*, older fish mark
— using both would be a brand inconsistency.

This lifts the white background off the current mark instead:

  logo-primary-transparent.png  black artwork, transparent ground (light UI)
  logo-primary-white.png        white artwork, transparent ground (dark UI)

Alpha is taken from pixel darkness, so antialiased edges stay smooth rather
than developing a hard matte line.

NOTE: this is a stopgap derived from a compressed JPEG. A proper SVG
re-trace of the fin and script remains the outstanding asset request —
see README, "Missing assets".
"""
import os

from PIL import Image

BRAND = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "assets", "images", "brand")
SOURCE = os.path.join(BRAND, "logo-primary.jpeg")

# Pixels at or above this luminance are treated as pure background.
WHITE_CUT = 246
# Pixels at or below this are treated as fully solid artwork.
INK_CUT = 120


def build():
    src = Image.open(SOURCE).convert("RGB")
    w, h = src.size
    px = src.load()

    dark = Image.new("RGBA", (w, h))
    light = Image.new("RGBA", (w, h))
    dpx = dark.load()
    lpx = light.load()

    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = (r * 299 + g * 587 + b * 114) // 1000

            if lum >= WHITE_CUT:
                alpha = 0
            elif lum <= INK_CUT:
                alpha = 255
            else:
                # Ramp through the antialiased edge so it feathers cleanly.
                alpha = int(round(255 * (WHITE_CUT - lum) / float(WHITE_CUT - INK_CUT)))

            # Keep the original hue (the mark carries a steel-blue outline).
            dpx[x, y] = (r, g, b, alpha)
            # Reversed-out: same coverage, painted white.
            lpx[x, y] = (255, 255, 255, alpha)

    dark_path = os.path.join(BRAND, "logo-primary-transparent.png")
    light_path = os.path.join(BRAND, "logo-primary-white.png")
    dark.save(dark_path, optimize=True)
    light.save(light_path, optimize=True)

    for path in (dark_path, light_path):
        print("  %-34s %s  %.0f KB" % (os.path.basename(path),
                                       Image.open(path).size,
                                       os.path.getsize(path) / 1024.0))


if __name__ == "__main__":
    print("Deriving logo variants from", os.path.basename(SOURCE))
    build()
