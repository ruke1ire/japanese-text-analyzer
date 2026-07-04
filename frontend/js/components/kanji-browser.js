/**
 * Kanji browser component — pure rendering for the "Browse Kanji" page.
 *
 * Two entry points, both stateless: the caller (app.js) owns all filter/sort
 * state and passes it in.
 *   - renderKanjiCards: renders (or appends) a page of kanji cards.
 *   - renderBrowserControls: builds the filter panel once and returns a
 *     `refresh(state)` fn to reflect the current state onto the controls.
 */

import {
    createReadingGroup,
    createStatBadges,
} from './kanji-primitives.js';

// Gojūon rows offered in the reading filter (matches backend GOJUON_ROWS).
const GOJUON_ROWS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'ん'];

const SORTS = [
    { value: 'frequency', label: 'Frequency' },
    { value: 'strokes', label: 'Stroke count' },
    { value: 'jlpt', label: 'JLPT level' },
    { value: 'grade', label: 'School grade' },
    { value: 'reading', label: 'Reading (あいうえお)' },
];

// KANJIDIC carries the pre-2010 4-level JLPT tag (1–4, no N5), matching the
// "N{level}" badge shown elsewhere in the app. Ordered easiest-first.
const JLPT_LEVELS = [4, 3, 2, 1];
const GRADES = [
    { value: 1, label: 'Grade 1' }, { value: 2, label: 'Grade 2' },
    { value: 3, label: 'Grade 3' }, { value: 4, label: 'Grade 4' },
    { value: 5, label: 'Grade 5' }, { value: 6, label: 'Grade 6' },
    { value: 8, label: 'Secondary' },
];

// --- Card list -----------------------------------------------------------

function buildCard(kanji, onKanjiClick) {
    const card = document.createElement('button');
    card.className = 'kanji-card';
    card.type = 'button';

    const glyph = document.createElement('div');
    glyph.className = 'kanji-card-glyph';
    glyph.textContent = kanji.character;
    card.appendChild(glyph);

    const body = document.createElement('div');
    body.className = 'kanji-card-body';

    const meanings = document.createElement('div');
    meanings.className = 'kanji-card-meanings';
    meanings.textContent = (kanji.meanings || []).slice(0, 4).join(', ');
    body.appendChild(meanings);

    if (kanji.readings.on.length || kanji.readings.kun.length) {
        const readings = document.createElement('div');
        readings.className = 'kanji-card-readings';
        if (kanji.readings.on.length) {
            readings.appendChild(createReadingGroup('On', kanji.readings.on));
        }
        if (kanji.readings.kun.length) {
            readings.appendChild(createReadingGroup('Kun', kanji.readings.kun));
        }
        body.appendChild(readings);
    }

    body.appendChild(createStatBadges(kanji));
    card.appendChild(body);

    if (typeof onKanjiClick === 'function') {
        card.onclick = () => onKanjiClick(kanji.character);
    }
    return card;
}

export function renderKanjiCards(container, listResponse, { onKanjiClick, append = false } = {}) {
    let grid = container.querySelector('.kanji-card-grid');

    if (!append || !grid) {
        container.innerHTML = '';
        const items = (listResponse && listResponse.items) || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="kanji-section-empty">No kanji match these filters.</div>';
            return;
        }
        grid = document.createElement('div');
        grid.className = 'kanji-card-grid';
        container.appendChild(grid);
    }

    ((listResponse && listResponse.items) || []).forEach(k => {
        grid.appendChild(buildCard(k, onKanjiClick));
    });
}

export function renderLoading(container) {
    container.innerHTML = '<div class="kanji-section-loading">Loading kanji…</div>';
}

// --- Controls ------------------------------------------------------------

function makeSelect(className, options, blankLabel) {
    const sel = document.createElement('select');
    sel.className = className;
    if (blankLabel != null) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = blankLabel;
        sel.appendChild(opt);
    }
    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
    });
    return sel;
}

