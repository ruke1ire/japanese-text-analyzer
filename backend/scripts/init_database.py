#!/usr/bin/env python3
"""
Initialize the Japanese Analyzer database

This script:
1. Downloads dictionary files if not present
2. Creates database schema
3. Imports JMdict and KANJIDIC data
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import DB_DIR, DICT_DIR, JMDICT_PATH, KANJIDIC_PATH
from app.database import init_db, engine
from import_jmdict import import_jmdict
from import_kanjidic import import_kanjidic
import urllib.request


def download_file(url: str, dest: Path, desc: str):
    """Download file with progress indicator"""
    if dest.exists():
        print(f"✓ {desc} already exists: {dest}")
        return

    print(f"Downloading {desc}...")
    print(f"  URL: {url}")
    print(f"  Destination: {dest}")

    try:
        urllib.request.urlretrieve(url, dest)
        print(f"✓ Downloaded {desc}")
    except Exception as e:
        print(f"✗ Failed to download {desc}: {e}")
        raise


def main():
    print("=" * 60)
    print("Japanese Text Analyzer - Database Initialization")
    print("=" * 60)

    # Create directories
    print("\n1. Creating directories...")
    DB_DIR.mkdir(parents=True, exist_ok=True)
    DICT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Database directory: {DB_DIR}")
    print(f"✓ Dictionary directory: {DICT_DIR}")

    # Download dictionary files
    print("\n2. Downloading dictionary files...")

    JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"
    KANJIDIC_URL = "http://www.edrdg.org/kanjidic/kanjidic2.xml.gz"

    download_file(JMDICT_URL, JMDICT_PATH, "JMdict")
    download_file(KANJIDIC_URL, KANJIDIC_PATH.with_suffix('.xml.gz'), "KANJIDIC2")

    # Decompress KANJIDIC if needed
    if KANJIDIC_PATH.with_suffix('.xml.gz').exists() and not KANJIDIC_PATH.exists():
        print("Decompressing KANJIDIC2...")
        import gzip
        import shutil
        with gzip.open(KANJIDIC_PATH.with_suffix('.xml.gz'), 'rb') as f_in:
            with open(KANJIDIC_PATH, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        print("✓ Decompressed KANJIDIC2")

    # Create database schema
    print("\n3. Creating database schema...")
    init_db()
    print("✓ Database schema created")

    # Import data
    print("\n4. Importing JMdict...")
    import_jmdict()

    print("\n5. Importing KANJIDIC...")
    import_kanjidic()

    print("\n" + "=" * 60)
    print("Database initialization complete!")
    print("=" * 60)
    print(f"\nDatabase location: {DB_DIR / 'japanese_analyzer.db'}")
    print("\nYou can now start the application:")
    print("  uvicorn app.main:app --reload")
    print("\nOr use Docker:")
    print("  docker-compose up")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
