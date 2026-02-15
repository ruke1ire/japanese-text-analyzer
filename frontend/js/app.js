/**
 * Japanese Text Analyzer - Main Application
 */

import { JapaneseAnalyzerAPI } from './api.js';
import { renderAnalyzedText, attachTokenClickHandlers } from './components/text-display.js';
import { showDefinitionPopup, setupModalClose as setupDefModalClose } from './components/definition-popup.js';
import { showKanjiDetails, setupModalClose as setupKanjiModalClose } from './components/kanji-details.js';
import { renderHistory, generatePreview, setupHistorySidebar } from './components/history-sidebar.js';

// Initialize API client
const api = new JapaneseAnalyzerAPI();

// State
let currentTokens = [];
let currentText = '';
let analysisHistory = [];
const MAX_HISTORY_ENTRIES = 20;
let currentHistoryId = null;

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
const historySidebar = document.getElementById('history-sidebar');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

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

    // Setup token click handlers
    attachTokenClickHandlers(analyzedTextContainer, handleTokenClick);

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

async function handleTokenClick(token) {
    try {
        // Look up word definition using base form
        const wordData = await api.getWordDefinition(token.baseForm);

        // Show definition popup
        showDefinitionPopup(wordData, definitionModal, handleKanjiClick);

    } catch (error) {
        console.error('Word lookup error:', error);
        showDefinitionPopup(null, definitionModal, handleKanjiClick);
    }
}

async function handleKanjiClick(character) {
    try {
        // Close definition modal
        definitionModal.style.display = 'none';

        // Look up kanji information
        const kanjiData = await api.getKanjiInfo(character);

        // Show kanji details
        showKanjiDetails(kanjiData, kanjiModal);

    } catch (error) {
        console.error('Kanji lookup error:', error);
        showKanjiDetails(null, kanjiModal);
    }
}

// Start app
init();
