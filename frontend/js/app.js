/**
 * Japanese Text Analyzer - Main Application
 */

import { JapaneseAnalyzerAPI } from './api.js';
import { renderAnalyzedText, attachTokenClickHandlers } from './components/text-display.js';
import { showDefinitionPopup, setupModalClose as setupDefModalClose } from './components/definition-popup.js';
import { showKanjiDetails, renderKanjiVocabulary, renderKanjiExamples, renderKanjiRadicals, setupModalClose as setupKanjiModalClose } from './components/kanji-details.js';
import { showRadicalDetails, setupModalClose as setupRadicalModalClose } from './components/radical-details.js';
import { renderHistory, generatePreview, setupHistorySidebar } from './components/history-sidebar.js';
import { renderKanjiCards, renderBrowserControls, renderLoading } from './components/kanji-browser.js';
import { DEFAULT_FILTER_STATE, applyFilterPatch } from './kanji-filter.js';
import { initFlashcards } from './components/flashcards.js';

// Initialize API client
const api = new JapaneseAnalyzerAPI();

// State
let currentTokens = [];
let currentText = '';
let analysisHistory = [];
const MAX_HISTORY_ENTRIES = 20;
let currentHistoryId = null;
const BROWSER_PAGE_SIZE = 60;

// DOM elements
const inputText = document.getElementById('input-text');
const analyzeBtn = document.getElementById('analyze-btn');
const translateBtn = document.getElementById('translate-btn');
const translationMethodSelect = document.getElementById('translation-method');
const clearBtn = document.getElementById('clear-btn');
const outputSection = document.getElementById('output-section');
const analyzedTextContainer = document.getElementById('analyzed-text');
const tokenCount = document.getElementById('token-count');
const translationSection = document.getElementById('translation-section');
const translationText = document.getElementById('translation-text');
const translationMethodInfo = document.getElementById('translation-method-info');
const definitionModal = document.getElementById('definition-modal');
const kanjiModal = document.getElementById('kanji-modal');
const radicalModal = document.getElementById('radical-modal');
const historySidebar = document.getElementById('history-sidebar');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const mainEl = document.querySelector('main');
const navTabs = document.querySelectorAll('.nav-tab');
const browserControlsEl = document.getElementById('kanji-browser-controls');
const browserListEl = document.getElementById('kanji-browser-list');
const browserMoreBtn = document.getElementById('kanji-browser-more');
const browserCountEl = document.getElementById('kanji-browser-count');
const browsePracticeBtn = document.getElementById('browse-practice-btn');
const flashcardsSectionEl = document.getElementById('flashcards-section');

// Initialize
function init() {
    // Setup event listeners
    analyzeBtn.addEventListener('click', handleAnalyze);
    translateBtn.addEventListener('click', handleTranslate);
    clearBtn.addEventListener('click', handleClear);
    clearHistoryBtn.addEventListener('click', handleClearHistory);

    // Load saved translation method preference
    const savedMethod = localStorage.getItem('translationMethod');
    if (savedMethod) {
        translationMethodSelect.value = savedMethod;
    }

    // Save translation method when changed
    translationMethodSelect.addEventListener('change', () => {
        localStorage.setItem('translationMethod', translationMethodSelect.value);
    });

    // Setup modals
    setupDefModalClose(definitionModal);
    setupKanjiModalClose(kanjiModal);
    setupRadicalModalClose(radicalModal);

    // Setup token click handlers
    attachTokenClickHandlers(analyzedTextContainer, handleTokenClick);

    // Setup view navigation (Analyze / Browse Kanji / Flashcards tabs)
    mainEl.dataset.view = 'analyze';
    navTabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
    browserMoreBtn.addEventListener('click', loadMore);

    // "Practice these" — carry the browser's current filters into a flashcard deck.
    if (browsePracticeBtn) {
        browsePracticeBtn.addEventListener('click', () => {
            ensureFlashcards();
            flashcards.setFilters(browserState);
            showView('flashcards');
        });
    }

    // Setup history sidebar
    setupHistorySidebar(historySidebar);

    // Render initial empty history
    renderHistory(analysisHistory, historyList, {
        onEntryClick: handleHistoryEntryClick,
        activeId: currentHistoryId
    });

    // Check API health
    checkAPIHealth();
}

