import fugashi
from typing import List
from app.schemas import Token


def katakana_to_hiragana(text: str) -> str:
    """Convert katakana to hiragana"""
    result = []
    for char in text:
        code = ord(char)
        # Katakana range: 0x30A1 to 0x30F6
        # Hiragana range: 0x3041 to 0x3096
        # Offset: -96 (0x60)
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(char)
    return ''.join(result)


class TextAnalyzer:
    """Japanese text analyzer using MeCab via fugashi"""

    def __init__(self):
        try:
            self.tagger = fugashi.Tagger()
        except Exception as e:
            raise RuntimeError(f"Failed to initialize MeCab tagger: {e}")

    def analyze(self, text: str) -> List[Token]:
        """
        Analyze Japanese text and return tokens with readings and POS

        Args:
            text: Japanese text to analyze

        Returns:
            List of Token objects with surface form, reading, base form, and POS
        """
        if not text or not text.strip():
            return []

        tokens = []
        position = 0

        for word in self.tagger(text):
            # Extract reading (furigana)
            # fugashi provides kana reading in feature.kana (katakana)
            # Convert to hiragana for furigana display
            reading = word.feature.kana if hasattr(word.feature, 'kana') and word.feature.kana else word.surface
            reading = katakana_to_hiragana(reading)

            # Extract base form (lemma)
            base_form = word.feature.lemma if hasattr(word.feature, 'lemma') and word.feature.lemma else word.surface

            # Extract part of speech
            pos = word.feature.pos1 if hasattr(word.feature, 'pos1') else "unknown"
            pos_detail = word.feature.pos2 if hasattr(word.feature, 'pos2') else None

            # Calculate character positions by finding surface in text
            start = text.find(word.surface, position)
            if start == -1:
                # If not found, use current position (shouldn't happen)
                start = position
            end = start + len(word.surface)
            position = end

            tokens.append(Token(
                surface=word.surface,
                reading=reading,
                base_form=base_form,
                pos=pos,
                pos_detail=pos_detail,
                start=start,
                end=end
            ))

        return tokens


# Singleton instance
_analyzer_instance = None


def get_analyzer() -> TextAnalyzer:
    """Get or create singleton TextAnalyzer instance"""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = TextAnalyzer()
    return _analyzer_instance
