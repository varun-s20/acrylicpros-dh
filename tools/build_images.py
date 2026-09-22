#!/usr/bin/env python3
"""Generate responsive WebP derivatives beside each scraped original.

Originals are kept untouched as the <picture> fallback. For every source we
emit `<stem>-<width>.webp` at each target width that does not upscale, plus a
dimensions manifest so the HTML can carry explicit width/height and pin CLS
at zero.

AVIF is skipped: this Pillow build has no AVIF encoder. WebP alone covers
~97% of browsers and captures most of the byte saving. See README.
"""
import json
import os

from PIL import Image

ROOT = r"C:\Users\varun\OneDrive\Desktop\s20\digital-heroes\acrylicpros"
ASSETS = os.path.join(ROOT, "assets")

# Per-folder target widths, chosen from how each image is actually laid out.
WIDTHS = {
    "images/headers":         [768, 1280, 1920, 2400],
    "images/hero":            [768, 1280, 1920],
    "images/gallery":         [480, 800, 1400],
    "images/featured":        [600, 1000, 1600],
    "images/acrylic":         [400, 800],   # Advanced Acrylics catalogue (tools/fetch_acrylic.py)
    "images/scratch-removal": [600, 1000, 1600],
    "images/fabrication":     [600, 1000, 1600],
    "images/pond":            [600, 1000, 1600],
    "images/livestock":       [600, 1000, 1600],
    "images/products":        [400, 800],
    "images/video-thumbs":    [480, 800, 1280],
    "images/brand":           [400, 800],
    "images/instagram":       [320, 640],
}
QUALITY = 82
SKIP_EXT = (".mp4", ".tsv", ".webp", ".md")

manifest = {}
made = skipped = 0

for folder, widths in WIDTHS.items():
    src_dir = os.path.join(ASSETS, folder.replace("/", os.sep))
    if not os.path.isdir(src_dir):
        continue
    for name in sorted(os.listdir(src_dir)):
        if name.lower().endswith(SKIP_EXT):
            continue
        path = os.path.join(src_dir, name)
        if not os.path.isfile(path):
            continue
        try:
            im = Image.open(path)
        except Exception as exc:
            print("!! skip %s/%s: %s" % (folder, name, exc))
            continue
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        native_w, native_h = im.size
        stem = os.path.splitext(name)[0]
        entry = {
            "src": "assets/%s/%s" % (folder.split("/", 1)[1] and folder, name),
            "w": native_w,
            "h": native_h,
            "webp": [],
        }
        entry["src"] = "assets/%s/%s" % (folder, name)

        targets = sorted({w for w in widths if w < native_w} | {native_w})
        for w in targets:
            h = round(native_h * w / native_w)
            out_name = "%s-%d.webp" % (stem, w)
            out_path = os.path.join(src_dir, out_name)
            if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                skipped += 1
            else:
                resized = im if w == native_w else im.resize((w, h), Image.LANCZOS)
                if resized.mode == "RGBA":
                    resized.save(out_path, "WEBP", quality=QUALITY, method=6)
                else:
                    resized.save(out_path, "WEBP", quality=QUALITY, method=6)
                made += 1
            entry["webp"].append({"path": "assets/%s/%s" % (folder, out_name), "w": w, "h": h})
        manifest["%s/%s" % (folder, name)] = entry

with open(os.path.join(ASSETS, "image-manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=1, sort_keys=True)

orig = sum(os.path.getsize(os.path.join(ASSETS, k.replace("/", os.sep))) for k in manifest)
webp = 0
for folder in WIDTHS:
    d = os.path.join(ASSETS, folder.replace("/", os.sep))
    if os.path.isdir(d):
        webp += sum(os.path.getsize(os.path.join(d, n)) for n in os.listdir(d) if n.endswith(".webp"))

print("generated %d webp, reused %d" % (made, skipped))
print("sources: %d images, %.1f MB" % (len(manifest), orig / 1048576))
print("webp derivatives total: %.1f MB" % (webp / 1048576))
