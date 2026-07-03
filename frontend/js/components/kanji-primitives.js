/**
 * Shared kanji rendering primitives.
 *
 * These building blocks are composed by BOTH the kanji detail modal
 * (kanji-details.js) and the kanji browser cards (kanji-browser.js), so the two
 * views stay visually consistent — change a reading badge or a stat here and it
 * updates everywhere.
 */

/** A titled group of reading badges (e.g. On'yomi / Kun'yomi). */
export function createReadingGroup(title, readings) {
    const group = document.createElement('div');
    group.className = 'detail-group';

    const titleElem = document.createElement('h4');
    titleElem.textContent = title;
    group.appendChild(titleElem);

    const list = document.createElement('div');
    list.className = 'reading-list';

    readings.forEach(item => {
        const badge = document.createElement('span');
        badge.className = 'reading-badge';
        badge.textContent = item;
        list.appendChild(badge);
    });

    group.appendChild(list);
    return group;
}

/** A titled single-value info cell (e.g. Stroke Count / JLPT Level). */
export function createInfoGroup(title, value) {
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

/** The large glyph + comma-joined meanings header shared by the detail modal
 *  and (in compact form) the browser cards. Pass compact:true for cards. */
export function createKanjiGlyphHeader(kanjiData, { compact = false } = {}) {
    const header = document.createElement('div');
    header.className = compact ? 'kanji-header kanji-header-compact' : 'kanji-header';

    const character = document.createElement('div');
    character.className = 'kanji-character';
    character.textContent = kanjiData.character;
    header.appendChild(character);

    const meanings = document.createElement('div');
    meanings.className = 'kanji-meanings';
    meanings.textContent = (kanjiData.meanings || []).join(', ');
    header.appendChild(meanings);

    return header;
}

/** Format a KANJIDIC grade code into a human label. */
export function formatGrade(grade) {
    if (grade == null) return null;
    return grade <= 6 ? `Grade ${grade}` : 'Secondary';
}

/** A compact row of stat badges (strokes / JLPT / grade / frequency). Used on
 *  the browser cards; each stat is omitted when the value is missing. */
export function createStatBadges(kanjiData) {
    const row = document.createElement('div');
    row.className = 'kanji-stats';

    const add = (text, extraClass) => {
        const badge = document.createElement('span');
        badge.className = `badge ${extraClass}`;
        badge.textContent = text;
        row.appendChild(badge);
    };

    if (kanjiData.stroke_count) add(`${kanjiData.stroke_count} strokes`, 'badge-strokes');
    if (kanjiData.jlpt_level) add(`N${kanjiData.jlpt_level}`, 'badge-jlpt');
    const grade = formatGrade(kanjiData.grade);
    if (grade) add(grade, 'badge-grade');
    if (kanjiData.frequency) add(`#${kanjiData.frequency}`, 'badge-freq');

    return row;
}
