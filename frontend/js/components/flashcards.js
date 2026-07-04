/**
 * Flashcards practice view.
 *
 * A self-contained controller that reuses the Browse Kanji filter controls
 * (renderBrowserControls) and the shared kanji primitives, so it introduces no
 * duplicate filter/query logic. The deck itself is built server-side by
 * GET /api/kanji/deck, which is seeded so a given (filters, seed, size) always
 * yields the same order AND the same per-kanji example sentence.
 *
 * initFlashcards(root, { api, onOpenKanji }) -> { show, hide, setFilters }
 *   show()        – reveal the view: lazy-init, (re)build if needed, bind keys
 *   hide()        – leaving the view: unbind keys
 *   setFilters(s) – adopt an external filter state (e.g. "Practice these" from
 *                   Browse) and rebuild on next show()
 */

import { renderBrowserControls } from './kanji-browser.js';
import { createReadingGroup, createStatBadges } from './kanji-primitives.js';
import { DEFAULT_FILTER_STATE, applyFilterPatch } from '../kanji-filter.js';

const DECK_SIZES = [10, 20, 50, 100, 200];
const DEFAULT_SIZE = 50;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function initFlashcards(root, { api, onOpenKanji }) {
    // --- controller state --------------------------------------------------
    let state = { ...DEFAULT_FILTER_STATE };
    let controls = null;        // { refresh } from renderBrowserControls
    let radicalsLoaded = false;
    let initialized = false;
    let pendingBuild = true;    // rebuild needed on next show()
    let building = false;

    let deck = [];
    let index = 0;
    let revealed = false;
    let seed = randomSeed();
    let size = DEFAULT_SIZE;
    let totalMatched = 0;

    // --- static scaffold ---------------------------------------------------
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'output-header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Flashcards';
    const metaEl = document.createElement('span');
    metaEl.className = 'meta-info';
    header.append(h2, metaEl);

    const controlsEl = document.createElement('div');

    // Deck controls bar (seed / size / shuffle / build).
    const deckbar = document.createElement('div');
    deckbar.className = 'flashcard-deckbar';

    const seedField = labeledField('Seed', (() => {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'flashcard-seed-input';
        input.min = '0';
        input.value = String(seed);
        input.addEventListener('change', () => {
            const v = parseInt(input.value, 10);
            if (Number.isFinite(v) && v >= 0) {
                seed = v;
                buildDeck();
            }
        });
        return input;
    })());
    const seedInput = seedField.querySelector('input');

    const sizeField = labeledField('Deck size', (() => {
        const sel = document.createElement('select');
        sel.className = 'control-select';
        DECK_SIZES.forEach(n => {
            const opt = document.createElement('option');
            opt.value = String(n);
            opt.textContent = String(n);
            if (n === size) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => { size = parseInt(sel.value, 10) || DEFAULT_SIZE; buildDeck(); });
        return sel;
    })());

    const shuffleBtn = document.createElement('button');
    shuffleBtn.className = 'secondary-btn';
    shuffleBtn.textContent = 'Shuffle';
    shuffleBtn.title = 'New random seed';
    shuffleBtn.addEventListener('click', () => { seed = randomSeed(); seedInput.value = String(seed); buildDeck(); });

    const buildBtn = document.createElement('button');
    buildBtn.className = 'primary-btn';
    buildBtn.textContent = 'Rebuild';
    buildBtn.title = 'Rebuild the deck with the current filters and seed';
    buildBtn.addEventListener('click', () => buildDeck());

    deckbar.append(seedField, sizeField, shuffleBtn, buildBtn);

    const stage = document.createElement('div');
    stage.className = 'flashcard-stage';

    root.append(header, controlsEl, deckbar, stage);

    // --- init / data -------------------------------------------------------
    async function ensureInit() {
        if (initialized) return;
        initialized = true;
        let radicals = [];
        try {
            radicals = await api.getRadicals();
            radicalsLoaded = true;
        } catch (err) {
            console.error('Flashcards: radical list load failed:', err);
        }
        controls = renderBrowserControls(controlsEl, { radicals, onChange: handleFilterChange });
        controls.refresh(state);
    }

    function handleFilterChange(patch) {
        state = applyFilterPatch(state, patch);
        if (controls) controls.refresh(state);
        buildDeck();  // reflect new filters immediately (keeps current seed)
    }

    async function buildDeck() {
        building = true;
        renderMessage('Building deck…');
        try {
            const res = await api.getFlashcardDeck({ ...state, seed, size });
            deck = res.cards || [];
            seed = res.seed;
            seedInput.value = String(seed);
            totalMatched = res.total_matched || 0;
            index = 0;
            revealed = false;
            pendingBuild = false;
            updateMeta();
            renderStage();
        } catch (err) {
            console.error('Flashcards: deck build failed:', err);
            renderMessage('Failed to build deck.');
        } finally {
            building = false;
        }
    }

    // --- rendering ---------------------------------------------------------
    function updateMeta() {
        metaEl.textContent = deck.length
            ? `Deck of ${deck.length} · seed ${seed} · ${totalMatched.toLocaleString()} match`
            : '';
    }

    function renderMessage(text) {
        stage.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = 'flashcard-empty';
        msg.textContent = text;
        stage.appendChild(msg);
    }

    function renderStage() {
        if (!deck.length) {
            renderMessage('No kanji with example sentences match these filters.');
            return;
        }
        const card = deck[index];
        stage.innerHTML = '';

        // Progress
        const progress = document.createElement('div');
        progress.className = 'flashcard-progress';
        progress.textContent = `${index + 1} / ${deck.length}`;
        stage.appendChild(progress);

        // The card (a div — clickable to reveal; keeps nav buttons separate so
        // we never nest interactive elements).
        const cardEl = document.createElement('div');
        cardEl.className = 'flashcard' + (revealed ? ' is-revealed' : '');
        cardEl.tabIndex = 0;
        cardEl.setAttribute('role', 'button');
        cardEl.setAttribute('aria-label', revealed ? 'Flashcard, revealed' : 'Flashcard, click to reveal');
        cardEl.addEventListener('click', () => { if (!revealed) reveal(); });

        const glyph = document.createElement('div');
        glyph.className = 'kanji-character flashcard-glyph';
        glyph.textContent = card.kanji.character;
        cardEl.appendChild(glyph);

        if (card.example) {
            const jp = document.createElement('div');
            jp.className = 'flashcard-sentence-jp';
            jp.textContent = card.example.japanese;
            cardEl.appendChild(jp);
        }

        if (!revealed) {
            const hint = document.createElement('div');
            hint.className = 'flashcard-hint';
            hint.textContent = 'Recall the reading & meaning — Space to reveal';
            cardEl.appendChild(hint);
        } else {
            cardEl.appendChild(renderAnswer(card));
        }

        stage.appendChild(cardEl);
        stage.appendChild(renderNav());
    }

    function renderAnswer(card) {
        const answer = document.createElement('div');
        answer.className = 'flashcard-answer';

        const meaning = document.createElement('div');
        meaning.className = 'flashcard-meaning';
        meaning.textContent = (card.kanji.meanings || []).join(', ');
        answer.appendChild(meaning);

        const readings = card.kanji.readings || {};
        if (readings.on && readings.on.length) answer.appendChild(createReadingGroup('On', readings.on));
        if (readings.kun && readings.kun.length) answer.appendChild(createReadingGroup('Kun', readings.kun));

        if (card.example) {
            const en = document.createElement('div');
            en.className = 'flashcard-sentence-en';
            en.textContent = card.example.english;
            answer.appendChild(en);
        }

        answer.appendChild(createStatBadges(card.kanji));

        if (onOpenKanji) {
            const details = document.createElement('button');
            details.className = 'icon-btn flashcard-details-btn';
            details.textContent = 'View full details →';
            details.addEventListener('click', (e) => { e.stopPropagation(); onOpenKanji(card.kanji.character); });
            answer.appendChild(details);
        }
        return answer;
    }

    function renderNav() {
        const nav = document.createElement('div');
        nav.className = 'flashcard-nav';

        const prev = document.createElement('button');
        prev.className = 'secondary-btn';
        prev.textContent = '← Back';
        prev.disabled = index === 0;
        prev.addEventListener('click', prevCard);

        const revealBtn = document.createElement('button');
        revealBtn.className = 'primary-btn';
        revealBtn.textContent = revealed ? 'Revealed' : 'Reveal';
        revealBtn.disabled = revealed;
        revealBtn.addEventListener('click', reveal);

        const next = document.createElement('button');
        next.className = 'secondary-btn';
        next.textContent = 'Next →';
        next.disabled = index >= deck.length - 1;
        next.addEventListener('click', nextCard);

        nav.append(prev, revealBtn, next);
        return nav;
    }

    // --- actions -----------------------------------------------------------
    function reveal() {
        if (revealed || !deck.length) return;
        revealed = true;
        renderStage();
    }
    function nextCard() {
        if (index >= deck.length - 1) return;
        index += 1;
        revealed = false;
        renderStage();
    }
    function prevCard() {
        if (index <= 0) return;
        index -= 1;
        revealed = false;
        renderStage();
    }

    // --- keyboard ----------------------------------------------------------
    function onKeydown(e) {
        // Never hijack typing in the filter/seed controls.
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
        switch (e.key) {
            case 'ArrowRight': e.preventDefault(); nextCard(); break;
            case 'ArrowLeft':  e.preventDefault(); prevCard(); break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                revealed ? nextCard() : reveal();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                seed = randomSeed(); seedInput.value = String(seed); buildDeck();
                break;
            default: break;
        }
    }

    // --- public API --------------------------------------------------------
    async function show() {
        document.addEventListener('keydown', onKeydown);
        await ensureInit();
        if (pendingBuild || (!deck.length && !building)) {
            await buildDeck();
        }
    }
    function hide() {
        document.removeEventListener('keydown', onKeydown);
    }
    function setFilters(newState) {
        state = { ...newState };
        seed = randomSeed();  // a fresh practice session
        if (seedInput) seedInput.value = String(seed);
        if (controls) controls.refresh(state);
        pendingBuild = true;  // built by the next show()
    }

    return { show, hide, setFilters };
}

/** A labeled control field matching the browser's .control-field pattern. */
function labeledField(label, control) {
    const field = document.createElement('div');
    field.className = 'control-field';
    const lab = document.createElement('label');
    lab.className = 'control-label';
    lab.textContent = label;
    field.append(lab, control);
    return field;
}
