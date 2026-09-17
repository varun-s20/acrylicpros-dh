#!/usr/bin/env python3
"""One-time scrape of genuine Acrylic Pros media into assets/.

Writes assets/ASSET-MANIFEST.tsv recording source URL -> local path -> status.
Re-runnable: files already present with non-zero size are skipped.
"""
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = r"C:\Users\varun\OneDrive\Desktop\s20\digital-heroes\acrylicpros"
UP = "https://acrylicpros.com/wp-content/uploads/"
OLD = "https://ij0.22f.myftpupload.com/wp-content/uploads/"
UA = {"User-Agent": "Mozilla/5.0 (asset migration for site owner)"}

jobs = []


def add(url, dest):
    jobs.append((url, dest))


# --- brand marks -------------------------------------------------------
add(UP + "2025/11/cropped-WhatsApp-Image-2025-11-21-at-1.56.17-AM.jpeg",
    "images/brand/logo-primary.jpeg")
add(UP + "2025/02/ff_l_ogo.png", "images/brand/logo-stacked-white.png")
add(UP + "2025/10/icon_fav.png", "images/brand/favicon-fin.png")
add(UP + "2025/08/SpaceX-Logo.png", "images/brand/spacex-logo.png")
add(UP + "2025/08/WhatsApp-Image-2025-08-29-at-1.03.50-PM.png",
    "images/brand/shark-king-mascot.png")
add(UP + "2024/06/insta.png", "icons/social/instagram.png")
add(UP + "2024/06/yelp.png", "icons/social/yelp.png")
add(UP + "2025/08/facebook.png", "icons/social/facebook.png")
add(UP + "2025/09/google.png", "icons/social/google.png")

# --- hero video + posters ---------------------------------------------
add(UP + "2025/08/ezgif-1f4bf907c13c2f.mp4", "video/hero-desktop.mp4")
add(UP + "2025/08/WhatsApp-Video-2025-08-06-at-12.18.15-PM.mp4", "video/hero-mobile.mp4")
add(UP + "2025/07/acrylic-video.mp4", "video/acrylic-overview.mp4")
add(UP + "2025/08/desktop.jpg", "images/hero/hero-poster-desktop.jpg")
add(UP + "2025/08/mobile.jpg", "images/hero/hero-poster-mobile.jpg")

# --- page banners / textures ------------------------------------------
for src, dst in [
    ("2024/12/f_n_header.jpg", "coral-closeup-header.jpg"),
    ("2024/09/home_water_bg-scaled.jpg", "underwater-godrays-bg.jpg"),
    ("2024/10/section_1.jpg", "kitchen-aquarium-lifestyle.jpg"),
    ("2024/08/gallery_header.jpg", "gallery-header.jpg"),
    ("2024/08/scratches_header.jpg", "scratch-removal-header.jpg"),
    ("2024/08/video_header.jpg", "videos-header.jpg"),
    ("2024/08/shop_header.jpg", "shop-header.jpg"),
    ("2024/08/panoramic_contact_fn.jpg", "contact-header.jpg"),
]:
    add(UP + src, "images/headers/" + dst)

# --- livestock / corals ------------------------------------------------
for src, dst in [
    ("2025/02/New-Project-44.jpg", "coral-reef-dense.jpg"),
    ("2024/11/1-2.jpg", "reef-tank-blue-light.jpg"),
    ("2024/11/3-1.jpg", "reef-colonies-fish.jpg"),
    ("2024/11/4.jpg", "soft-corals-macro.jpg"),
    ("2025/07/WhatsApp-Image-2025-07-25-at-10.26.06-PM.jpeg", "reef-tank-footer.jpeg"),
    ("2024/09/Shop_AcrylicPros1-500x500-1-500x500.jpg", "coral-colony-cutout.jpg"),
    ("2024/09/Shop_AcrylicPros2-500x500-1-500x500.jpg", "stingray-cutout.jpg"),
    ("2024/09/Shop_AcrylicPros3-500x500-1-500x500.jpg", "blacktip-shark-cutout.jpg"),
    ("2024/09/shark.png", "angelfish-cutout.png"),
]:
    add(UP + src, "images/livestock/" + dst)

