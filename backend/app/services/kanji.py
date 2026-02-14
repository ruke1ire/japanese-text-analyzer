from sqlalchemy.orm import Session
from typing import Optional
from app.models import Kanji, KanjiReading, KanjiMeaning
from app.schemas import KanjiResponse, KanjiReadings


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
    def get_kanji_count(db: Session) -> int:
        """Get total number of kanji in database"""
        return db.query(Kanji).count()
