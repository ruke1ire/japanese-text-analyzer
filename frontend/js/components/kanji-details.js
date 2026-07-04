/**
 * Kanji details component - displays kanji information
 */

import {
    createReadingGroup,
    createInfoGroup,
    createKanjiGlyphHeader,
} from './kanji-primitives.js';

export function showKanjiDetails(kanjiData, modal, onWordClick, onRadicalClick) {
    const content = modal.querySelector('#kanji-content');
    content.innerHTML = '';

    if (!kanjiData) {
        content.innerHTML = '<p>Kanji not found in dictionary.</p>';
        modal.style.display = 'block';
        return;
    }

    // Header with large kanji character
    content.appendChild(createKanjiGlyphHeader(kanjiData));

    // Details grid
    const details = document.createElement('div');
    details.className = 'kanji-details';

    // On readings
    if (kanjiData.readings.on.length > 0) {
        const onGroup = createReadingGroup('On\'yomi (音読み)', kanjiData.readings.on);
        details.appendChild(onGroup);
    }

    // Kun readings
    if (kanjiData.readings.kun.length > 0) {
        const kunGroup = createReadingGroup('Kun\'yomi (訓読み)', kanjiData.readings.kun);
        details.appendChild(kunGroup);
    }

    // Stroke count
    if (kanjiData.stroke_count) {
        const strokeGroup = createInfoGroup('Stroke Count', kanjiData.stroke_count);
        details.appendChild(strokeGroup);
    }

    // Grade
    if (kanjiData.grade) {
        const gradeText = kanjiData.grade <= 6
            ? `Grade ${kanjiData.grade}`
            : 'Secondary school';
        const gradeGroup = createInfoGroup('School Grade', gradeText);
        details.appendChild(gradeGroup);
    }

    // JLPT level
    if (kanjiData.jlpt_level) {
        const jlptGroup = createInfoGroup('JLPT Level', `Level ${kanjiData.jlpt_level} (pre-2010 scale)`);
        details.appendChild(jlptGroup);
    }

    // Radical (classical / indexing radical) — show glyph + meaning when known,
    // otherwise fall back to the bare KANJIDIC radical number.
    if (kanjiData.radical_character) {
        const label = kanjiData.radical_meaning
            ? `${kanjiData.radical_character} — ${kanjiData.radical_meaning}`
            : kanjiData.radical_character;
        details.appendChild(createInfoGroup('Radical', label));
    } else if (kanjiData.radical) {
        details.appendChild(createInfoGroup('Radical', kanjiData.radical));
    }

    // Frequency
    if (kanjiData.frequency) {
        const freqGroup = createInfoGroup('Frequency Rank', `#${kanjiData.frequency}`);
        details.appendChild(freqGroup);
    }

    content.appendChild(details);

    // Component radicals section (populated asynchronously by renderKanjiRadicals)
    const radicalsSection = createKanjiSection('Component Radicals', 'kanji-radicals-list');
    radicalsSection.classList.add('kanji-radicals-section');
    content.appendChild(radicalsSection);

    // Vocabulary section (populated asynchronously by renderKanjiVocabulary)
    const vocabSection = createKanjiSection('Words Using This Kanji', 'kanji-vocab-list');
    vocabSection.classList.add('kanji-vocab-section');
    content.appendChild(vocabSection);

    // Example sentences section (populated asynchronously by renderKanjiExamples)
    const examplesSection = createKanjiSection('Example Sentences', 'kanji-examples-list');
    examplesSection.classList.add('kanji-examples-section');
    content.appendChild(examplesSection);

    // Stash click handlers so the async renders can wire them up
    modal._onVocabWordClick = onWordClick;
    modal._onRadicalClick = onRadicalClick;

    modal.style.display = 'block';
}

function createKanjiSection(title, listId) {
    const section = document.createElement('div');
    section.className = 'kanji-section-block';

    const titleElem = document.createElement('h4');
    titleElem.className = 'kanji-section-title';
    titleElem.textContent = title;
    section.appendChild(titleElem);

    const list = document.createElement('div');
    list.id = listId;
    list.className = 'kanji-section-list';

    const loading = document.createElement('div');
    loading.className = 'kanji-section-loading';
    loading.textContent = 'Loading…';
    list.appendChild(loading);

    section.appendChild(list);
    return section;
}

