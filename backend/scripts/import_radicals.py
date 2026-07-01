#!/usr/bin/env python3
"""
Import KRADFILE-u (kradfile-u.gz) radical decomposition into SQLite.

KRADFILE-u lists, for each kanji, the component radicals it is built from:
  亜 : 一 口 亅
  親 : 立 木 見

This importer builds two tables:
  - radicals: one row per distinct component glyph, enriched with name/meaning/
    strokes/kangxi_number from the static table in app.data.radicals (glyphs not
    in that table are stored with the glyph only).
  - kanji_radical_index: (kanji_char, radical_char) rows, restricted to kanji that
    exist in the kanji table. Read in reverse it answers "which kanji use this
    radical".
"""

import gzip
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import KRADFILE_PATH
from app.database import SessionLocal
from app.models import Kanji, Radical, KanjiRadicalIndex
from app.data.radicals import all_radicals


def _parse_kradfile():
    """Yield (kanji_char, [component_glyphs]) for each entry in KRADFILE-u."""
    with gzip.open(KRADFILE_PATH, 'rt', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ' : ' not in line:
                continue
            kanji, rest = line.split(' : ', 1)
            kanji = kanji.strip()
            if len(kanji) != 1:
                continue
            components = rest.split()
            if components:
                yield kanji, components


def import_radicals():
    """Import radical metadata and build the kanji <-> radical index."""
    if not KRADFILE_PATH.exists():
        raise FileNotFoundError(f"KRADFILE not found: {KRADFILE_PATH}")

    db = SessionLocal()

    try:
        existing_count = db.query(KanjiRadicalIndex).count()
        if existing_count > 0:
            print(f"  Kanji-radical index already has {existing_count} rows. Skipping import.")
            return

        kanji_set = {c for (c,) in db.query(Kanji.character).all()}
        if not kanji_set:
            print("  No kanji in database; skipping radical import.")
            return

        print(f"  Parsing {KRADFILE_PATH}...")

        # First pass: collect every distinct component glyph used by KRADFILE.
        all_components = set()
        entries = []
        for kanji, components in _parse_kradfile():
            entries.append((kanji, components))
            all_components.update(components)

        # Build the radicals table: the static-table glyphs (with full metadata)
        # plus any KRADFILE component not covered there (glyph only).
        if db.query(Radical).count() == 0:
            radical_rows = []
            seen = set()
            for glyph, meta in all_radicals():
                seen.add(glyph)
                radical_rows.append(Radical(
                    character=glyph,
                    meaning=meta["meaning"],
                    reading=meta["reading"],
                    strokes=meta["strokes"],
                    kangxi_number=meta["kangxi_number"],
                ))
            for glyph in all_components - seen:
                radical_rows.append(Radical(character=glyph))
            db.bulk_save_objects(radical_rows)
            db.commit()
            print(f"  Stored {len(radical_rows)} radicals "
                  f"({len(all_components - seen)} without a known name).")

        # Second pass: build the kanji -> radical index for kanji we have.
        batch = []
        batch_size = 5000
        total_rows = 0
        for kanji, components in entries:
            if kanji not in kanji_set:
                continue
            for comp in set(components):
                batch.append(KanjiRadicalIndex(kanji_char=kanji, radical_char=comp))
            if len(batch) >= batch_size:
                db.bulk_save_objects(batch)
                db.commit()
                total_rows += len(batch)
                batch = []

        if batch:
            db.bulk_save_objects(batch)
            db.commit()
            total_rows += len(batch)

        print(f"✓ Built kanji-radical index with {total_rows} rows")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import_radicals()
