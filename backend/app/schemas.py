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
    radical: Optional[str] = None
    frequency: Optional[int] = None


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
