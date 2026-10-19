#!/usr/bin/env python3
"""
Build the font files the share cards render with.

WHY this exists: next/og (satori) cannot read woff2 and cannot fetch a font at
request time without turning every share into a network round trip, so the
three faces the site uses on screen have to land in the repo as subset TTFs.
Each card only ever sets Latin text plus a handful of kanji, so subsetting
keeps all three well inside the edge bundle limit.

Sources, credited in src/app/og/CREDITS.txt:
  Bricolage Grotesque, Instrument Serif - SIL OFL 1.1
  Shippori Mincho B1 - SIL OFL 1.1, already subset in src/app/fonts

Run: python3 scripts/build-og-fonts.py
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'app' / 'og'
SKILL_FONTS = pathlib.Path(
    '/mnt/skills/examples/canvas-design/canvas-fonts'
)

# Latin text on the cards: names, titles, subtitles, the URL, the meta row.
LATIN = (
    'U+0020-007E,U+00A0,U+00B7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026'
)
# The only kanji the cards set: the 剣/杖 pair and the episode slates 第壱話 /
# 第弐話. Anything else would ship glyphs no card can reach.
KANJI = '剣杖第壱弐話'


def subset(src: pathlib.Path, dst: pathlib.Path, **kw) -> None:
    args = [
        sys.executable, '-m', 'fontTools.subset', str(src),
        f'--output-file={dst}', '--flavor=', '--no-hinting',
        '--layout-features=kern,liga', '--drop-tables+=DSIG',
        '--name-IDs=*', '--notdef-outline',
    ]
    args = [a for a in args if a != '--flavor=']
    if 'unicodes' in kw:
        args.append(f"--unicodes={kw['unicodes']}")
    if 'text' in kw:
        args.append(f"--text={kw['text']}")
    subprocess.run(args, check=True)
    # pyftsubset keeps the input's flavour, so a woff2 source would emit woff2 -
    # which satori refuses outright. Force every output back to plain TTF.
    from fontTools.ttLib import TTFont
    f = TTFont(dst)
    if f.flavor:
        f.flavor = None
        f.save(dst)
    print(f'{dst.name}: {dst.stat().st_size / 1024:.1f} KB')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    subset(SKILL_FONTS / 'BricolageGrotesque-Bold.ttf',
           OUT / 'Bricolage-Bold.ttf', unicodes=LATIN)
    subset(SKILL_FONTS / 'InstrumentSerif-Italic.ttf',
           OUT / 'InstrumentSerif-Italic.ttf', unicodes=LATIN)
    # The Mincho in the repo is already a woff2 subset; decompressing it here
    # means the cards and the page share one source of truth for the kanji.
    subset(ROOT / 'src' / 'app' / 'fonts' / 'ShipporiMinchoB1-800-subset.woff2',
           OUT / 'Mincho-Kanji.ttf', text=KANJI)


if __name__ == '__main__':
    main()
