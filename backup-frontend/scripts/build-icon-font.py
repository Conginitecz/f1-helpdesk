#!/usr/bin/env python3
"""
Build the self-hosted Material Symbols Outlined subset used by components/icon.tsx.

Why this exists
---------------
The Stitch designs use Material Symbols ligature names (dashboard, handshake, ...).
Shipping the upstream font means either a runtime request to fonts.googleapis.com
or a 1.1MB checked-in binary. Both are avoidable:

  * Subsetting by *ligature text* keeps the GSUB liga rules, which drags in the
    whole alphabet plus ~6000 glyphs - about 1.0MB.
  * Subsetting by *glyph name* keeps only the requested icons - a few KB.

The codepoint variant is what this script emits. It also regenerates
src/styles/icon-codepoints.ts so a component can ask for an icon by its design
name and get the right codepoint back.

Requirements: python3 with fonttools and brotli installed
  pip install fonttools brotli

Usage:
  python3 frontend/scripts/build-icon-font.py [--check]

--check re-derives both outputs and fails if they differ from what is committed,
so a design that adds an icon without a rebuild is caught immediately.
"""

from __future__ import annotations

import argparse
import io
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

# A modern Chrome UA is required: with a legacy or generic UA the css2 API
# answers with .ttf faces (about 7MB) instead of the woff2 variable font.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
FAMILY_URL = (
    "https://fonts.googleapis.com/css2?"
    "family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
)

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.dirname(HERE)
REPO = os.path.dirname(FRONTEND)
OUT_DIR = os.path.join(FRONTEND, "public", "fonts")
OUT_FONT = os.path.join(OUT_DIR, "material-symbols-outlined.woff2")
OUT_TS = os.path.join(FRONTEND, "src", "styles", "icon-codepoints.ts")

# Icons the app shell and shared components need beyond what docs/design uses.
EXTRA_ICONS = [
    "arrow_back",
    "arrow_forward",
    "add",
    "edit",
    "delete",
    "error",
    "info",
    "check_circle",
    "cancel",
    "more_vert",
    "menu",
    "keyboard_arrow_down",
    "visibility_off",
    "sort",
    "undo",
    "calendar_month",
    "badge",
    "groups",
    "storefront",
    "category",
    "sell",
    "attach_money",
    "inventory",
    "block",
    "task_alt",
    "rule",
    "settings",
    "build",
    "description",
    "done",
]

# Some docs/design ligature names are not separate glyphs in the upstream
# variable font. Map them onto the closest real glyph so the design intent is
# kept. The script fails loudly on any OTHER unknown name rather than silently
# dropping an icon, so a future mismatch surfaces here, not in a browser where a
# missing icon renders as nothing at all.
DESIGN_ALIASES = {
    "location_on": "pin_drop",
    "phonelink_lock": "devices",
}


def design_icons() -> list[str]:
    """Collect every Material Symbols ligature name used in docs/design."""
    design_root = os.path.join(REPO, "docs", "design")
    found: set[str] = set()
    if not os.path.isdir(design_root):
        return []
    marker = "material-symbols-outlined"
    for dirpath, _dirs, files in os.walk(design_root):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8", errors="ignore") as handle:
                text = handle.read()
            idx = 0
            while True:
                idx = text.find(marker, idx)
                if idx < 0:
                    break
                close = text.find(">", idx)
                end = text.find("<", close)
                if close >= 0 and end > close:
                    ligature = text[close + 1 : end].strip()
                    if ligature and ligature.replace("_", "").isalnum():
                        found.add(ligature)
                    idx = end
                else:
                    idx = close + 1 if close >= 0 else idx + len(marker)
    return sorted(found)


