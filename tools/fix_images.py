#!/usr/bin/env python3
"""Reconcile every <img> in the site against assets/image-manifest.json.

Hand-transcribing intrinsic dimensions across two dozen pages reliably
produces wrong width/height attributes, which is a direct CLS regression.
This makes the manifest the single source of truth instead:

  * <img width/height>  rewritten to the file's real intrinsic size
  * sibling <source type="image/webp"> srcset rebuilt from the derivatives
    that actually exist on disk
  * existing `sizes`, alt, loading, decoding and class attributes untouched

Run after adding or editing pages:  python tools/fix_images.py
Add --check to report without writing (used by CI / pre-flight).
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "assets", "image-manifest.json")

IMG_RE = re.compile(r"<img\b[^>]*>", re.I)
PICTURE_RE = re.compile(r"<picture\b.*?</picture>", re.I | re.S)
SOURCE_WEBP_RE = re.compile(
    r'<source\b(?=[^>]*type="image/webp")[^>]*>', re.I)


def load_manifest():
    if not os.path.isfile(MANIFEST):
        sys.exit("image-manifest.json not found — run tools/build_images.py first.")
    with io.open(MANIFEST, encoding="utf-8") as f:
        return json.load(f)


def attr(tag, name):
    m = re.search(r'\b%s="([^"]*)"' % re.escape(name), tag, re.I)
    return m.group(1) if m else None


def set_attr(tag, name, value):
    """Set or replace an attribute, preserving everything else in the tag."""
    pattern = re.compile(r'(\b%s=")[^"]*(")' % re.escape(name), re.I)
    if pattern.search(tag):
        return pattern.sub(lambda m: m.group(1) + value + m.group(2), tag, count=1)
    # Insert before the closing bracket.
    return re.sub(r"\s*/?>$", ' %s="%s">' % (name, value), tag, count=1)


def manifest_key(src, page_rel_dir):
    """Turn an href like 'assets/images/gallery/project-04.jpeg' into a key."""
    src = src.split("?")[0].split("#")[0]
    # Pages live at the root, so paths are already project-relative.
    norm = os.path.normpath(os.path.join(page_rel_dir, src)).replace("\\", "/")
    if norm.startswith("assets/"):
        norm = norm[len("assets/"):]
    return norm


def main():
    check_only = "--check" in sys.argv
    manifest = load_manifest()

    # Operate on the SOURCES, not the built pages. Editing generated output
    # would be undone by the next build_pages.py run — silently reverting every
    # dimension fix and reintroducing the layout shift this tool exists to stop.
    #
    # product/*.html are not listed: build_products.py already writes their
    # dimensions straight from the manifest.
    pages = []
    src_pages = os.path.join(ROOT, "src", "pages")
    if os.path.isdir(src_pages):
        for name in sorted(os.listdir(src_pages)):
            if name.endswith(".html"):
                pages.append(os.path.join(src_pages, name))

    src_partials = os.path.join(ROOT, "src", "partials")
    if os.path.isdir(src_partials):
        for name in sorted(os.listdir(src_partials)):
            # these partials are generated from the manifest already.
            if name.endswith(".html") and name not in (
                    "gallery-grid.html", "product-grid.html",
                    "product-ranges.html", "product-compare.html",
                    "instagram-feed.html"):
                pages.append(os.path.join(src_partials, name))

    total_fixed = 0
    total_missing = 0
    changed_pages = []

    for path in pages:
        page = os.path.relpath(path, ROOT).replace("\\", "/")
        # Source fragments reference assets with root-relative paths (they are
        # assembled into pages at the project root), so there is no directory
        # offset to apply when resolving them against the manifest.
        page_rel_dir = ""
        original = io.open(path, encoding="utf-8").read()
        text = original
        fixed_here = 0

        def fix_picture(match):
            nonlocal fixed_here, total_missing
            block = match.group(0)
            img_match = IMG_RE.search(block)
            if not img_match:
                return block
            img = img_match.group(0)
            src = attr(img, "src")
            if not src or not src.startswith("assets/") and page_rel_dir:
                pass
            if not src:
                return block

            key = manifest_key(src, page_rel_dir)
            entry = manifest.get(key)
            if not entry:
                total_missing += 1
                print("  ? no manifest entry for %s (in %s)" % (src, page))
                return block

            new_img = img
            if attr(img, "width") != str(entry["w"]):
                new_img = set_attr(new_img, "width", str(entry["w"]))
            if attr(img, "height") != str(entry["h"]):
                new_img = set_attr(new_img, "height", str(entry["h"]))

            new_block = block
            if new_img != img:
                new_block = new_block.replace(img, new_img, 1)
                fixed_here += 1

            # Rebuild the webp <source> from derivatives that exist on disk.
            source_match = SOURCE_WEBP_RE.search(new_block)
            if source_match and entry["webp"]:
                source = source_match.group(0)
                prefix = "../" * len(page_rel_dir.split("/")) if page_rel_dir else ""
                parts = []
                for d in entry["webp"]:
                    rel = prefix + d["path"]
                    parts.append("%s %dw" % (rel, d["w"]))
                srcset = ",\n                              ".join(parts)
                new_source = set_attr(source, "srcset", srcset)
                if new_source != source:
                    new_block = new_block.replace(source, new_source, 1)
                    fixed_here += 1

            return new_block

        text = PICTURE_RE.sub(fix_picture, text)

        # Bare <img> not wrapped in <picture>: fix intrinsic size only.
        def fix_bare(match):
            nonlocal fixed_here, total_missing
            img = match.group(0)
            src = attr(img, "src")
            if not src or not src.startswith(("assets/", "../assets/")):
                return img
            key = manifest_key(src, page_rel_dir)
            entry = manifest.get(key)
            if not entry:
                return img
            new_img = img
            if attr(img, "width") != str(entry["w"]):
                new_img = set_attr(new_img, "width", str(entry["w"]))
            if attr(img, "height") != str(entry["h"]):
                new_img = set_attr(new_img, "height", str(entry["h"]))
            if new_img != img:
                fixed_here += 1
            return new_img

        # Only touch images that are NOT inside a <picture> we already handled.
        picture_spans = [m.span() for m in PICTURE_RE.finditer(text)]

        def outside_picture(m):
            return not any(start <= m.start() < end for start, end in picture_spans)

        pieces = []
        last = 0
        for m in IMG_RE.finditer(text):
            if not outside_picture(m):
                continue
            pieces.append(text[last:m.start()])
            pieces.append(fix_bare(m))
            last = m.end()
        pieces.append(text[last:])
        text = "".join(pieces)

        if text != original:
            changed_pages.append((page, fixed_here))
            total_fixed += fixed_here
            if not check_only:
                io.open(path, "w", encoding="utf-8").write(text)

    if not pages:
        print("No pages to reconcile yet.")
        return 0

    verb = "would fix" if check_only else "fixed"
    print("Reconciled %d page(s) against the manifest." % len(pages))
    for page, n in changed_pages:
        print("  %s %2d attribute(s) in %s" % (verb, n, page))
    if not changed_pages:
        print("  every <img> already matches its file on disk.")
    if total_missing:
        print("\n%d image reference(s) had no manifest entry — check the path." % total_missing)
        return 1
    if check_only and changed_pages:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
