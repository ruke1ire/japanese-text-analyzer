from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer, unique=True, nullable=False, index=True)
    word = Column(String, nullable=False, index=True)
    reading = Column(String, nullable=False, index=True)
    is_common = Column(Boolean, default=False, index=True)
    jlpt_level = Column(Integer, nullable=True)
    frequency = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    meanings = relationship("WordMeaning", back_populates="word", cascade="all, delete-orphan")


class WordMeaning(Base):
    __tablename__ = "word_meanings"

    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False, index=True)
    pos = Column(String, nullable=False)  # Part of speech
    gloss = Column(String, nullable=False)  # English definition
    sense_order = Column(Integer, default=1)

    word = relationship("Word", back_populates="meanings")


class Kanji(Base):
    __tablename__ = "kanji"

    id = Column(Integer, primary_key=True, index=True)
    character = Column(String, unique=True, nullable=False, index=True)
    radical = Column(String, nullable=True)
    stroke_count = Column(Integer, nullable=True)
    grade = Column(Integer, nullable=True)
    jlpt_level = Column(Integer, nullable=True)
    frequency = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    readings = relationship("KanjiReading", back_populates="kanji", cascade="all, delete-orphan")
    meanings = relationship("KanjiMeaning", back_populates="kanji", cascade="all, delete-orphan")


class KanjiReading(Base):
    __tablename__ = "kanji_readings"

    id = Column(Integer, primary_key=True, index=True)
    kanji_id = Column(Integer, ForeignKey("kanji.id", ondelete="CASCADE"), nullable=False, index=True)
    reading_type = Column(String, nullable=False)  # on, kun, nanori
    reading = Column(String, nullable=False)

    kanji = relationship("Kanji", back_populates="readings")


class KanjiMeaning(Base):
    __tablename__ = "kanji_meanings"

    id = Column(Integer, primary_key=True, index=True)
    kanji_id = Column(Integer, ForeignKey("kanji.id", ondelete="CASCADE"), nullable=False, index=True)
    meaning = Column(String, nullable=False)
    meaning_order = Column(Integer, default=1)

    kanji = relationship("Kanji", back_populates="meanings")
