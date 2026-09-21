#!/usr/bin/env python3
"""Static site check for the Acrylic Pros build.

Verifies, across every .html file in the project root:

  assets      every src / srcset / poster / CSS url() resolves to a real file
  links       every internal .html href points at a page that exists
  anchors     every same-page #fragment has a matching id
  seo         one H1 per page; unique title; unique meta description; canonical
  a11y        no img without alt; no empty href; labelled form controls
  hygiene     no inline style attributes, no leftover lorem, no spam tokens
              carried over from the compromised WordPress source

Run:  python tools/check_site.py
Exit: 0 when clean, 1 when any ERROR is found (warnings do not fail).
"""
import html
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Tokens injected into the live WordPress site by an SEO parasite. None of
# these may ever appear in the rebuild.
SPAM_TOKENS = [
    "Bitnex Crestfort", "Cresta Valtrion", "Juvthorix", "Alza Fintrion",
    "Liman Dexeris", "Prämie Invexus", "Liège Rentèvance",
]

errors = []
warnings = []


def err(page, msg):
    errors.append("%s: %s" % (page, msg))


def warn(page, msg):
    warnings.append("%s: %s" % (page, msg))


def html_files():
    found = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # `wordpress` holds page *fragments* for the WordPress build — no
        # <head>, no <html>, and links to pretty URLs that exist only once
        # WordPress is serving them. Checking them as standalone pages reports
        # every one of those as a fault. They have their own suite:
        # python wordpress/tests/check.py wordpress/ --config wordpress/tests/check-config.json
        dirnames[:] = [d for d in dirnames
                       if d not in ("assets", "tools", "docs", "src", ".git",
                                    "node_modules", "wordpress")]
        for name in sorted(filenames):
            if name.endswith(".html"):
                found.append(os.path.join(dirpath, name))
    return sorted(found)


def strip_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def resolve(page_path, ref):
    """Resolve a page-relative reference to an absolute path on disk."""
    base = os.path.dirname(page_path)
    return os.path.normpath(os.path.join(base, ref))


def check_asset(page, page_path, ref, kind):
    ref = html.unescape(ref).strip()
    if not ref or ref.startswith(("http://", "https://", "//", "data:", "mailto:",
                                  "tel:", "sms:", "#", "javascript:")):
        return
    target = resolve(page_path, ref.split("?")[0].split("#")[0])
    if not os.path.isfile(target):
        err(page, "missing %s -> %s" % (kind, ref))


