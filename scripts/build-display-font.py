#!/usr/bin/env python3
"""
Builds src/app/fonts/BricolageCondensed-Display.woff2 — the condensed ink face
the episode headlines are set in.

Why an instance and not the Google Fonts CSS: Bricolage Grotesque ships a
width axis (wdth 75–100), but next/font/google only exposes wght, and the full
variable file is ~130 kB. Pinning opsz at 96 (display cut, tight apertures)
and wdth at 75 (fully condensed), keeping only a 600–800 weight range and
Latin-1 plus the punctuation the headlines use, gives one small file that does
exactly one job.

Source: google/fonts, ofl/bricolagegrotesque (SIL Open Font License 1.1, see
src/app/fonts/OFL-BricolageGrotesque.txt). The upstream TTF is downloaded to a
temp dir and never committed.

Usage:  python3 scripts/build-display-font.py      (npm run fonts:display)
Needs:  fontTools + brotli  (pip install --user fonttools brotli)
"""
import os
import sys
import tempfile
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'src/app/fonts/BricolageCondensed-Display.woff2')
SRC = ('https://raw.githubusercontent.com/google/fonts/main/ofl/'
       'bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf')
BUDGET = 40 * 1024

# Basic Latin, Latin-1 Supplement, the dash/quote/ellipsis block and primes.
UNICODES = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x100))
    + list(range(0x2010, 0x2028))
    + [0x2032, 0x2033]
)


def main():
    with tempfile.TemporaryDirectory() as tmp:
        ttf = os.path.join(tmp, 'BricolageGrotesque.ttf')
        print('downloading', SRC)
        urllib.request.urlretrieve(SRC, ttf)

        font = TTFont(ttf)
        # opsz/wdth pinned, wght kept as a 600–800 range so 'font-weight: 700'
        # and any bolder emphasis still come from one file.
        font = instancer.instantiateVariableFont(
            font, {'opsz': 96, 'wdth': 75, 'wght': (600, 800)}
        )

        opts = subset.Options()
        opts.layout_features = ['*']
        opts.flavor = 'woff2'
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        opts.drop_tables += ['DSIG']
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=UNICODES)
        sub.subset(font)
        font.flavor = 'woff2'
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        font.save(OUT)

    size = os.path.getsize(OUT)
    print(f'wrote {os.path.relpath(OUT, ROOT)}  {size} bytes ({size / 1024:.1f} KB)')
    if size > BUDGET:
        print(f'over budget: {size} > {BUDGET} bytes', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
