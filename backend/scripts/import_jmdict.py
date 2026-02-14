#!/usr/bin/env python3
"""
Import JMdict dictionary data into SQLite database
"""

import gzip
import xml.etree.ElementTree as ET
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import JMDICT_PATH, DATABASE_PATH
from app.database import SessionLocal
from app.models import Word, WordMeaning


def import_jmdict():
    """Import JMdict XML data into database"""
    if not JMDICT_PATH.exists():
        raise FileNotFoundError(f"JMdict file not found: {JMDICT_PATH}")

    db = SessionLocal()

    try:
        # Check if already imported
        existing_count = db.query(Word).count()
        if existing_count > 0:
            print(f"  Database already has {existing_count} words. Skipping import.")
            return

        print(f"  Parsing {JMDICT_PATH}...")

        # Parse XML (it's gzipped)
        with gzip.open(JMDICT_PATH, 'rb') as f:
            tree = ET.parse(f)
            root = tree.getroot()

        entries = root.findall('entry')
        total = len(entries)
        print(f"  Found {total} entries")

        batch_size = 1000
        batch = []

        for idx, entry in enumerate(entries, 1):
            # Extract entry ID
            ent_seq = entry.find('ent_seq')
            if ent_seq is None:
                continue

            entry_id = int(ent_seq.text)

            # Extract kanji writings
            k_ele = entry.find('k_ele')
            kanji_word = k_ele.find('keb').text if k_ele is not None else None

            # Extract reading (kana)
            r_ele = entry.find('r_ele')
            if r_ele is None:
                continue

            reading = r_ele.find('reb').text

            # Use kanji if available, otherwise use reading
            word_text = kanji_word if kanji_word else reading

            # Check if common word (has news1/ichi1/spec1 priority)
            is_common = False
            if k_ele is not None:
                ke_pri = k_ele.findall('ke_pri')
                is_common = any(p.text in ['news1', 'ichi1', 'spec1', 'gai1'] for p in ke_pri)
            if not is_common and r_ele is not None:
                re_pri = r_ele.findall('re_pri')
                is_common = any(p.text in ['news1', 'ichi1', 'spec1', 'gai1'] for p in re_pri)

            # Create Word object
            word = Word(
                word_id=entry_id,
                word=word_text,
                reading=reading,
                is_common=is_common
            )

            # Extract senses (meanings)
            meanings = []
            for sense_idx, sense in enumerate(entry.findall('sense'), 1):
                # Get part of speech
                pos_list = sense.findall('pos')
                pos = pos_list[0].text if pos_list else "unknown"
                # Simplify POS
                pos = pos.replace('&', '').replace(';', '').split('-')[0]

                # Get glosses (definitions)
                glosses = sense.findall('gloss')
                for gloss in glosses:
                    if gloss.text:
                        meaning = WordMeaning(
                            pos=pos,
                            gloss=gloss.text,
                            sense_order=sense_idx
                        )
                        meanings.append(meaning)

            # Add meanings to word
            word.meanings = meanings

            # Add to batch
            batch.append(word)

            # Commit batch
            if len(batch) >= batch_size:
                db.add_all(batch)
                db.commit()
                print(f"  Imported {idx}/{total} entries ({idx*100//total}%)")
                batch = []

        # Commit remaining
        if batch:
            db.add_all(batch)
            db.commit()

        final_count = db.query(Word).count()
        print(f"✓ Imported {final_count} words from JMdict")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import_jmdict()