async function checkAPIHealth() {
    try {
        const health = await api.healthCheck();
        console.log('API Health:', health);
    } catch (error) {
        console.error('API health check failed:', error);
        alert('Warning: Cannot connect to API backend. Please ensure the backend server is running on http://localhost:8000');
    }
}

async function handleAnalyze() {
    const text = inputText.value;

    if (!text || !text.trim()) {
        alert('Please enter some Japanese text to analyze');
        return;
    }

    try {
        // Disable button and show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';

        // Call API
        const result = await api.analyzeText(text);

        // Update state
        currentTokens = result.tokens;
        currentText = text;

        // Create history entry
        const historyEntry = {
            id: Date.now().toString(),
            text: text,
            preview: generatePreview(text),
            tokens: currentTokens,
            timestamp: Date.now(),
            translation: null,
            translationMethod: null
        };

        // Add to history (newest first)
        analysisHistory.unshift(historyEntry);

        // Limit size
        if (analysisHistory.length > MAX_HISTORY_ENTRIES) {
            analysisHistory = analysisHistory.slice(0, MAX_HISTORY_ENTRIES);
        }

        currentHistoryId = historyEntry.id;

        // Render sidebar
        renderHistory(analysisHistory, historyList, {
            onEntryClick: handleHistoryEntryClick,
            activeId: currentHistoryId
        });

        // Render results - pass original text to preserve formatting
        renderAnalyzedText(currentTokens, analyzedTextContainer, text);
        tokenCount.textContent = `${currentTokens.length} tokens`;

        // Show output section
        outputSection.style.display = 'block';

        // Hide translation section
        translationSection.style.display = 'none';

    } catch (error) {
        console.error('Analysis error:', error);
        alert(`Analysis failed: ${error.message}`);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze';
    }
}

async function handleTranslate() {
    const text = inputText.value.trim();

    if (!text) {
        alert('Please enter some Japanese text to translate');
        return;
    }

    // Get selected translation method
    const selectedMethod = translationMethodSelect.value;

    try {
        // Disable button and show loading state
        translateBtn.disabled = true;
        translateBtn.textContent = 'Translating...';

        // Call API with selected method
        const result = await api.translateText(text, 'ja', 'en', selectedMethod);

        // Display translation
        if (result.translation) {
            translationText.textContent = result.translation;
            translationMethodInfo.textContent = `Method: ${result.method}`;
            translationSection.style.display = 'block';
        } else {
            translationText.textContent = 'Translation not available.';
            translationMethodInfo.textContent = `Method: ${result.method}`;
            translationSection.style.display = 'block';
        }

        // Update current history entry with translation
        if (currentHistoryId && analysisHistory.length > 0) {
            const currentEntry = analysisHistory.find(entry => entry.id === currentHistoryId);
            if (currentEntry) {
                currentEntry.translation = result.translation;
                currentEntry.translationMethod = result.method;
            }
        }

    } catch (error) {
        console.error('Translation error:', error);
        alert(`Translation failed: ${error.message}`);
    } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = 'Translate';
    }
}

function handleClear() {
    inputText.value = '';
    currentTokens = [];
    currentText = '';
    currentHistoryId = null;
    outputSection.style.display = 'none';
    translationSection.style.display = 'none';

    // Re-render history to clear active state
    renderHistory(analysisHistory, historyList, {
        onEntryClick: handleHistoryEntryClick,
        activeId: currentHistoryId
    });
}

function handleHistoryEntryClick(entry) {
    // Restore state
    currentTokens = entry.tokens;
    currentText = entry.text;
    currentHistoryId = entry.id;

    // Update UI
    inputText.value = entry.text;
    renderAnalyzedText(currentTokens, analyzedTextContainer, entry.text);
    tokenCount.textContent = `${currentTokens.length} tokens`;
    outputSection.style.display = 'block';

    // Restore translation if it exists
    if (entry.translation) {
        translationText.textContent = entry.translation;
        translationMethodInfo.textContent = `Method: ${entry.translationMethod}`;
        translationSection.style.display = 'block';
    } else {
        translationSection.style.display = 'none';
    }

    // Update active state in sidebar
    renderHistory(analysisHistory, historyList, {
        onEntryClick: handleHistoryEntryClick,
        activeId: currentHistoryId
    });
}

