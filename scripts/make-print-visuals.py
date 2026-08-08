#!/usr/bin/env python3
"""Generate light, print-legible twins of the research visuals.

The on-screen figures are dark plates (near-black canvas, electric-yellow
accent). Printed on white paper they read as heavy ink blocks, so every white
paper PDF loads a `-print.svg` twin instead (see the `img` component in
app/research/[slug]/page.tsx). Run after editing any file in
public/research-visuals/:

    python3 scripts/make-print-visuals.py
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
SRC = Path("public/research-visuals")

# Shapes: dark canvas/panels become paper, borders become hairlines, the
# yellow accent ramp shifts to olive so 4px bars survive a printer.
SHAPE = {
    "#060606": "#ffffff",
    "#0a0a0a": "#ffffff",
    "#0c0c0a": "#f7f7f5",
    "#0e0e0c": "#f7f7f5",
    "#10100e": "#f4f3f0",
    "#111110": "#f2f1ee",
    "#131310": "#efeeea",
    "#2a2a26": "#d5d3cc",
    "#3a3a36": "#c9c7bf",
    "#5a5a52": "#a5a39a",
    "#525c00": "#8a9600",
    "#6b7600": "#8a9600",
    "#839000": "#96a300",
    "#9c9c00": "#9caa00",
    "#9caa00": "#9caa00",
    "#b4c400": "#a8b800",
    "#cdde00": "#a8b800",
    "#E6FF00": "#a8b800",
    "#ef4444": "#c1352b",
    "#22c55e": "#1c7f45",
}

# Text: the dark-theme grays invert to an ink hierarchy; yellow copy goes olive
# dark enough to read at 13px on white.
TEXT = {
    "#0a0a0a": "#ffffff",  # 1px spacer glyph — invisible on either stock
    "#f5f5f3": "#0c0c0a",
    "#a8a8a3": "#33322c",
    "#6a6a64": "#63615a",
    "#5a5a52": "#63615a",
    "#E6FF00": "#6f7c08",
    "#cdde00": "#6f7c08",
    "#ef4444": "#b02f26",
    "#22c55e": "#17703c",
}


def has_text(el):
    return el.tag == f"{{{SVG_NS}}}text" or any(
        child.tag in (f"{{{SVG_NS}}}text", f"{{{SVG_NS}}}tspan") or has_text(child)
        for child in el
    )


def convert(el):
    table = TEXT if has_text(el) else SHAPE
    for attr in ("fill", "stroke"):
        val = el.get(attr)
        if val and val.lower() != "none":
            hit = table.get(val) or table.get(val.upper()) or table.get(val.lower())
            if hit:
                el.set(attr, hit)
            elif val.startswith("#"):
                print(f"  unmapped {attr}={val}", file=sys.stderr)
    for child in el:
        convert(child)


def main():
    ET.register_namespace("", SVG_NS)
    made = 0
    for src in sorted(SRC.glob("*.svg")):
        if src.stem.endswith("-print"):
            continue
        tree = ET.parse(src)
        root = tree.getroot()
        convert(root)
        # The canvas rect is the first child and must cover the full viewBox.
        out = SRC / f"{src.stem}-print.svg"
        body = ET.tostring(root, encoding="unicode")
        body = re.sub(r"\s+/>", "/>", body)
        out.write_text(body + "\n")
        print(f"wrote {out}")
        made += 1
    print(f"{made} print variants")


if __name__ == "__main__":
    main()