function makeToggleGroup(className, buttons) {
    // buttons: [{ key, label, title }] — returns { wrap, byKey }
    const wrap = document.createElement('div');
    wrap.className = className;
    const byKey = {};
    buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-toggle';
        btn.textContent = b.label;
        if (b.title) btn.title = b.title;
        btn.dataset.key = b.key;
        wrap.appendChild(btn);
        byKey[b.key] = btn;
    });
    return { wrap, byKey };
}

function labeledField(labelText, ...controls) {
    const field = document.createElement('div');
    field.className = 'control-field';
    const label = document.createElement('label');
    label.className = 'control-label';
    label.textContent = labelText;
    field.appendChild(label);
    controls.forEach(c => field.appendChild(c));
    return field;
}

/**
 * Build the filter panel once. `onChange(patch)` is called with a partial
 * state update on every control interaction; the special patch `{ clear: true }`
 * requests a reset. Returns `{ refresh(state) }`.
 */
export function renderBrowserControls(container, { radicals = [], onChange }) {
    container.innerHTML = '';
    container.className = 'browser-controls';
    const emit = (patch) => { if (onChange) onChange(patch); };

    // Row 1: search + sort + clear-all
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'browser-search';
    search.placeholder = 'Search kanji or meaning…';
    let debounce = null;
    search.addEventListener('input', () => {
        clearTimeout(debounce);
        const v = search.value.trim();
        debounce = setTimeout(() => emit({ q: v || null }), 250);
    });

    const sort = makeSelect('control-select', SORTS);
    sort.addEventListener('change', () => emit({ sort: sort.value }));

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'secondary-btn browser-clear';
    clearBtn.textContent = 'Clear all';
    clearBtn.addEventListener('click', () => emit({ clear: true }));

    const row1 = document.createElement('div');
    row1.className = 'browser-controls-row';
    row1.append(
        labeledField('Search', search),
        labeledField('Sort by', sort),
        clearBtn,
    );
    container.appendChild(row1);

    // Row 2: JLPT toggle group.
    // KANJIDIC carries the PRE-2010 4-level JLPT tag (Level 4–1, no N5), so we
    // deliberately avoid the modern "N4" notation — old Level 4 ≈ today's N5–N4.
    const jlpt = makeToggleGroup('filter-toggle-group', [
        { key: '', label: 'All' },
        ...JLPT_LEVELS.map(n => ({ key: String(n), label: String(n) })),
    ]);
    jlpt.wrap.title = "KANJIDIC uses the pre-2010 JLPT scale (Level 4–1). "
        + "Old Level 4 roughly covers today's N5 and N4, which is why there's no N5.";
    Object.entries(jlpt.byKey).forEach(([key, btn]) => {
        btn.addEventListener('click', () => emit({ jlpt: key ? Number(key) : null }));
    });

    // Grade select + stroke range
    const grade = makeSelect('control-select', GRADES, 'Any grade');
    grade.addEventListener('change', () => emit({ grade: grade.value ? Number(grade.value) : null }));

    const strokeMin = document.createElement('input');
    strokeMin.type = 'number';
    strokeMin.min = '1';
    strokeMin.className = 'stroke-input';
    strokeMin.placeholder = 'min';
    const strokeMax = document.createElement('input');
    strokeMax.type = 'number';
    strokeMax.min = '1';
    strokeMax.className = 'stroke-input';
    strokeMax.placeholder = 'max';
    const strokeDash = document.createElement('span');
    strokeDash.textContent = '–';
    strokeDash.className = 'stroke-dash';
    strokeMin.addEventListener('change', () => emit({ strokesMin: strokeMin.value ? Number(strokeMin.value) : null }));
    strokeMax.addEventListener('change', () => emit({ strokesMax: strokeMax.value ? Number(strokeMax.value) : null }));

    const row2 = document.createElement('div');
    row2.className = 'browser-controls-row';
    row2.append(
        labeledField('JLPT (old)', jlpt.wrap),
        labeledField('Grade', grade),
        labeledField('Strokes', strokeMin, strokeDash, strokeMax),
    );
    container.appendChild(row2);

    // Row 3: gojūon reading bar
    const gojuon = makeToggleGroup('filter-toggle-group gojuon-bar', [
        { key: '', label: 'All' },
        ...GOJUON_ROWS.map(r => ({ key: r, label: r })),
    ]);
    Object.entries(gojuon.byKey).forEach(([key, btn]) => {
        btn.addEventListener('click', () => emit({ readingRow: key || null }));
    });
    container.appendChild(labeledField('Reading (gojūon)', gojuon.wrap));

    // Row 4: radical picker (collapsible)
    const radWrap = document.createElement('div');
    radWrap.className = 'radical-picker';
    const radByGlyph = {};
    radicals.forEach(r => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'radical-pick';
        btn.textContent = r.character;
        btn.title = r.meaning || r.character;
        btn.dataset.glyph = r.character;
        btn.addEventListener('click', () => emit({ toggleRadical: r.character }));
        radWrap.appendChild(btn);
        radByGlyph[r.character] = btn;
    });

    const radToggle = document.createElement('button');
    radToggle.type = 'button';
    radToggle.className = 'secondary-btn radical-toggle';
    radToggle.textContent = 'Filter by radical ▾';
    radToggle.addEventListener('click', () => {
        radWrap.classList.toggle('open');
        radToggle.classList.toggle('open');
    });
    container.appendChild(labeledField('Radicals', radToggle, radWrap));

    // Active-filter chips
    const chips = document.createElement('div');
    chips.className = 'filter-chips';
    container.appendChild(chips);

    function renderChips(state) {
        chips.innerHTML = '';
        const add = (label, patch) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'filter-chip';
            chip.innerHTML = `${label} <span class="filter-chip-x">×</span>`;
            chip.addEventListener('click', () => emit(patch));
            chips.appendChild(chip);
        };
        if (state.q) add(`“${state.q}”`, { q: null });
        if (state.jlpt) add(`JLPT ${state.jlpt}`, { jlpt: null });
        if (state.grade) {
            const g = GRADES.find(x => x.value === state.grade);
            add(g ? g.label : `Grade ${state.grade}`, { grade: null });
        }
        if (state.strokesMin != null) add(`≥${state.strokesMin} strokes`, { strokesMin: null });
        if (state.strokesMax != null) add(`≤${state.strokesMax} strokes`, { strokesMax: null });
        if (state.readingRow) add(`${state.readingRow}-row`, { readingRow: null });
        (state.radicals || []).forEach(r => add(`部 ${r}`, { toggleRadical: r }));
    }

    function refresh(state) {
        if (document.activeElement !== search) search.value = state.q || '';
        sort.value = state.sort || 'frequency';
        grade.value = state.grade != null ? String(state.grade) : '';
        if (document.activeElement !== strokeMin) strokeMin.value = state.strokesMin != null ? state.strokesMin : '';
        if (document.activeElement !== strokeMax) strokeMax.value = state.strokesMax != null ? state.strokesMax : '';

        Object.entries(jlpt.byKey).forEach(([key, btn]) => {
            const active = (key === '' && !state.jlpt) || key === String(state.jlpt);
            btn.classList.toggle('active', active);
        });
        Object.entries(gojuon.byKey).forEach(([key, btn]) => {
            const active = (key === '' && !state.readingRow) || key === state.readingRow;
            btn.classList.toggle('active', active);
        });
        Object.entries(radByGlyph).forEach(([glyph, btn]) => {
            btn.classList.toggle('selected', (state.radicals || []).includes(glyph));
        });
        const radCount = (state.radicals || []).length;
        radToggle.textContent = radCount
            ? `Filter by radical (${radCount}) ▾`
            : 'Filter by radical ▾';

        renderChips(state);
    }

    return { refresh };
}
