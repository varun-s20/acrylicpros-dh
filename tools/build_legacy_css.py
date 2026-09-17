#!/usr/bin/env python3
"""Generate assets/home/legacy.css from assets/css/styles.css.

Pages that have not been redesigned yet keep their old body markup, but
they now wear the same header, menu and footer as every other page. The
new chrome (home.css) sets the root font size to 10px, while the old
stylesheet was written for 16px. This script makes the old rules safe
to load next to it:

  * every `rem` value in a declaration is multiplied by 1.6, so sizes stay
    the same (media queries are left alone: they ignore the root size);
  * every rule is scoped to `:where(#main)`, so it cannot restyle the
    header, menu or footer (`:where` adds no specificity, so the old
    cascade is unchanged);
  * `html` rules and the font @import are dropped (home.css owns them),
    and the bare `body` rule is applied to `#main` instead.

Run it whenever styles.css changes:  python tools/build_legacy_css.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "css", "styles.css")
OUT = os.path.join(ROOT, "assets", "home", "legacy.css")
SCOPE = ":where(#main)"

# Browser defaults that home.css resets globally but the old markup relies on.
RESTORE = """
/* ---- defaults the old markup expects (home.css resets them globally) ---- */
:where(#main) img { width: auto; }
:where(#main) :is(.prose, .legal) ul { padding-left: 2.4rem; list-style: disc; }
:where(#main) :is(.prose, .legal) ol { padding-left: 2.4rem; list-style: decimal; }
:where(#main) :is(.prose, .legal) li + li { margin-top: .8rem; }

/* ---- shared chrome on old pages ---- */
.t-legacy .t-page { background-color: #fff; }
/* Pages without a photographic hero start below the floating header. */
.t-legacy:not(.-overlay) #main { padding-top: 13rem; }
/* Legal documents: section headings at reading size, not display size. */
:is(.page--warranty, .page--refund-policy, .page--privacy-policy) #main h2 {
  font-size: clamp(2.4rem, 2.4vw, 3.2rem); line-height: 1.2; letter-spacing: -.02em;
}
"""


def rem(match):
    value = float(match.group(1)) * 1.6
    text = ("%.4f" % value).rstrip("0").rstrip(".")
    return text + "rem"


def to_rem(body):
    # Only declarations are converted: rem inside @media queries always means
    # the browser default (16px), whatever the root font size is.
    return re.sub(r"(-?\d*\.?\d+)rem\b", rem, body)


def split_selectors(prelude):
    parts, depth, cur = [], 0, ""
    for ch in prelude:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]


def scope_selector(sel):
    if sel.startswith(":root"):
        return sel
    if sel == "body":
        return SCOPE
    if sel.startswith("body"):
        return sel
    return SCOPE + " " + sel


def blocks(css):
    """Yield (prelude, body) for each top-level block, plus raw text between."""
    i, n = 0, len(css)
    while i < n:
        start = css.find("{", i)
        if start < 0:
            yield None, css[i:]
            return
        # statements ending in ';' before the brace (@import, @charset)
        semi = css.rfind(";", i, start)
        if semi >= 0 and css[i:semi + 1].strip().startswith("@"):
            yield "@stmt", css[i:semi + 1]
            i = semi + 1
            continue
        depth, j = 0, start
        while j < n:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        yield css[i:start], css[start + 1:j]
        i = j + 1


def transform(css):
    out = []
    for prelude, body in blocks(css):
        if prelude is None:
            out.append(body)
            continue
        if prelude == "@stmt":
            continue  # @charset / @import
        # keep leading comments / whitespace
        m = re.match(r"(\s*(?:/\*.*?\*/\s*)*)(.*)", prelude, re.S)
        lead, head = m.group(1), m.group(2).strip()
        if head.startswith("@media") or head.startswith("@supports"):
            out.append("%s%s {%s}" % (lead, head, transform(body)))
        elif head.startswith("@"):
            out.append("%s%s {%s}" % (lead, head, to_rem(body)))
        else:
            sels = split_selectors(head)
            if all(s.startswith("html") for s in sels):
                out.append(lead)
                continue
            sels = [scope_selector(s) for s in sels if not s.startswith("html")]
            out.append("%s%s {%s}" % (lead, ",\n".join(sels), to_rem(body)))
    return "".join(out)


def build():
    css = io.open(SRC, encoding="utf-8").read()
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)  # comments may contain braces
    css = re.sub(r"\n\s*\n+", "\n", css)
    result = (
        "/* GENERATED by tools/build_legacy_css.py from assets/css/styles.css.\n"
        "   Do not edit - edit styles.css and rerun the script. */\n"
        + transform(css).lstrip()
        + RESTORE
    )
    check = "--check" in sys.argv
    old = io.open(OUT, encoding="utf-8").read() if os.path.isfile(OUT) else None
    if old == result:
        print("legacy.css up to date.")
        return 0
    if check:
        print("STALE: assets/home/legacy.css")
        return 1
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(result)
    print("Wrote assets/home/legacy.css")
    return 0


if __name__ == "__main__":
    sys.exit(build())