def download_font() -> bytes:
    """Fetch the upstream variable woff2 through the Google Fonts CSS API."""
    request = urllib.request.Request(FAMILY_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        css = response.read().decode("utf-8")

    # The css2 API returns one @font-face per weight, each with a src of
    #   url(https://fonts.gstatic.com/....woff2) format('woff2')
    # so take the url() payload from each src line rather than assuming the
    # line ends with the extension.
    urls: list[str] = []
    for line in css.splitlines():
        start = line.find("url(http")
        if start < 0:
            continue
        end = line.find(")", start)
        if end < 0:
            continue
        candidate = line[start + 4 : end]
        if candidate.endswith(".woff2"):
            urls.append(candidate)
    if not urls:
        raise SystemExit("could not find a woff2 url in the Google Fonts css")
    with urllib.request.urlopen(urls[0], timeout=120) as response:
        return response.read()


def build(data: bytes, names: list[str]) -> tuple[bytes, dict[str, str]]:
    """Subset to the named glyphs, returning the woff2 bytes and name -> char."""
    original = TTFont(io.BytesIO(data))
    order = original.getGlyphOrder()

    # Resolve every requested name to the glyph that actually exists upstream.
    glyph_of: dict[str, str] = {}
    for name in names:
        glyph_of[name] = DESIGN_ALIASES.get(name, name)
    missing = sorted({g for g in glyph_of.values() if g not in order})
    if missing:
        raise SystemExit(f"icons no longer exist upstream: {missing}")

    cmap = original.getBestCmap()
    glyph_for_codepoint = {cp: original.getGlyphID(glyph) for cp, glyph in cmap.items()}
    mapping: dict[str, str] = {}
    for name, glyph in glyph_of.items():
        glyph_id = original.getGlyphID(glyph)
        points = [cp for cp, gid in glyph_for_codepoint.items() if gid == glyph_id]
        if not points:
            raise SystemExit(f"no codepoint found for icon {name}")
        mapping[name] = chr(min(points))

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.recalc_bounds = True
    # Dropping the layout tables is what keeps the file small: icons are
    # addressed by codepoint, so the ligature substitution is dead weight.
    options.drop_tables += ["GSUB", "GPOS", "GDEF", "morx", "kern"]

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(glyphs=sorted(set(glyph_of.values())))
    subsetter.subset(original)

    buffer = io.BytesIO()
    original.save(buffer)
    return buffer.getvalue(), mapping


def render_ts(mapping: dict[str, str]) -> str:
    lines = [
        "/*",
        " * GENERATED FILE - do not edit by hand.",
        " *",
        " * Regenerate with:  python3 frontend/scripts/build-icon-font.py",
        " *",
        " * Maps a Material Symbols ligature name to the private-use codepoint that",
        " * the subsetted font in public/fonts/material-symbols-outlined.woff2 renders.",
        " *",
        " * The subset is keyed by codepoint rather than kept as a ligature font on",
        " * purpose: keeping the ligature GSUB rules pulls in ~6000 glyphs and 1.0MB,",
        " * while codepoint mapping keeps the same icons at a few KB. The trade-off is",
        " * that an icon name in the source is only ever a lookup key, never literal",
        " * text, so an icon name can never leak into the UI as visible text.",
        " */",
        "",
        "export const ICON_CODEPOINTS: Record<string, string> = {",
    ]
    for name in sorted(mapping):
        lines.append('  %s: "\\u%04x",' % (name, ord(mapping[name])))
    lines.append("};")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify committed outputs are current")
    args = parser.parse_args()

    names = sorted(set(design_icons()) | set(EXTRA_ICONS))
    print("icons: %d (%d from docs/design)" % (len(names), len(design_icons())))

    upstream = download_font()
    woff2, mapping = build(upstream, names)
    if len(mapping) != len(names):
        raise SystemExit("codepoint map is incomplete")
    print("subset: %d bytes (upstream %d bytes)" % (len(woff2), len(upstream)))

    ts = render_ts(mapping)

    if args.check:
        ok = True
        if not os.path.exists(OUT_FONT):
            print("MISSING " + OUT_FONT)
            ok = False
        elif open(OUT_FONT, "rb").read() != woff2:
            print("STALE " + OUT_FONT)
            ok = False
        if not os.path.exists(OUT_TS):
            print("MISSING " + OUT_TS)
            ok = False
        elif open(OUT_TS, encoding="utf-8").read() != ts:
            print("STALE " + OUT_TS)
            ok = False
        print("icon font up to date" if ok else "run build-icon-font.py")
        return 0 if ok else 1

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FONT, "wb") as handle:
        handle.write(woff2)
    with open(OUT_TS, "w", encoding="utf-8") as handle:
        handle.write(ts)
    print("wrote " + OUT_FONT)
    print("wrote " + OUT_TS)
    return 0


if __name__ == "__main__":
    sys.exit(main())
