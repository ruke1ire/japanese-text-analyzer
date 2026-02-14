/**
 * Kanji details component - displays kanji information
 */

export function showKanjiDetails(kanjiData, modal) {
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

    modal.style.display = 'block';
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
}
