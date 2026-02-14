#!/usr/bin/env python3
"""
Import KANJIDIC2 dictionary data into SQLite database
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import KANJIDIC_PATH
from app.database import SessionLocal
from app.models import Kanji, KanjiReading, KanjiMeaning


def import_kanjidic():
    """Import KANJIDIC2 XML data into database"""
    if not KANJIDIC_PATH.exists():
        raise FileNotFoundError(f"KANJIDIC file not found: {KANJIDIC_PATH}")

    db = SessionLocal()

    try:
        # Check if already imported
        existing_count = db.query(Kanji).count()
        if existing_count > 0:
            print(f"  Database already has {existing_count} kanji. Skipping import.")
            return

        print(f"  Parsing {KANJIDIC_PATH}...")

        tree = ET.parse(KANJIDIC_PATH)
        root = tree.getroot()

        characters = root.findall('character')
        total = len(characters)
        print(f"  Found {total} kanji")

        batch_size = 500
        batch = []

        for idx, char_elem in enumerate(characters, 1):
            # Extract literal character
            literal = char_elem.find('literal')
            if literal is None:
                continue

            character = literal.text

            # Extract stroke count
            misc = char_elem.find('misc')
            stroke_count = None
            grade = None
            freq = None
            jlpt = None

            if misc is not None:
                sc = misc.find('stroke_count')
                if sc is not None:
                    stroke_count = int(sc.text)

                gr = misc.find('grade')
                if gr is not None:
                    grade = int(gr.text)

                fr = misc.find('freq')
                if fr is not None:
                    freq = int(fr.text)

                jl = misc.find('jlpt')
                if jl is not None:
                    jlpt = int(jl.text)

            # Extract radical
            rad_elem = char_elem.find('.//radical/rad_value[@rad_type="classical"]')
            radical = rad_elem.text if rad_elem is not None else None

            # Create Kanji object
            kanji = Kanji(
                character=character,
                radical=radical,
                stroke_count=stroke_count,
                grade=grade,
                jlpt_level=jlpt,
                frequency=freq
            )

            # Extract readings
            readings = []
            reading_meaning = char_elem.find('reading_meaning')
            if reading_meaning is not None:
                rmgroup = reading_meaning.find('rmgroup')
                if rmgroup is not None:
                    for reading_elem in rmgroup.findall('reading'):
                        r_type = reading_elem.get('r_type')
                        reading_text = reading_elem.text

                        if r_type == 'ja_on':
                            readings.append(KanjiReading(reading_type='on', reading=reading_text))
                        elif r_type == 'ja_kun':
                            readings.append(KanjiReading(reading_type='kun', reading=reading_text))
                        elif r_type == 'nanori':
                            readings.append(KanjiReading(reading_type='nanori', reading=reading_text))

            kanji.readings = readings

            # Extract meanings
            meanings = []
            if reading_meaning is not None:
                rmgroup = reading_meaning.find('rmgroup')
                if rmgroup is not None:
                    for meaning_idx, meaning_elem in enumerate(rmgroup.findall('meaning'), 1):
                        # Only English meanings (no m_lang attribute)
                        if meaning_elem.get('m_lang') is None and meaning_elem.text:
                            meanings.append(KanjiMeaning(
                                meaning=meaning_elem.text,
                                meaning_order=meaning_idx
                            ))

            kanji.meanings = meanings

            # Add to batch
            batch.append(kanji)

            # Commit batch
            if len(batch) >= batch_size:
                db.add_all(batch)
                db.commit()
                print(f"  Imported {idx}/{total} kanji ({idx*100//total}%)")
                batch = []

        # Commit remaining
        if batch:
            db.add_all(batch)
            db.commit()

        final_count = db.query(Kanji).count()
        print(f"✓ Imported {final_count} kanji from KANJIDIC")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import_kanjidic()