# --- service icons (2026/08 set is current; only the -800x800 derivative exists)
for n in ("sharks", "stingray", "corals", "tropical", "pool", "pond", "scratch",
          "custombuild", "fabrication", "maintanence", "relocations", "24hr_emergency"):
    add(UP + "2026/08/%s-800x800.png" % n, "icons/service/%s.png" % n)

# --- gallery (34 project photos) --------------------------------------
for i in list(range(1, 17)) + list(range(18, 20)) + list(range(21, 34)):
    add(UP + "2024/06/%d_gallery_image.jpeg" % i, "images/gallery/project-%02d.jpeg" % i)
# filename typo below is genuine on the live host
add(UP + "2024/06/20_gaallery_image.jpeg", "images/gallery/project-20.jpeg")
add(UP + "2024/12/17_gallery_new.jpeg", "images/gallery/project-17.jpeg")
add(UP + "2024/07/35_gallery_image.jpg", "images/gallery/project-35.jpg")
add(UP + "2024/07/36_gallery_image.jpg", "images/gallery/project-36.jpg")

# --- ponds -------------------------------------------------------------
add(UP + "2024/08/New-Project-33.jpg", "images/pond/koi-pond-lilies.jpg")
add(UP + "2024/08/fab_ffnn.jpg", "images/pond/koi-pond-collage.jpg")
for i in (1, 2, 3):
    add(UP + "2026/08/pond%d_fn-1024x768.jpg" % i, "images/pond/pond-%d.jpg" % i)

# --- fabrication -------------------------------------------------------
for src, dst in [
    ("2024/08/New-Project-3.png", "machinery-bw.png"),
    ("2024/08/New-Project-32.jpg", "reef-tank-white-stand.jpg"),
    ("2025/09/carpt_fnl-1024x768.jpg", "warehouse-collage.jpg"),
    ("2025/09/design_fn-1024x768.jpg", "cad-renders.jpg"),
    ("2024/08/fab_fn.jpg", "fabrication-collage.jpg"),
    ("2025/09/quality_fnnn-1024x768.jpg", "showroom-collage.jpg"),
]:
    add(UP + src, "images/fabrication/" + dst)

# --- scratch removal before/after (still hosted on the retired GoDaddy box) --
for i in range(1, 21):
    add(OLD + "2024/06/scratch_%d.jpeg" % i, "images/scratch-removal/scratch-%02d.jpeg" % i)


# --- product photography, discovered from the sitemap ------------------
def queue_product_images():
    try:
        req = urllib.request.Request("https://acrylicpros.com/product-sitemap.xml", headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r:
            xml = r.read()
    except Exception as exc:
        print("!! product sitemap unreachable: %s" % exc, file=sys.stderr)
        return
    seen = set()
    for loc in ET.fromstring(xml).iter("{http://www.google.com/schemas/sitemap-image/1.1}loc"):
        url = (loc.text or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        raw = urllib.parse.unquote(url.rsplit("/", 1)[-1])
        add(url, "images/products/" + re.sub(r"[^A-Za-z0-9._-]", "-", raw))


queue_product_images()

# --- run ---------------------------------------------------------------
os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
rows = []
ok = skip = fail = 0
for url, rel in jobs:
    dest = os.path.join(ROOT, "assets", rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        rows.append((url, rel, "skip-exists", str(os.path.getsize(dest))))
        skip += 1
        continue
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
            data = r.read()
        if not data:
            raise ValueError("empty body")
        with open(dest, "wb") as f:
            f.write(data)
        rows.append((url, rel, "ok", str(len(data))))
        ok += 1
    except Exception as exc:
        rows.append((url, rel, "FAIL", str(exc).replace("\t", " ")[:160]))
        if os.path.exists(dest) and os.path.getsize(dest) == 0:
            os.remove(dest)
        fail += 1

with open(os.path.join(ROOT, "assets", "ASSET-MANIFEST.tsv"), "w", encoding="utf-8") as f:
    f.write("source_url\tlocal_path\tstatus\tdetail\n")
    for row in rows:
        f.write("\t".join(row) + "\n")

print("downloaded=%d skipped=%d failed=%d total=%d" % (ok, skip, fail, len(rows)))
if fail:
    print("\nFAILURES:")
    for url, rel, status, detail in rows:
        if status == "FAIL":
            print("  %s\n    %s\n    %s" % (rel, url, detail))
