/**
 * Radical details component - displays a radical's metadata and the other
 * kanji that are built from it (each clickable, looping back to the kanji view).
 */

export function showRadicalDetails(radicalData, modal, onKanjiClick) {
    const content = modal.querySelector('#radical-content');
    content.innerHTML = '';

    if (!radicalData) {
        content.innerHTML = '<p>Radical details not available.</p>';
        modal.style.display = 'block';
        return;
    }

    // Header: large radical glyph + meaning
    const header = document.createElement('div');
    header.className = 'kanji-header';

    const glyph = document.createElement('div');
    glyph.className = 'kanji-character';
    glyph.textContent = radicalData.character;
    header.appendChild(glyph);

    if (radicalData.meaning) {
        const meaning = document.createElement('div');
        meaning.className = 'kanji-meanings';
        meaning.textContent = radicalData.meaning;
        header.appendChild(meaning);
    }

    content.appendChild(header);

    // Details grid: Japanese name, stroke count, radical number
    const details = document.createElement('div');
    details.className = 'kanji-details';

    if (radicalData.reading) {
        details.appendChild(createInfoGroup('Name (部首)', radicalData.reading));
    }
    if (radicalData.strokes) {
        details.appendChild(createInfoGroup('Stroke Count', radicalData.strokes));
    }
    if (radicalData.kangxi_number) {
        details.appendChild(createInfoGroup('Radical Number', `#${radicalData.kangxi_number}`));
    }

    if (details.children.length > 0) {
        content.appendChild(details);
    }

    // Kanji that use this radical (clickable -> kanji detail)
    const section = document.createElement('div');
    section.className = 'kanji-section-block';

    const sectionTitle = document.createElement('h4');
    sectionTitle.className = 'kanji-section-title';
    sectionTitle.textContent = 'Kanji Using This Radical';
    section.appendChild(sectionTitle);

    const list = document.createElement('div');
    list.className = 'kanji-section-list';

    const kanji = radicalData.kanji || [];
    if (kanji.length === 0) {
        list.innerHTML = '<div class="kanji-section-empty">No kanji found.</div>';
    } else {
        kanji.forEach(item => {
            const row = document.createElement('button');
            row.className = 'kanji-vocab-item';
            row.type = 'button';

            const headline = document.createElement('div');
            headline.className = 'kanji-vocab-headline';

            const ch = document.createElement('span');
            ch.className = 'kanji-vocab-word';
            ch.textContent = item.character;
            headline.appendChild(ch);

            row.appendChild(headline);

            if (item.meanings && item.meanings.length > 0) {
                const meaning = document.createElement('div');
                meaning.className = 'kanji-vocab-meaning';
                meaning.textContent = item.meanings.join('; ');
                row.appendChild(meaning);
            }

            if (typeof onKanjiClick === 'function') {
                row.onclick = () => onKanjiClick(item.character);
            } else {
                row.disabled = true;
            }

            list.appendChild(row);
        });
    }

    section.appendChild(list);
    content.appendChild(section);

    modal.style.display = 'block';
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