function handleClearHistory() {
    if (analysisHistory.length === 0) return;

    if (confirm('Clear all analysis history?')) {
        analysisHistory = [];
        currentHistoryId = null;

        renderHistory(analysisHistory, historyList, {
            onEntryClick: handleHistoryEntryClick,
            activeId: currentHistoryId
        });
    }
}

// --- Drill-in navigation with a back stack -------------------------------
// A single history stack spanning all three detail views (word definition,
// kanji, radical). Each drill-in pushes the view you came from, so the "← Back"
// button on every modal walks back through the whole chain:
//   token → definition → kanji → radical → kanji → ...
let navStack = [];       // previous views: { kind: 'definition'|'kanji'|'radical', value }
let currentView = null;  // the view currently shown

function hideAllDetailModals() {
    definitionModal.style.display = 'none';
    kanjiModal.style.display = 'none';
    radicalModal.style.display = 'none';
}

function updateBackButton(modal) {
    const btn = modal.querySelector('.modal-back');
    if (!btn) return;
    if (navStack.length > 0) {
        btn.style.display = '';
        btn.onclick = goBack;
    } else {
        btn.style.display = 'none';
        btn.onclick = null;
    }
}

// Core show functions — render a view without touching the back stack.
async function showDefinitionView(word) {
    hideAllDetailModals();
    try {
        const wordData = await api.getWordDefinition(word);
        showDefinitionPopup(wordData, definitionModal, navToKanji);
    } catch (error) {
        console.error('Word lookup error:', error);
        showDefinitionPopup(null, definitionModal, navToKanji);
    }
    updateBackButton(definitionModal);
    currentView = { kind: 'definition', value: word };
}

async function showKanjiView(character) {
    hideAllDetailModals();
    let kanjiData = null;
    try {
        kanjiData = await api.getKanjiInfo(character);
    } catch (error) {
        console.error('Kanji lookup error:', error);
    }

    // Modal opens immediately on the core data; the click handlers drill further.
    showKanjiDetails(kanjiData, kanjiModal, navToDefinition, navToRadical);
    updateBackButton(kanjiModal);
    currentView = { kind: 'kanji', value: character };

    if (!kanjiData) {
        return;
    }

    // Lazy-load the component-radical, vocabulary and example-sentence sections
    // so the modal never blocks on the heavier queries.
    api.getKanjiRadicals(character)
        .then(radicals => renderKanjiRadicals(radicals, kanjiModal))
        .catch(error => {
            console.error('Kanji radicals lookup error:', error);
            renderKanjiRadicals(null, kanjiModal);
        });

    api.getKanjiVocabulary(character)
        .then(vocab => renderKanjiVocabulary(vocab, kanjiModal))
        .catch(error => {
            console.error('Kanji vocabulary lookup error:', error);
            renderKanjiVocabulary(null, kanjiModal);
        });

    api.getKanjiExamples(character)
        .then(examples => renderKanjiExamples(examples, kanjiModal))
        .catch(error => {
            console.error('Kanji examples lookup error:', error);
            renderKanjiExamples(null, kanjiModal);
        });
}

async function showRadicalView(radicalChar) {
    hideAllDetailModals();
    try {
        const radicalData = await api.getRadicalDetail(radicalChar);
        showRadicalDetails(radicalData, radicalModal, navToKanji);
    } catch (error) {
        console.error('Radical lookup error:', error);
        showRadicalDetails(null, radicalModal, navToKanji);
    }
    updateBackButton(radicalModal);
    currentView = { kind: 'radical', value: radicalChar };
}

// Navigation wrappers — remember where we came from, then drill in.
function pushCurrent() {
    if (currentView) navStack.push(currentView);
}
function navToDefinition(word) { pushCurrent(); return showDefinitionView(word); }
function navToKanji(character) { pushCurrent(); return showKanjiView(character); }
function navToRadical(radicalChar) { pushCurrent(); return showRadicalView(radicalChar); }

