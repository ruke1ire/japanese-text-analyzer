from sqlalchemy.orm import Session
from typing import Optional
from collections import defaultdict
from app.models import Word, WordMeaning
from app.schemas import WordResponse, WordMeaningDetail


class DictionaryService:
    """Service for looking up word definitions"""

    @staticmethod
    def lookup_word(db: Session, word: str) -> Optional[WordResponse]:
        """
        Look up word in dictionary

        Args:
            db: Database session
            word: Japanese word to look up (can be kanji or kana)

        Returns:
            WordResponse with meanings and metadata, or None if not found
        """
        # Try exact match first
        word_entry = db.query(Word).filter(Word.word == word).first()

        # If not found, try by reading
        if not word_entry:
            word_entry = db.query(Word).filter(Word.reading == word).first()

        if not word_entry:
            return None

        # Group meanings by part of speech
        meanings_by_pos = defaultdict(list)
        for meaning in word_entry.meanings:
            meanings_by_pos[meaning.pos].append(meaning.gloss)

        # Convert to response format
        meaning_details = [
            WordMeaningDetail(pos=pos, definitions=defs)
            for pos, defs in meanings_by_pos.items()
        ]

        return WordResponse(
            word=word_entry.word,
            reading=word_entry.reading,
            meanings=meaning_details,
            is_common=word_entry.is_common,
            jlpt_level=word_entry.jlpt_level,
            frequency=word_entry.frequency
        )

    @staticmethod
    def get_word_count(db: Session) -> int:
        """Get total number of words in database"""
        return db.query(Word).count()