export function renderKanjiVocabulary(vocabData, modal) {
    const list = modal.querySelector('#kanji-vocab-list');
    if (!list) return;  // kanji-not-found case: section was never rendered
    list.innerHTML = '';

    const words = vocabData && vocabData.words ? vocabData.words : [];
    if (words.length === 0) {
        list.innerHTML = '<div class="kanji-section-empty">No vocabulary found.</div>';
        return;
    }

    const onWordClick = modal._onVocabWordClick;

    words.forEach(item => {
        const row = document.createElement('button');
        row.className = 'kanji-vocab-item';
        row.type = 'button';

        const headline = document.createElement('div');
        headline.className = 'kanji-vocab-headline';

        const word = document.createElement('span');
        word.className = 'kanji-vocab-word';
        word.textContent = item.word;
        headline.appendChild(word);

        if (item.reading && item.reading !== item.word) {
            const reading = document.createElement('span');
            reading.className = 'kanji-vocab-reading';
            reading.textContent = item.reading;
            headline.appendChild(reading);
        }

        if (item.is_common) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-common';
            badge.textContent = 'Common';
            headline.appendChild(badge);
        }

        row.appendChild(headline);

        if (item.meanings && item.meanings.length > 0) {
            const meaning = document.createElement('div');
            meaning.className = 'kanji-vocab-meaning';
            meaning.textContent = item.meanings.join('; ');
            row.appendChild(meaning);
        }

        if (typeof onWordClick === 'function') {
            row.onclick = () => onWordClick(item.word);
        } else {
            row.disabled = true;
        }

        list.appendChild(row);
    });
}

export function renderKanjiExamples(examplesData, modal) {
    const list = modal.querySelector('#kanji-examples-list');
    if (!list) return;  // kanji-not-found case: section was never rendered
    list.innerHTML = '';

    const examples = examplesData && examplesData.examples ? examplesData.examples : [];
    if (examples.length === 0) {
        list.innerHTML = '<div class="kanji-section-empty">No example sentences found.</div>';
        return;
    }

    examples.forEach(ex => {
        const block = document.createElement('div');
        block.className = 'kanji-example';

        const jp = document.createElement('div');
        jp.className = 'kanji-example-jp';
        jp.textContent = ex.japanese;
        block.appendChild(jp);

        const en = document.createElement('div');
        en.className = 'kanji-example-en';
        en.textContent = ex.english;
        block.appendChild(en);

        list.appendChild(block);
    });
}

export function renderKanjiRadicals(radicalsData, modal) {
    const list = modal.querySelector('#kanji-radicals-list');
    if (!list) return;  // kanji-not-found case: section was never rendered
    list.innerHTML = '';

    const radicals = radicalsData && radicalsData.radicals ? radicalsData.radicals : [];
    if (radicals.length === 0) {
        list.innerHTML = '<div class="kanji-section-empty">No radical data found.</div>';
        return;
    }

    const onRadicalClick = modal._onRadicalClick;

    const chips = document.createElement('div');
    chips.className = 'kanji-radical-chips';

    radicals.forEach(item => {
        const chip = document.createElement('button');
        chip.className = 'kanji-radical-item';
        chip.type = 'button';

        const glyph = document.createElement('span');
        glyph.className = 'kanji-radical-glyph';
        glyph.textContent = item.character;
        chip.appendChild(glyph);

        if (item.meaning) {
            const meaning = document.createElement('span');
            meaning.className = 'kanji-radical-meaning';
            meaning.textContent = item.meaning;
            chip.appendChild(meaning);
        }

        if (typeof onRadicalClick === 'function') {
            chip.onclick = () => onRadicalClick(item.character);
        } else {
            chip.disabled = true;
        }

        chips.appendChild(chip);
    });

    list.appendChild(chips);
}

export function setupModalClose(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Additive listener (not window.onclick =) so multiple modals can coexist
    // without overwriting each other's backdrop-close handler.
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}
