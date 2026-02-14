/**
 * Definition popup component - displays word definitions
 */

export function showDefinitionPopup(wordData, modal, onKanjiClick) {
    const content = modal.querySelector('#definition-content');
    content.innerHTML = '';

    if (!wordData) {
        content.innerHTML = '<p>Word not found in dictionary.</p>';
        modal.style.display = 'block';
        return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'word-header';

    const title = document.createElement('div');
    title.className = 'word-title';
    title.textContent = wordData.word;
    header.appendChild(title);

    const reading = document.createElement('div');
    reading.className = 'word-reading';
    reading.textContent = wordData.reading;
    header.appendChild(reading);

    // Badges
    const badges = document.createElement('div');
    badges.className = 'word-badges';

    if (wordData.is_common) {
        const commonBadge = document.createElement('span');
        commonBadge.className = 'badge badge-common';
        commonBadge.textContent = 'Common';
        badges.appendChild(commonBadge);
    }

    if (wordData.jlpt_level) {
        const jlptBadge = document.createElement('span');
        jlptBadge.className = 'badge badge-jlpt';
        jlptBadge.textContent = `JLPT N${wordData.jlpt_level}`;
        badges.appendChild(jlptBadge);
    }

    header.appendChild(badges);
    content.appendChild(header);

    // Meanings
    const meaningSection = document.createElement('div');
    meaningSection.className = 'meaning-section';

    wordData.meanings.forEach(meaning => {
        const posGroup = document.createElement('div');
        posGroup.className = 'pos-group';

        const posTitle = document.createElement('div');
        posTitle.className = 'pos-title';
        posTitle.textContent = formatPOS(meaning.pos);
        posGroup.appendChild(posTitle);

        const defList = document.createElement('ul');
        defList.className = 'definition-list';

        meaning.definitions.forEach(def => {
            const li = document.createElement('li');
            li.textContent = def;
            defList.appendChild(li);
        });

        posGroup.appendChild(defList);
        meaningSection.appendChild(posGroup);
    });

    content.appendChild(meaningSection);

    // Kanji breakdown section
    const kanjiChars = extractKanji(wordData.word);
    if (kanjiChars.length > 0) {
        const kanjiSection = document.createElement('div');
        kanjiSection.className = 'kanji-section';
        kanjiSection.style.marginTop = '1.5rem';
        kanjiSection.style.paddingTop = '1.5rem';
        kanjiSection.style.borderTop = '1px solid var(--border-color)';

        const kanjiTitle = document.createElement('h4');
        kanjiTitle.textContent = 'Kanji Breakdown';
        kanjiTitle.style.marginBottom = '0.75rem';
        kanjiSection.appendChild(kanjiTitle);

        const kanjiList = document.createElement('div');
        kanjiList.style.display = 'flex';
        kanjiList.style.gap = '0.5rem';
        kanjiList.style.flexWrap = 'wrap';

        kanjiChars.forEach(char => {
            const kanjiBtn = document.createElement('button');
            kanjiBtn.className = 'secondary-btn';
            kanjiBtn.textContent = char;
            kanjiBtn.style.fontSize = '1.5rem';
            kanjiBtn.style.padding = '0.5rem 1rem';
            kanjiBtn.onclick = () => onKanjiClick(char);
            kanjiList.appendChild(kanjiBtn);
        });

        kanjiSection.appendChild(kanjiList);
        content.appendChild(kanjiSection);
    }

    modal.style.display = 'block';
}

function formatPOS(pos) {
    const posMap = {
        '名詞': 'Noun',
        '動詞': 'Verb',
        '形容詞': 'Adjective',
        '副詞': 'Adverb',
        '助詞': 'Particle',
        '助動詞': 'Auxiliary verb',
        '接続詞': 'Conjunction',
        '感動詞': 'Interjection',
        '連体詞': 'Adnominal',
    };

    return posMap[pos] || pos;
}

function extractKanji(text) {
    return text.match(/[\u4e00-\u9faf]/g) || [];
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
