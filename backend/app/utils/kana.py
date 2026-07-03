"""
Kana normalization utilities — the single authority for katakana↔hiragana
conversion and gojūon (あいうえお) row derivation.

Nothing else in the codebase should parse kana directly; import from here.
"""

# Gojūon rows. Each row lists every kana that folds onto it — voiced (dakuten),
# semi-voiced (handakuten) and small kana all collapse onto their base row so
# that が→か, ぴ→は, ゃ→や, ぁ→あ, ゔ→あ, etc.
_ROWS = {
    "あ": "あいうえおぁぃぅぇぉゔ",
    "か": "かきくけこがぎぐげごゕゖ",
    "さ": "さしすせそざじずぜぞ",
    "た": "たちつてとだぢづでどっ",
    "な": "なにぬねの",
    "は": "はひふへほばびぶべぼぱぴぷぺぽ",
    "ま": "まみむめも",
    "や": "やゆよゃゅょ",
    "ら": "らりるれろ",
    "わ": "わゐゑをゎ",
    "ん": "ん",
}

# Reverse lookup: individual hiragana → its row representative.
_KANA_TO_ROW = {kana: row for row, members in _ROWS.items() for kana in members}

# The rows in canonical gojūon order, for building UI selectors.
GOJUON_ROWS = list(_ROWS.keys())


def to_hiragana(text: str) -> str:
    """Convert any katakana in `text` to hiragana. Leaves other chars intact."""
    out = []
    for ch in text:
        code = ord(ch)
        # Katakana block U+30A1–U+30F6 maps to hiragana by subtracting 0x60.
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def normalize_reading(reading: str) -> str:
    """Normalize a KANJIDIC reading to plain hiragana for indexing/sorting.

    Katakana on-readings become hiragana; the okurigana separator in kun
    readings (e.g. ``かた.る`` → ``かたる``) and the ``-`` prefix/suffix markers
    (e.g. ``-がわ``) are stripped.
    """
    reading = to_hiragana(reading)
    return reading.replace(".", "").replace("-", "").strip()


def gojuon_row(reading: str):
    """Return the gojūon row char (one of GOJUON_ROWS) for a reading's first
    mora, or None if it doesn't begin with a recognizable kana."""
    normalized = normalize_reading(reading)
    if not normalized:
        return None
    return _KANA_TO_ROW.get(normalized[0])