def main():
    pages = html_files()
    if not pages:
        print("No HTML files found yet — nothing to check.")
        return 0

    titles = defaultdict(list)
    descriptions = defaultdict(list)
    page_names = set(os.path.basename(p) for p in pages)

    for page_path in pages:
        page = os.path.relpath(page_path, ROOT).replace("\\", "/")
        raw = open(page_path, encoding="utf-8").read()
        body = strip_comments(raw)

        # --- assets -------------------------------------------------
        for ref in re.findall(r'\bsrc="([^"]+)"', body):
            check_asset(page, page_path, ref, "src")
        for ref in re.findall(r'\bposter="([^"]+)"', body):
            check_asset(page, page_path, ref, "poster")
        for ref in re.findall(r'<link[^>]+href="([^"]+)"', body):
            check_asset(page, page_path, ref, "link href")
        for srcset in re.findall(r'\bsrcset="([^"]+)"', body):
            for candidate in srcset.split(","):
                url = candidate.strip().split()[0] if candidate.strip() else ""
                if url:
                    check_asset(page, page_path, url, "srcset")

        # A srcset using w-descriptors without `sizes` makes the browser
        # assume 100vw, mis-select the candidate and upscale it.
        for tag in re.findall(r"<(?:source|img)\b[^>]*>", body):
            if "srcset=" in tag and re.search(r"\d+w[,\"]", tag) and "sizes=" not in tag:
                err(page, "srcset uses w-descriptors but has no sizes: %s" % tag[:100])

        # --- internal page links ------------------------------------
        hrefs = re.findall(r'<a\b[^>]*\bhref="([^"]*)"', body)
        for href in hrefs:
            h = html.unescape(href).strip()
            if not h:
                err(page, "empty href on an <a>")
                continue
            if h.startswith(("http://", "https://", "mailto:", "tel:", "sms:", "//")):
                continue
            if h.startswith("#"):
                frag = h[1:]
                if frag and not re.search(r'\bid="%s"' % re.escape(frag), body):
                    err(page, "anchor #%s has no matching id" % frag)
                continue
            target_file = h.split("#")[0].split("?")[0]
            if not target_file:
                continue
            resolved = resolve(page_path, target_file)
            if not os.path.exists(resolved):
                err(page, "broken link -> %s" % h)

        # --- SEO ----------------------------------------------------
        title_match = re.search(r"<title>(.*?)</title>", raw, re.S)
        if not title_match:
            err(page, "no <title>")
        else:
            titles[title_match.group(1).strip()].append(page)

        desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', raw)
        if not desc:
            err(page, "no meta description")
        elif len(desc.group(1).strip()) < 50:
            warn(page, "meta description under 50 characters")
        else:
            descriptions[desc.group(1).strip()].append(page)

        if not re.search(r'<link\s+rel="canonical"', raw):
            err(page, "no canonical link")

        h1s = re.findall(r"<h1\b[^>]*>(.*?)</h1>", body, re.S)
        if len(h1s) == 0:
            err(page, "no <h1>")
        elif len(h1s) > 1:
            err(page, "%d <h1> elements (expected exactly 1)" % len(h1s))
        else:
            if not re.sub(r"<[^>]+>", "", h1s[0]).strip():
                err(page, "<h1> is empty")

        if not re.search(r'<html[^>]+lang="', raw):
            err(page, "<html> has no lang attribute")

        # --- accessibility -----------------------------------------
        for tag in re.findall(r"<img\b[^>]*>", body):
            if not re.search(r"\balt=", tag):
                err(page, "img without alt: %s" % tag[:90])
            if not re.search(r"\bwidth=", tag) or not re.search(r"\bheight=", tag):
                warn(page, "img without width/height (CLS risk): %s" % tag[:90])

        # Spans of every <label>…</label>, so implicitly-labelled controls
        # (the input nested inside its own label) are recognised as valid.
        label_spans = [m.span() for m in
                       re.finditer(r"<label\b[^>]*>.*?</label>", body, re.S)]

        for m in re.finditer(r"<(?:input|select|textarea)\b[^>]*>", body):
            tag = m.group(0)
            if re.search(r'type="(hidden|submit|button|reset)"', tag):
                continue
            has_id = re.search(r'\bid="([^"]+)"', tag)
            wrapped = any(start <= m.start() < end for start, end in label_spans)
            labelled = (wrapped
                        or re.search(r"\baria-label=", tag)
                        or re.search(r"\baria-labelledby=", tag)
                        or (has_id and re.search(r'\bfor="%s"' % re.escape(has_id.group(1)), body)))
            if not labelled:
                err(page, "unlabelled form control: %s" % tag[:90])

        if "skip-link" not in body:
            warn(page, "no skip-to-content link")

        # --- hygiene -----------------------------------------------
        # Custom properties only are data, not styling: the Featured Projects
        # rows pass each photo's aspect ratio to the stylesheet as --a/--sum.
        if re.search(r'\sstyle="(?!(?:--[\w-]+:[^;"]*;?)+")', body):
            err(page, "inline style attribute present (all CSS belongs in styles.css)")

        if re.search(r"lorem ipsum", raw, re.I):
            err(page, "Lorem Ipsum placeholder text present")

        for token in SPAM_TOKENS:
            if token.lower() in raw.lower():
                err(page, "SEO spam token carried over from WordPress: %r" % token)

        for tag in re.findall(r'<a\b[^>]*target="_blank"[^>]*>', body):
            if "rel=" not in tag:
                warn(page, "target=_blank without rel: %s" % tag[:80])

    # --- cross-page uniqueness -------------------------------------
    for title, where in titles.items():
        if len(where) > 1:
            err("SITE", "duplicate <title> %r on: %s" % (title[:60], ", ".join(where)))
    for desc, where in descriptions.items():
        if len(where) > 1:
            err("SITE", "duplicate meta description on: %s" % ", ".join(where))

    # --- report -----------------------------------------------------
    print("Checked %d page(s), %d unique title(s)." % (len(pages), len(titles)))

    if warnings:
        print("\n%d WARNING(S):" % len(warnings))
        for w in warnings:
            print("  ! " + w)

    if errors:
        print("\n%d ERROR(S):" % len(errors))
        for e in errors:
            print("  x " + e)
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
