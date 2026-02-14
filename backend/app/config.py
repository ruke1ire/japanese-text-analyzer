import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data"
DICT_DIR = DATA_DIR / "dictionaries"
DB_DIR = DATA_DIR / "database"

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", str(DB_DIR / "japanese_analyzer.db"))
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Translation settings
TRANSLATION_METHOD = os.getenv("TRANSLATION_METHOD", "none")  # none|deepl|local
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY", "")

# Dictionary file paths
JMDICT_PATH = DICT_DIR / "JMdict_e.gz"
KANJIDIC_PATH = DICT_DIR / "kanjidic2.xml"

# API settings
API_TITLE = "Japanese Text Analyzer API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Local Japanese text analysis with furigana, definitions, and kanji breakdown"

# CORS settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
