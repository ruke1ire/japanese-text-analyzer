from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.models import (
    Kanji, KanjiReading, KanjiMeaning,
    Word, KanjiWordIndex, ExampleSentence, KanjiExampleIndex,
)
from app.schemas import (
    KanjiResponse, KanjiReadings,
    KanjiVocabItem, KanjiVocabularyResponse,
    ExampleSentenceItem, KanjiExamplesResponse,
)


class KanjiService:
    """Service for looking up kanji information"""

    @staticmethod
    def lookup_kanji(db: Session, character: str) -> Optional[KanjiResponse]:
        """
        Look up kanji character information

        Args:
            db: Database session
            character: Single kanji character

        Returns:
            KanjiResponse with readings and meanings, or None if not found
        """
        kanji_entry = db.query(Kanji).filter(Kanji.character == character).first()

        if not kanji_entry:
            return None

        # Group readings by type
        readings = KanjiReadings()
        for reading in kanji_entry.readings:
            if reading.reading_type == "on":
                readings.on.append(reading.reading)
            elif reading.reading_type == "kun":
                readings.kun.append(reading.reading)
            elif reading.reading_type == "nanori":
                readings.nanori.append(reading.reading)

        # Extract meanings
        meanings = [m.meaning for m in kanji_entry.meanings]

        return KanjiResponse(
            character=kanji_entry.character,
            meanings=meanings,
            readings=readings,
            stroke_count=kanji_entry.stroke_count,
            grade=kanji_entry.grade,
            jlpt_level=kanji_entry.jlpt_level,
            radical=kanji_entry.radical,
            frequency=kanji_entry.frequency
        )

    @staticmethod
    def get_vocabulary(db: Session, character: str, limit: int = 20) -> KanjiVocabularyResponse:
        """
        Get vocabulary words that contain the given kanji.

        Ordered most-useful-first: common words before uncommon, then shorter
        words (which tend to be more basic) before longer ones.
        """
        words = (
            db.query(Word)
            .join(KanjiWordIndex, KanjiWordIndex.word_id == Word.id)
            .filter(KanjiWordIndex.kanji_char == character)
            .order_by(
                Word.is_common.desc(),
                func.length(Word.word).asc(),
                Word.id.asc(),
            )
            .limit(limit)
            .all()
        )

        items = []
        for w in words:
            # Take the first few glosses across senses as a short meaning summary
            meanings = [m.gloss for m in w.meanings][:5]
            items.append(KanjiVocabItem(
                word=w.word,
                reading=w.reading,
                is_common=w.is_common,
                meanings=meanings,
            ))

        return KanjiVocabularyResponse(character=character, words=items)

    @staticmethod
    def get_examples(db: Session, character: str, limit: int = 6) -> KanjiExamplesResponse:
        """
        Get example sentences that contain the given kanji.

        Ranked shortest-first (most digestible) with a small length floor to
        drop fragments.
        """
        sentences = (
            db.query(ExampleSentence)
            .join(KanjiExampleIndex, KanjiExampleIndex.sentence_id == ExampleSentence.id)
            .filter(
                KanjiExampleIndex.kanji_char == character,
                ExampleSentence.length >= 6,
            )
            .order_by(
                ExampleSentence.length.asc(),
                ExampleSentence.id.asc(),
            )
            .limit(limit)
            .all()
        )

        examples = [
            ExampleSentenceItem(japanese=s.japanese, english=s.english)
            for s in sentences
        ]

        return KanjiExamplesResponse(character=character, examples=examples)

    @staticmethod
    def get_kanji_count(db: Session) -> int:
        """Get total number of kanji in database"""
        return db.query(Kanji).count()
