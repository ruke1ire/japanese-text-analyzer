from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    WordResponse, KanjiResponse,
    TranslateRequest, TranslateResponse,
    HealthResponse
)
from app.services.analyzer import get_analyzer
from app.services.dictionary import DictionaryService
from app.services.kanji import KanjiService
from app.services.translator import get_translator

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    Analyze Japanese text and return tokens with readings and POS

    - **text**: Japanese text to analyze
    """
    analyzer = get_analyzer()
    tokens = analyzer.analyze(request.text)
    return AnalyzeResponse(tokens=tokens)


@router.get("/word/{word}", response_model=WordResponse)
async def get_word_definition(word: str, db: Session = Depends(get_db)):
    """
    Get word definition and information

    - **word**: Japanese word (kanji or kana)
    """
    result = DictionaryService.lookup_word(db, word)
    if not result:
        raise HTTPException(status_code=404, detail=f"Word not found: {word}")
    return result


@router.get("/kanji/{character}", response_model=KanjiResponse)
async def get_kanji_info(character: str, db: Session = Depends(get_db)):
    """
    Get kanji character information

    - **character**: Single kanji character
    """
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="Please provide a single kanji character")

    result = KanjiService.lookup_kanji(db, character)
    if not result:
        raise HTTPException(status_code=404, detail=f"Kanji not found: {character}")
    return result


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate Japanese text to English

    - **text**: Japanese text to translate
    - **source**: Source language (default: ja)
    - **target**: Target language (default: en)
    - **method**: Translation method (none, deepl, llamacpp) - optional, uses config default if not specified
    """
    translator = get_translator(method=request.method)
    return translator.translate(request.text, request.source, request.target)


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint with database statistics"""
    try:
        word_count = DictionaryService.get_word_count(db)
        kanji_count = KanjiService.get_kanji_count(db)
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        word_count = 0
        kanji_count = 0

    return HealthResponse(
        status="ok",
        database=db_status,
        word_count=word_count,
        kanji_count=kanji_count
    )
