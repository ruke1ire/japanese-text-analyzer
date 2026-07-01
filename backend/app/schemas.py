from pydantic import BaseModel
from typing import List, Optional


# Request/Response schemas for API

class AnalyzeRequest(BaseModel):
    text: str


class Token(BaseModel):
    surface: str
    reading: str
    base_form: str
    pos: str
    pos_detail: Optional[str] = None
    start: int
    end: int


class AnalyzeResponse(BaseModel):
    tokens: List[Token]


class WordMeaningDetail(BaseModel):
    pos: str
    definitions: List[str]


class WordResponse(BaseModel):
    word: str
    reading: str
    meanings: List[WordMeaningDetail]
    is_common: bool
    jlpt_level: Optional[int] = None
    frequency: Optional[int] = None


class KanjiReadings(BaseModel):
    on: List[str] = []
    kun: List[str] = []
    nanori: List[str] = []


class KanjiResponse(BaseModel):
    character: str
    meanings: List[str]
    readings: KanjiReadings
    stroke_count: Optional[int] = None
    grade: Optional[int] = None
    jlpt_level: Optional[int] = None
    radical: Optional[str] = None  # classical radical number (KANJIDIC2)
    radical_character: Optional[str] = None  # glyph of the classical radical
    radical_meaning: Optional[str] = None  # English meaning of the classical radical
    frequency: Optional[int] = None


class KanjiVocabItem(BaseModel):
    word: str
    reading: str
    is_common: bool
    meanings: List[str]


class KanjiVocabularyResponse(BaseModel):
    character: str
    words: List[KanjiVocabItem]


class ExampleSentenceItem(BaseModel):
    japanese: str
    english: str


class KanjiExamplesResponse(BaseModel):
    character: str
    examples: List[ExampleSentenceItem]


class RadicalItem(BaseModel):
    character: str
    meaning: Optional[str] = None
    reading: Optional[str] = None
    strokes: Optional[int] = None


class KanjiRadicalsResponse(BaseModel):
    character: str
    radicals: List[RadicalItem]


class RadicalKanjiItem(BaseModel):
    character: str
    meanings: List[str]


class RadicalDetailResponse(BaseModel):
    character: str
    meaning: Optional[str] = None
    reading: Optional[str] = None
    strokes: Optional[int] = None
    kangxi_number: Optional[int] = None
    kanji: List[RadicalKanjiItem]


class TranslateRequest(BaseModel):
    text: str
    source: str = "ja"
    target: str = "en"
    method: Optional[str] = None  # none, deepl, llamacpp (if None, uses config default)


class TranslateResponse(BaseModel):
    original: str
    translation: Optional[str]
    method: str  # none|deepl|local


class HealthResponse(BaseModel):
    status: str
    database: str
    word_count: int
    kanji_count: int
