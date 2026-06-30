#!/usr/bin/env python3
"""
Import Tanaka/Tatoeba example sentences (examples.utf.gz) into SQLite database.

The file has two lines per entry:
  A: 日本語の文。<TAB>The English sentence.#ID=xxxx_yyyy
  B: 日本語{にほんご} の 文(ぶん)

Only the A line is used. Each sentence is linked to every distinct kanji
character it contains (restricted to characters present in the kanji table).
"""

import gzip
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import EXAMPLES_PATH
from app.database import SessionLocal
from app.models import Kanji, ExampleSentence, KanjiExampleIndex


def import_examples():
    """Import example sentences and build the kanji -> sentence index."""
    if not EXAMPLES_PATH.exists():
        raise FileNotFoundError(f"Examples file not found: {EXAMPLES_PATH}")

    db = SessionLocal()

    try:
        # Check if already imported
        existing_count = db.query(ExampleSentence).count()
        if existing_count > 0:
            print(f"  Database already has {existing_count} example sentences. Skipping import.")
            return

        kanji_set = {c for (c,) in db.query(Kanji.character).all()}
        if not kanji_set:
            print("  No kanji in database; skipping example sentence import.")
            return

        print(f"  Parsing {EXAMPLES_PATH}...")

        batch_size = 1000
        # pending holds (ExampleSentence, set_of_kanji_chars)
        pending = []
        total_sentences = 0
        total_index_rows = 0

        def flush():
            nonlocal total_sentences, total_index_rows
            if not pending:
                return
            db.add_all([s for s, _ in pending])
            db.flush()  # populates s.id without committing
            index_rows = [
                KanjiExampleIndex(kanji_char=ch, sentence_id=s.id)
                for s, chars in pending
                for ch in chars
            ]
            if index_rows:
                db.bulk_save_objects(index_rows)
            db.commit()
            total_sentences += len(pending)
            total_index_rows += len(index_rows)
            pending.clear()

        with gzip.open(EXAMPLES_PATH, 'rt', encoding='utf-8') as f:
            for line in f:
                if not line.startswith('A: '):
                    continue

                jp, _, rest = line[3:].rstrip('\n').partition('\t')
                en = rest.split('#ID=')[0].strip()
                jp = jp.strip()

                if not jp or not en:
                    continue

                chars = {ch for ch in set(jp) if ch in kanji_set}
                pending.append((
                    ExampleSentence(japanese=jp, english=en, length=len(jp)),
                    chars,
                ))

                if len(pending) >= batch_size:
                    flush()
                    print(f"  Imported {total_sentences} sentences...")

        flush()

        print(f"✓ Imported {total_sentences} example sentences "
              f"and {total_index_rows} kanji-example index rows")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import_examples()
