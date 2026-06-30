/**
 * Kanji details component - displays kanji information
 */

export function showKanjiDetails(kanjiData, modal, onWordClick) {
    const content = modal.querySelector('#kanji-content');
    content.innerHTML = '';

    if (!kanjiData) {
        content.innerHTML = '<p>Kanji not found in dictionary.</p>';
        modal.style.display = 'block';
        return;
    }

    // Header with large kanji character
    const header = document.createElement('div');
    header.className = 'kanji-header';

    const character = document.createElement('div');
    character.className = 'kanji-character';
    character.textContent = kanjiData.character;
    header.appendChild(character);

    const meanings = document.createElement('div');
    meanings.className = 'kanji-meanings';
    meanings.textContent = kanjiData.meanings.join(', ');
    header.appendChild(meanings);

    content.appendChild(header);

    // Details grid
    const details = document.createElement('div');
    details.className = 'kanji-details';

    // On readings
    if (kanjiData.readings.on.length > 0) {
        const onGroup = createDetailGroup('On\'yomi (音読み)', kanjiData.readings.on);
        details.appendChild(onGroup);
    }

    // Kun readings
    if (kanjiData.readings.kun.length > 0) {
        const kunGroup = createDetailGroup('Kun\'yomi (訓読み)', kanjiData.readings.kun);
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
        const jlptGroup = createInfoGroup('JLPT Level', `N${kanjiData.jlpt_level}`);
        details.appendChild(jlptGroup);
    }

    // Radical
    if (kanjiData.radical) {
        const radicalGroup = createInfoGroup('Radical', kanjiData.radical);
        details.appendChild(radicalGroup);
    }

    // Frequency
    if (kanjiData.frequency) {
        const freqGroup = createInfoGroup('Frequency Rank', `#${kanjiData.frequency}`);
        details.appendChild(freqGroup);
    }

    content.appendChild(details);

    // Vocabulary section (populated asynchronously by renderKanjiVocabulary)
    const vocabSection = createKanjiSection('Words Using This Kanji', 'kanji-vocab-list');
    vocabSection.classList.add('kanji-vocab-section');
    content.appendChild(vocabSection);

    // Example sentences section (populated asynchronously by renderKanjiExamples)
    const examplesSection = createKanjiSection('Example Sentences', 'kanji-examples-list');
    examplesSection.classList.add('kanji-examples-section');
    content.appendChild(examplesSection);

    // Stash the word-click handler so the async vocab render can wire it up
    modal._onVocabWordClick = onWordClick;

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

function createDetailGroup(title, items) {
    const group = document.createElement('div');
    group.className = 'detail-group';

    const titleElem = document.createElement('h4');
    titleElem.textContent = title;
    group.appendChild(titleElem);

    const list = document.createElement('div');
    list.className = 'reading-list';

    items.forEach(item => {
        const badge = document.createElement('span');
        badge.className = 'reading-badge';
        badge.textContent = item;
        list.appendChild(badge);
    });

    group.appendChild(list);
    return group;
}

function createInfoGroup(title, value) {
    const group = document.createElement('div');
    group.className = 'detail-group';

    const titleElem = document.createElement('h4');
    titleElem.textContent = title;
    group.appendChild(titleElem);

    const info = document.createElement('div');
    info.className = 'info-item';
    info.textContent = value;
    group.appendChild(info);

    return group;
}

export function setupModalClose(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}