function goBack() {
    const prev = navStack.pop();
    if (!prev) return;
    // Re-render via the core show functions, which do NOT push onto the stack.
    if (prev.kind === 'definition') showDefinitionView(prev.value);
    else if (prev.kind === 'kanji') showKanjiView(prev.value);
    else if (prev.kind === 'radical') showRadicalView(prev.value);
}

// Entry point from the analyzed text: starts a fresh navigation (empty stack).
async function handleTokenClick(token) {
    navStack = [];
    currentView = null;
    await showDefinitionView(token.baseForm);
}

// --- Kanji browser page --------------------------------------------------
// The Browse Kanji view. A single browserState object is the source of truth;
// controls only mutate it (via handleBrowserChange) and the list re-renders.
let browserState = { ...DEFAULT_FILTER_STATE };
let browserControls = null;   // { refresh } from renderBrowserControls
let browserTotal = 0;
let browserLoaded = 0;
let browserInitialized = false;
let browserLoading = false;

let flashcards = null;  // lazily-created flashcards controller

function ensureFlashcards() {
    if (!flashcards) {
        flashcards = initFlashcards(flashcardsSectionEl, { api, onOpenKanji: openKanji });
    }
}

function showView(view) {
    const prev = mainEl.dataset.view;
    mainEl.dataset.view = view;
    navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
    // Leaving flashcards: detach its keyboard shortcuts.
    if (prev === 'flashcards' && view !== 'flashcards' && flashcards) {
        flashcards.hide();
    }
    if (view === 'browse' && !browserInitialized) {
        initBrowser();
    }
    if (view === 'flashcards') {
        ensureFlashcards();
        flashcards.show();
    }
}

async function initBrowser() {
    browserInitialized = true;
    let radicals = [];
    try {
        radicals = await api.getRadicals();
    } catch (error) {
        console.error('Radical list load failed:', error);
    }
    browserControls = renderBrowserControls(browserControlsEl, {
        radicals,
        onChange: handleBrowserChange,
    });
    browserControls.refresh(browserState);
    applyFilters();
}

function handleBrowserChange(patch) {
    browserState = applyFilterPatch(browserState, patch);
    if (browserControls) browserControls.refresh(browserState);
    applyFilters();
}

async function applyFilters() {
    browserState.page = 1;
    browserLoading = true;
    renderLoading(browserListEl);
    browserMoreBtn.style.display = 'none';
    try {
        const res = await api.getKanjiList({ ...browserState, pageSize: BROWSER_PAGE_SIZE });
        browserTotal = res.total;
        browserLoaded = res.items.length;
        renderKanjiCards(browserListEl, res, { onKanjiClick: openKanji, append: false });
        updateBrowserMeta();
    } catch (error) {
        console.error('Kanji list load failed:', error);
        browserListEl.innerHTML = '<div class="kanji-section-empty">Failed to load kanji.</div>';
    } finally {
        browserLoading = false;
    }
}

async function loadMore() {
    if (browserLoading || browserLoaded >= browserTotal) return;
    browserLoading = true;
    browserState.page += 1;
    browserMoreBtn.disabled = true;
    try {
        const res = await api.getKanjiList({ ...browserState, pageSize: BROWSER_PAGE_SIZE });
        browserLoaded += res.items.length;
        renderKanjiCards(browserListEl, res, { onKanjiClick: openKanji, append: true });
        updateBrowserMeta();
    } catch (error) {
        console.error('Kanji list load-more failed:', error);
    } finally {
        browserLoading = false;
        browserMoreBtn.disabled = false;
    }
}

function updateBrowserMeta() {
    browserCountEl.textContent = browserTotal
        ? `Showing ${browserLoaded} of ${browserTotal.toLocaleString()} kanji`
        : '';
    browserMoreBtn.style.display = browserLoaded < browserTotal ? '' : 'none';
}

// Open a kanji in the shared detail modal, starting a fresh drill-in stack
// (same contract as handleTokenClick).
function openKanji(character) {
    navStack = [];
    currentView = null;
    showKanjiView(character);
}

// Start app
init();
