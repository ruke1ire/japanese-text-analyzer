import random
from dataclasses import dataclass, field
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_, select
from typing import List, Optional
from app.models import (
    Kanji, KanjiReading, KanjiMeaning,
    Word, KanjiWordIndex, ExampleSentence, KanjiExampleIndex,
    Radical, KanjiRadicalIndex, KanjiReadingIndex,
)
from app.schemas import (
    KanjiResponse, KanjiReadings,
    KanjiListResponse, RadicalListItem,
    KanjiVocabItem, KanjiVocabularyResponse,
    ExampleSentenceItem, KanjiExamplesResponse,
    RadicalItem, KanjiRadicalsResponse,
    RadicalKanjiItem, RadicalDetailResponse,
    FlashcardItem, FlashcardDeckResponse,
)

# Length floor shared by example-sentence lookups: drop fragments, keep sentences
# that are actually useful to read.
EXAMPLE_MIN_LENGTH = 6

# When randomizing which example a flashcard shows, draw from the N shortest
# qualifying sentences per kanji — keeps the pool digestible and bounded while
# still giving variety.
FLASHCARD_EXAMPLE_POOL = 40


@dataclass
class KanjiFilter:
    """A single composable filter spec for the kanji browser. Every field is
    optional; the query applies only the ones that are set."""
    jlpt: Optional[int] = None
    grade: Optional[int] = None
    strokes_min: Optional[int] = None
    strokes_max: Optional[int] = None
    radicals: List[str] = field(default_factory=list)  # AND across all listed
    reading_row: Optional[str] = None  # gojūon row char (あ/か/…)
    q: Optional[str] = None  # kanji char or meaning keyword


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

        # Upgrade the bare classical-radical number to its glyph + meaning when
        # we have it in the radical table (KANJIDIC2 stores only the number).
        radical_character = None
        radical_meaning = None
        if kanji_entry.radical and kanji_entry.radical.isdigit():
            rad = (
                db.query(Radical)
                .filter(Radical.kangxi_number == int(kanji_entry.radical))
                .order_by(Radical.id.asc())  # canonical glyph is inserted first
                .first()
            )
            if rad:
                radical_character = rad.character
                radical_meaning = rad.meaning

        return KanjiResponse(
            character=kanji_entry.character,
            meanings=meanings,
            readings=readings,
            stroke_count=kanji_entry.stroke_count,
            grade=kanji_entry.grade,
            jlpt_level=kanji_entry.jlpt_level,
            radical=kanji_entry.radical,
            radical_character=radical_character,
            radical_meaning=radical_meaning,
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
                ExampleSentence.length >= EXAMPLE_MIN_LENGTH,
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
    def get_radicals(db: Session, character: str) -> KanjiRadicalsResponse:
        """
        Get the component radicals that make up the given kanji.

        Ordered simplest-first (fewest strokes) so the basic building blocks
        come before the more complex ones.
        """
        rows = (
            db.query(Radical)
            .join(KanjiRadicalIndex, KanjiRadicalIndex.radical_char == Radical.character)
            .filter(KanjiRadicalIndex.kanji_char == character)
            .order_by(
                Radical.strokes.is_(None),  # known stroke counts first
                Radical.strokes.asc(),
                Radical.character.asc(),
            )
            .all()
        )

        radicals = [
            RadicalItem(
                character=r.character,
                meaning=r.meaning,
                reading=r.reading,
                strokes=r.strokes,
            )
            for r in rows
        ]

        return KanjiRadicalsResponse(character=character, radicals=radicals)

    @staticmethod
    def get_radical_detail(db: Session, character: str, limit: int = 30) -> Optional[RadicalDetailResponse]:
        """
        Get a radical's own detail: its name/meaning/strokes plus the other
        kanji that are built from it (most-frequent first), for drill-in.
        Returns None if the radical glyph is unknown.
        """
        radical = db.query(Radical).filter(Radical.character == character).first()
        if not radical:
            return None

        kanji_rows = (
            db.query(Kanji)
            .join(KanjiRadicalIndex, KanjiRadicalIndex.kanji_char == Kanji.character)
            .filter(KanjiRadicalIndex.radical_char == character)
            .order_by(
                Kanji.frequency.is_(None),  # frequency-ranked kanji first
                Kanji.frequency.asc(),
                Kanji.stroke_count.asc(),
                Kanji.character.asc(),
            )
            .limit(limit)
            .all()
        )

        kanji = [
            RadicalKanjiItem(
                character=k.character,
                meanings=[m.meaning for m in k.meanings][:3],
            )
            for k in kanji_rows
        ]

        return RadicalDetailResponse(
            character=radical.character,
            meaning=radical.meaning,
            reading=radical.reading,
            strokes=radical.strokes,
            kangxi_number=radical.kangxi_number,
            kanji=kanji,
        )

    # --- Kanji browser: list / filter / sort ------------------------------

    @staticmethod
    def _order_by(sort: str):
        """Return the ORDER BY clause list for a browser sort key. Every sort
        keeps NULLs last and falls back to frequency then character so the
        ordering is always fully deterministic."""
        if sort == "strokes":
            return [Kanji.stroke_count.is_(None), Kanji.stroke_count.asc(),
                    Kanji.frequency.is_(None), Kanji.frequency.asc(), Kanji.character.asc()]
        if sort == "jlpt":
            # N5 (level 5, easiest) first, then N4…N1; unranked last.
            return [Kanji.jlpt_level.is_(None), Kanji.jlpt_level.desc(),
                    Kanji.frequency.is_(None), Kanji.frequency.asc(), Kanji.character.asc()]
        if sort == "grade":
            return [Kanji.grade.is_(None), Kanji.grade.asc(),
                    Kanji.frequency.is_(None), Kanji.frequency.asc(), Kanji.character.asc()]
        if sort == "reading":
            # Correlated scalar subquery for the primary reading — independent
            # of any joins/group_by the filters may have added.
            primary = (
                select(KanjiReadingIndex.reading)
                .where(KanjiReadingIndex.kanji_char == Kanji.character,
                       KanjiReadingIndex.is_primary.is_(True))
                .limit(1)
                .scalar_subquery()
            )
            return [primary.is_(None), primary.asc(), Kanji.character.asc()]
        # default: newspaper frequency rank (lower = more frequent), NULLs last.
        return [Kanji.frequency.is_(None), Kanji.frequency.asc(),
                Kanji.stroke_count.asc(), Kanji.character.asc()]

    @staticmethod
    def _shape_kanji_list(db: Session, kanji_rows) -> List[KanjiResponse]:
        """Build KanjiResponse items for a page of kanji, batch-resolving the
        classical-radical glyphs once (avoids the per-kanji N+1 that
        lookup_kanji would incur)."""
        numbers = {int(k.radical) for k in kanji_rows if k.radical and k.radical.isdigit()}
        rad_map = {}
        if numbers:
            for r in (db.query(Radical)
                      .filter(Radical.kangxi_number.in_(numbers))
                      .order_by(Radical.id.asc())  # first row = canonical glyph
                      .all()):
                rad_map.setdefault(r.kangxi_number, r)

        items = []
        for k in kanji_rows:
            readings = KanjiReadings()
            for reading in k.readings:
                if reading.reading_type == "on":
                    readings.on.append(reading.reading)
                elif reading.reading_type == "kun":
                    readings.kun.append(reading.reading)
                elif reading.reading_type == "nanori":
                    readings.nanori.append(reading.reading)

            radical_character = None
            radical_meaning = None
            if k.radical and k.radical.isdigit():
                rad = rad_map.get(int(k.radical))
                if rad:
                    radical_character = rad.character
                    radical_meaning = rad.meaning

            items.append(KanjiResponse(
                character=k.character,
                meanings=[m.meaning for m in k.meanings],
                readings=readings,
                stroke_count=k.stroke_count,
                grade=k.grade,
                jlpt_level=k.jlpt_level,
                radical=k.radical,
                radical_character=radical_character,
                radical_meaning=radical_meaning,
                frequency=k.frequency,
            ))
        return items

    @staticmethod
    def _apply_filters(query, filt: KanjiFilter):
        """Apply a `KanjiFilter` to a query whose primary entity is `Kanji`.

        Works for both a full `db.query(Kanji)` (browser) and a lightweight
        `db.query(Kanji.character)` (flashcard deck) — every clause references
        `Kanji` columns or joins keyed on `Kanji`, so callers share one source
        of truth for what "matches these filters" means."""
        if filt.jlpt is not None:
            query = query.filter(Kanji.jlpt_level == filt.jlpt)
        if filt.grade is not None:
            query = query.filter(Kanji.grade == filt.grade)
        if filt.strokes_min is not None:
            query = query.filter(Kanji.stroke_count >= filt.strokes_min)
        if filt.strokes_max is not None:
            query = query.filter(Kanji.stroke_count <= filt.strokes_max)

        if filt.q and filt.q.strip():
            term = filt.q.strip()
            meaning_match = select(KanjiMeaning.kanji_id).where(
                KanjiMeaning.meaning.ilike(f"%{term}%")
            )
            query = query.filter(or_(Kanji.character == term, Kanji.id.in_(meaning_match)))

        if filt.reading_row:
            reading_match = select(KanjiReadingIndex.kanji_char).where(
                KanjiReadingIndex.row == filt.reading_row
            )
            query = query.filter(Kanji.character.in_(reading_match))

        if filt.radicals:
            # Kanji containing ALL selected radicals (AND).
            query = (
                query.join(KanjiRadicalIndex, KanjiRadicalIndex.kanji_char == Kanji.character)
                .filter(KanjiRadicalIndex.radical_char.in_(filt.radicals))
                .group_by(Kanji.id)
                .having(func.count(func.distinct(KanjiRadicalIndex.radical_char)) == len(filt.radicals))
            )

        return query

    @staticmethod
    def list_kanji(db: Session, filt: KanjiFilter, sort: str = "frequency",
                   page: int = 1, page_size: int = 60) -> KanjiListResponse:
        """List kanji for the browser, applying `filt` composably and ordering
        by `sort`. Returns one page plus the total match count."""
        query = KanjiService._apply_filters(
            db.query(Kanji).options(
                selectinload(Kanji.readings),
                selectinload(Kanji.meanings),
            ),
            filt,
        )

        total = query.count()

        kanji_rows = (
            query.order_by(*KanjiService._order_by(sort))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return KanjiListResponse(
            items=KanjiService._shape_kanji_list(db, kanji_rows),
            total=total,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def build_deck(db: Session, filt: KanjiFilter, seed: int, size: int) -> FlashcardDeckResponse:
        """Build a reproducible flashcard deck from the same filters as the
        browser. `seed` drives BOTH the deck order and the per-kanji example
        choice, so the same (filters, seed, size) always yields the identical
        deck. Only kanji that have a usable example sentence are included, so
        every card has a sentence."""
        # Matching kanji that also have at least one qualifying example.
        chars_q = KanjiService._apply_filters(db.query(Kanji.character), filt)
        example_chars = select(KanjiExampleIndex.kanji_char).join(
            ExampleSentence, ExampleSentence.id == KanjiExampleIndex.sentence_id
        ).where(ExampleSentence.length >= EXAMPLE_MIN_LENGTH)
        chars = [c for (c,) in chars_q.filter(Kanji.character.in_(example_chars)).all()]

        total_matched = len(chars)

        rng = random.Random(seed)
        rng.shuffle(chars)
        deck_chars = chars[:max(1, size)]

        # Load full kanji data for just the deck, then restore shuffled order.
        kanji_rows = (
            db.query(Kanji)
            .options(selectinload(Kanji.readings), selectinload(Kanji.meanings))
            .filter(Kanji.character.in_(deck_chars))
            .all()
        )
        shaped = {k.character: r for k, r in
                  zip(kanji_rows, KanjiService._shape_kanji_list(db, kanji_rows))}

        # Batch every candidate sentence for the deck in one query, grouped by
        # kanji, shortest-first (we keep only the top FLASHCARD_EXAMPLE_POOL per
        # kanji as the random pool).
        rows = (
            db.query(KanjiExampleIndex.kanji_char, ExampleSentence.japanese, ExampleSentence.english)
            .join(ExampleSentence, ExampleSentence.id == KanjiExampleIndex.sentence_id)
            .filter(
                KanjiExampleIndex.kanji_char.in_(deck_chars),
                ExampleSentence.length >= EXAMPLE_MIN_LENGTH,
            )
            .order_by(ExampleSentence.length.asc(), ExampleSentence.id.asc())
            .all()
        )
        pools: dict = {}
        for char, jp, en in rows:
            pool = pools.setdefault(char, [])
            if len(pool) < FLASHCARD_EXAMPLE_POOL:
                pool.append((jp, en))

        cards = []
        for char in deck_chars:
            kanji = shaped.get(char)
            if kanji is None:
                continue
            pool = pools.get(char)
            # Draw sequentially from the seeded rng in deck order -> deterministic.
            example = None
            if pool:
                jp, en = rng.choice(pool)
                example = ExampleSentenceItem(japanese=jp, english=en)
            cards.append(FlashcardItem(kanji=kanji, example=example))

        return FlashcardDeckResponse(
            seed=seed,
            size=len(cards),
            total_matched=total_matched,
            cards=cards,
        )

    @staticmethod
    def get_all_radicals(db: Session) -> List[RadicalListItem]:
        """List the named radicals (those with a known meaning) for the browser's
        radical-filter picker, ordered simplest-first by stroke count."""
        rows = (
            db.query(Radical)
            .filter(Radical.meaning.isnot(None))
            .order_by(Radical.strokes.is_(None), Radical.strokes.asc(), Radical.character.asc())
            .all()
        )
        return [
            RadicalListItem(character=r.character, meaning=r.meaning, strokes=r.strokes)
            for r in rows
        ]

    @staticmethod
    def get_kanji_count(db: Session) -> int:
        """Get total number of kanji in database"""
        return db.query(Kanji).count()
