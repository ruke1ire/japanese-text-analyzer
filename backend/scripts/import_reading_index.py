#!/usr/bin/env python3
"""
Build the kanji reading index (kanji_reading_index) for browsing kanji by
reading in gojūon (あいうえお) order.

For every kanji it reads the on/kun readings already imported by
import_kanjidic, normalizes them to hiragana (app.utils.kana), and stores:
  - one row per distinct normalized reading, tagged with its gojūon row, so the
    browser can filter "kanji with a reading in the か-row";
  - `is_primary` on the single reading used as the sort key when ordering by
    reading (first on-reading, else first kun-reading).

Idempotent: skips if the index already has rows (mirrors import_radicals /
import_examples).
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Kanji, KanjiReading, KanjiReadingIndex
from app.utils.kana import normalize_reading, gojuon_row


def import_reading_index():
    """Build the kanji -> reading (gojūon) index."""
    db = SessionLocal()

    try:
        existing_count = db.query(KanjiReadingIndex).count()
        if existing_count > 0:
            print(f"  Reading index already has {existing_count} rows. Skipping import.")
            return

        # Pull every (kanji, reading_type, reading) in one query and group in
        # Python — cheaper than lazy-loading .readings per kanji (~13k queries).
        rows = (
            db.query(Kanji.character, KanjiReading.reading_type, KanjiReading.reading)
            .join(KanjiReading, KanjiReading.kanji_id == Kanji.id)
            .all()
        )
        if not rows:
            print("  No kanji readings in database; skipping reading index.")
            return

        # kanji_char -> {"on": [...], "kun": [...]} preserving insertion order.
        by_kanji = {}
        for char, rtype, reading in rows:
            if rtype not in ("on", "kun"):
                continue  # nanori (name) readings are not useful for browsing
            by_kanji.setdefault(char, {"on": [], "kun": []})[rtype].append(reading)

        batch = []
        batch_size = 5000
        total = 0

        def flush():
            nonlocal total
            if not batch:
                return
            db.bulk_save_objects(batch)
            db.commit()
            total += len(batch)
            batch.clear()

        for char, groups in by_kanji.items():
            ordered = groups["on"] + groups["kun"]
            # Primary sort reading: first on-reading, else first kun-reading.
            primary_norm = normalize_reading(ordered[0]) if ordered else ""

            seen = set()
            marked_primary = False
            for raw in ordered:
                norm = normalize_reading(raw)
                row = gojuon_row(raw)
                if not norm or not row or norm in seen:
                    continue
                seen.add(norm)
                is_primary = (not marked_primary) and (norm == primary_norm)
                if is_primary:
                    marked_primary = True
                batch.append(KanjiReadingIndex(
                    kanji_char=char,
                    reading=norm,
                    row=row,
                    is_primary=is_primary,
                ))
            if len(batch) >= batch_size:
                flush()

        flush()
        print(f"✓ Built kanji reading index with {total} rows "
              f"across {len(by_kanji)} kanji")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import_reading_index()
