from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    WordResponse, KanjiResponse,
    KanjiVocabularyResponse, KanjiExamplesResponse,
    KanjiRadicalsResponse, RadicalDetailResponse,
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


@router.get("/kanji/{character}/vocabulary", response_model=KanjiVocabularyResponse)
async def get_kanji_vocabulary(character: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Get vocabulary words that contain this kanji

    - **character**: Single kanji character
    - **limit**: Max number of words to return (default 20)
    """
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="Please provide a single kanji character")

    return KanjiService.get_vocabulary(db, character, limit=limit)


@router.get("/kanji/{character}/examples", response_model=KanjiExamplesResponse)
async def get_kanji_examples(character: str, limit: int = 6, db: Session = Depends(get_db)):
    """
    Get example sentences that contain this kanji

    - **character**: Single kanji character
    - **limit**: Max number of sentences to return (default 6)
    """
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="Please provide a single kanji character")

    return KanjiService.get_examples(db, character, limit=limit)


@router.get("/kanji/{character}/radicals", response_model=KanjiRadicalsResponse)
async def get_kanji_radicals(character: str, db: Session = Depends(get_db)):
    """
    Get the component radicals that make up this kanji

    - **character**: Single kanji character
    """
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="Please provide a single kanji character")

    return KanjiService.get_radicals(db, character)


@router.get("/radical/{character}", response_model=RadicalDetailResponse)
async def get_radical_detail(character: str, limit: int = 30, db: Session = Depends(get_db)):
    """
    Get a radical's detail and the other kanji that use it

    - **character**: Single radical glyph
    - **limit**: Max number of related kanji to return (default 30)
    """
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="Please provide a single radical character")

    result = KanjiService.get_radical_detail(db, character, limit=limit)
    if not result:
        raise HTTPException(status_code=404, detail=f"Radical not found: {character}")
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
